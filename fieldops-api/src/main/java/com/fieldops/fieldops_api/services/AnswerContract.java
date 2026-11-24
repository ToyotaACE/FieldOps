package com.fieldops.fieldops_api.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.fieldops.fieldops_api.entities.ResponseType;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.exceptions.BusinessException;

/**
 * Contrato ÚNICO de respostas entre Backend, Web e Mobile.
 *
 * TEXT_SHORT    texto até 255 caracteres
 * TEXT_LONG     texto até 5000 caracteres
 * NUMBER        número decimal com ponto (ex.: "12.5")
 * BOOLEAN       "true" ou "false"
 * CONFORMITY    "CONFORM", "NONCONFORM" ou "NOT_APPLICABLE"
 * SINGLE_CHOICE uma das opções cadastradas no item
 * DATE          data ISO "yyyy-MM-dd"
 *
 * Fotografias são evidências (inspection_evidences) vinculadas à resposta.
 */
public final class AnswerContract {

    public static final String CONFORM = "CONFORM";
    public static final String NONCONFORM = "NONCONFORM";
    public static final String NOT_APPLICABLE = "NOT_APPLICABLE";

    private static final String OPTION_SEPARATOR = "\n";

    private AnswerContract() {
    }

    /* ------------------------- opções (SINGLE_CHOICE) ------------------------- */

    public static List<String> splitOptions(String stored) {

        List<String> options = new ArrayList<>();

        if (stored == null || stored.isBlank()) {
            return options;
        }

        for (String line : stored.split(OPTION_SEPARATOR)) {
            String option = line.trim();

            if (!option.isEmpty()) {
                options.add(option);
            }
        }

        return options;
    }

    /**
     * Normaliza a lista recebida (remove vazios e duplicados) e a converte
     * para o formato de armazenamento. Retorna null quando não há opções.
     */
    public static String joinOptions(List<String> options) {

        if (options == null || options.isEmpty()) {
            return null;
        }

        Set<String> unique = new LinkedHashSet<>();

        for (String option : options) {
            if (option != null && !option.trim().isEmpty()) {
                unique.add(option.trim().replace("\n", " "));
            }
        }

        return unique.isEmpty()
                ? null
                : String.join(OPTION_SEPARATOR, unique);
    }

    /* ---------------------------- validação ---------------------------- */

    /**
     * Valida e normaliza o valor de uma resposta conforme o tipo do item.
     * Retorna o valor que deve ser persistido.
     */
    public static String validate(TemplateItem item, String rawValue) {

        if (rawValue == null || rawValue.trim().isEmpty()) {
            throw new BusinessException(
                    "A resposta do item '" + item.getLabel()
                            + "' não pode estar vazia."
            );
        }

        String value = rawValue.trim();
        ResponseType type = item.getResponseType();

        switch (type) {
            case TEXT_SHORT:
                if (value.length() > 255) {
                    throw invalid(item, "o texto curto aceita até 255 caracteres.");
                }
                return value;

            case TEXT_LONG:
                if (value.length() > 5000) {
                    throw invalid(item, "o texto longo aceita até 5000 caracteres.");
                }
                return value;

            case NUMBER:
                try {
                    new BigDecimal(value);
                } catch (NumberFormatException exception) {
                    throw invalid(item, "informe um número válido (use ponto como separador decimal).");
                }
                return value;

            case BOOLEAN:
                if (!"true".equals(value) && !"false".equals(value)) {
                    throw invalid(item, "use \"true\" ou \"false\".");
                }
                return value;

            case CONFORMITY:
                if (!CONFORM.equals(value)
                        && !NONCONFORM.equals(value)
                        && !NOT_APPLICABLE.equals(value)) {
                    throw invalid(item, "use CONFORM, NONCONFORM ou NOT_APPLICABLE.");
                }
                return value;

            case SINGLE_CHOICE:
                if (!splitOptions(item.getOptions()).contains(value)) {
                    throw invalid(item, "a opção \"" + value + "\" não está cadastrada neste item.");
                }
                return value;

            case DATE:
                try {
                    LocalDate.parse(value);
                } catch (DateTimeParseException exception) {
                    throw invalid(item, "use a data no formato AAAA-MM-DD.");
                }
                return value;

            default:
                throw invalid(item, "tipo de resposta não suportado.");
        }
    }

    public static boolean isNonConformity(String value) {
        return NONCONFORM.equals(value);
    }

    private static BusinessException invalid(TemplateItem item, String detail) {
        return new BusinessException(
                "Resposta inválida para o item '" + item.getLabel() + "': " + detail
        );
    }
}
