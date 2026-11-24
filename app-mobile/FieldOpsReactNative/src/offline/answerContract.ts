import type { ResponseType, TemplateItem } from '../services/api';

/*
|--------------------------------------------------------------------------
| CONTRATO ÚNICO DE RESPOSTAS
|--------------------------------------------------------------------------
| Mesma regra do backend (AnswerContract.java) e do Web. Validar aqui
| permite responder offline sem gerar operações que o servidor rejeitaria.
*/

export const CONFORM = 'CONFORM';
export const NONCONFORM = 'NONCONFORM';
export const NOT_APPLICABLE = 'NOT_APPLICABLE';

export type ChoiceOption = {
  value: string;
  label: string;
  color: string;
};

export const CONFORMITY_OPTIONS: ChoiceOption[] = [
  { value: CONFORM, label: 'Conforme', color: '#16a34a' },
  { value: NONCONFORM, label: 'Não conforme', color: '#dc2626' },
  { value: NOT_APPLICABLE, label: 'Não se aplica', color: '#64748b' },
];

export const BOOLEAN_OPTIONS: ChoiceOption[] = [
  { value: 'true', label: 'Sim', color: '#16a34a' },
  { value: 'false', label: 'Não', color: '#dc2626' },
];

export function choiceOptions(item: TemplateItem): ChoiceOption[] | null {
  if (item.responseType === 'CONFORMITY') return CONFORMITY_OPTIONS;
  if (item.responseType === 'BOOLEAN') return BOOLEAN_OPTIONS;

  if (item.responseType === 'SINGLE_CHOICE') {
    return (item.options ?? []).map((option) => ({
      value: option,
      label: option,
      color: '#2563eb',
    }));
  }

  return null;
}

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  TEXT_SHORT: 'Texto curto',
  TEXT_LONG: 'Texto longo',
  NUMBER: 'Número',
  BOOLEAN: 'Sim ou não',
  CONFORMITY: 'Conformidade',
  SINGLE_CHOICE: 'Seleção única',
  DATE: 'Data',
};

/**
 * Valida o valor conforme o tipo. Retorna null quando válido ou a
 * mensagem de erro.
 */
export function validateAnswer(
  item: TemplateItem,
  rawValue: string,
  observation: string,
): string | null {
  const value = rawValue.trim();

  if (!value) {
    return 'Informe a resposta.';
  }

  switch (item.responseType) {
    case 'TEXT_SHORT':
      if (value.length > 255) return 'O texto curto aceita até 255 caracteres.';
      break;

    case 'TEXT_LONG':
      if (value.length > 5000) return 'O texto longo aceita até 5000 caracteres.';
      break;

    case 'NUMBER':
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        return 'Informe um número válido (use ponto como separador decimal).';
      }
      break;

    case 'BOOLEAN':
      if (value !== 'true' && value !== 'false') return 'Selecione Sim ou Não.';
      break;

    case 'CONFORMITY':
      if (![CONFORM, NONCONFORM, NOT_APPLICABLE].includes(value)) {
        return 'Selecione Conforme, Não conforme ou Não se aplica.';
      }
      break;

    case 'SINGLE_CHOICE':
      if (!(item.options ?? []).includes(value)) {
        return 'Selecione uma das opções cadastradas.';
      }
      break;

    case 'DATE': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Use a data no formato AAAA-MM-DD.';

      const date = new Date(`${value}T00:00:00`);

      if (Number.isNaN(date.getTime())) return 'Data inválida.';
      break;
    }

    default:
      return 'Tipo de resposta não suportado.';
  }

  if (observation.trim().length > 2000) {
    return 'A observação aceita até 2000 caracteres.';
  }

  const needsObservation =
    item.requiresObservationOnNonconformity || item.criticalOnNonconformity;

  if (needsObservation && value === NONCONFORM && !observation.trim()) {
    return 'Informe uma observação para o item não conforme.';
  }

  return null;
}

/** Texto amigável da resposta armazenada. */
export function formatAnswerValue(
  item: TemplateItem,
  value: string | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return 'Não respondido';
  }

  const option = choiceOptions(item)?.find((candidate) => candidate.value === value);

  if (option) return option.label;

  if (item.responseType === 'DATE') {
    const parts = value.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
  }

  return value;
}

/** O item exige foto com a resposta informada? (RN-039) */
export function evidenceRequired(item: TemplateItem, value: string | null | undefined) {
  return (
    item.requiresEvidence ||
    (item.criticalOnNonconformity && value === NONCONFORM)
  );
}
