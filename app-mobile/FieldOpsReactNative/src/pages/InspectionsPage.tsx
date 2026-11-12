
import React, { useEffect, useState } from 'react';

import {
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BarChart3,
  CheckCircle2,
  Circle,
  Download,
  QrCode,
} from 'lucide-react-native';

import { InspectionCard } from '../components/InspectionCard';
import { StatusBadge } from '../components/StatusBadge';

import {
  Inspection,
  Palette,
} from '../types';

import {
  TemplateSection,
  TemplateItem,
  InspectionAnswer,
} from '../services/api';

import {
  inspectionsPageStyles as styles,
} from './InspectionsPage.styles';

type InspectionsPageProps = {
  colors: Palette;
  inspections: Inspection[];
  selected: Inspection | null;

  onOpenInspection: (inspection: Inspection) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNewInspection: () => void;
  onOpenReports: () => void;

  checklist: {
    section: TemplateSection;
    items: TemplateItem[];
  }[];

  answers: InspectionAnswer[];

  loadingChecklist: boolean;
  checklistError: string | null;

  onSaveAnswer: (
    templateItemId: number,
    value: string,
    observation: string
  ) => Promise<void>;
};

export function InspectionsPage({
  colors,
  inspections,
  selected,
  onOpenInspection,
  onBack,
  onApprove,
  onOpenReports,
  checklist,
  answers,
  loadingChecklist,
  checklistError,
  onSaveAnswer,
}: InspectionsPageProps) {

  const [draftValues, setDraftValues] = useState<Record<number, string>>({});
  const [draftObservations, setDraftObservations] = useState<Record<number, string>>({});
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  useEffect(() => {
    const values: Record<number, string> = {};
    const observations: Record<number, string> = {};

    answers.forEach((answer) => {
      values[answer.templateItemId] = String(answer.value ?? '');
      observations[answer.templateItemId] = answer.observation ?? '';
    });

    setDraftValues(values);
    setDraftObservations(observations);
  }, [answers]);

  if (selected) {
    const inspectionInformation = [
      ['Técnico', selected.technician],
      ['Data', selected.date],
      ['Prioridade', selected.priority],
      ['Equipamento', selected.equipment],
      ['Local', selected.location],
    ];

    const hasProgress =
      typeof selected.progress === 'number' &&
      Number.isFinite(selected.progress);

    const progress = hasProgress
      ? Math.min(100, Math.max(0, selected.progress!))
      : 0;

    function getAnswer(itemId: number) {
      return answers.find(
        (answer) => answer.templateItemId === itemId,
      );
    }

    function formatAnswer(answer: InspectionAnswer | undefined) {
      if (
        !answer ||
        answer.value === null ||
        answer.value === undefined ||
        answer.value === ''
      ) {
        return 'Não respondido';
      }

      if (typeof answer.value === 'boolean') {
        return answer.value ? 'Sim' : 'Não';
      }

      return String(answer.value);
    }

    async function handleSaveAnswer(item: TemplateItem) {
      const value = draftValues[item.id] ?? '';
      const observation = draftObservations[item.id] ?? '';

      if (item.required && !value.trim()) {
        Alert.alert(
          'Resposta obrigatória',
          'Preencha a resposta antes de salvar.',
        );
        return;
      }

      try {
        setSavingItemId(item.id);

        await onSaveAnswer(
          item.id,
          value,
          observation,
        );

        Alert.alert(
          'Sucesso',
          'Resposta salva com sucesso.',
        );
      } catch (error) {
        Alert.alert(
          'Erro ao salvar',
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a resposta.',
        );
      } finally {
        setSavingItemId(null);
      }
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>
            ← Voltar para inspeções
          </Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>
          {selected.id}
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>
          {selected.equipment}
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {selected.client} · {selected.location}
        </Text>

        <View style={styles.statusWrapper}>
          <StatusBadge status={selected.status} />
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.banner}>
            <View
              style={[
                styles.qr,
                { borderColor: colors.border },
              ]}
            >
              <QrCode size={44} color="#0f172a" />
            </View>

            <View style={styles.bannerText}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>
                Inspeção técnica
              </Text>

              <Text style={[styles.small, { color: colors.muted }]}>
                Modelo vinculado à versão desta inspeção.
              </Text>

              {hasProgress ? (
                <>
                  <Text style={[styles.progressLabel, { color: colors.muted }]}>
                    Progresso: {progress}%
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%` },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <Text style={[styles.small, { color: colors.muted }]}>
                  Progresso não informado.
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.panelTitleSpaced, { color: colors.text }]}>
            Checklist da inspeção
          </Text>

          {loadingChecklist ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563eb" />

              <Text style={[styles.small, { color: colors.muted, marginTop: 12 }]}>
                Carregando perguntas da inspeção...
              </Text>
            </View>
          ) : checklistError ? (
            <View style={{ padding: 12 }}>
              <Text style={{ color: '#dc2626' }}>
                {checklistError}
              </Text>
            </View>
          ) : checklist.length === 0 ? (
            <Text style={[styles.small, { color: colors.muted, padding: 12 }]}>
              Nenhuma pergunta encontrada para esta versão do modelo.
            </Text>
          ) : (
            checklist.map((group) => (
              <View key={group.section.id}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '700',
                    marginTop: 18,
                    marginBottom: 8,
                  }}
                >
                  {group.section.title}
                </Text>

                {group.section.description ? (
                  <Text
                    style={[
                      styles.small,
                      {
                        color: colors.muted,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    {group.section.description}
                  </Text>
                ) : null}

                {group.items.map((item: TemplateItem, index: number) => {
                  const answer = getAnswer(item.id);
                  const answerText = formatAnswer(answer);

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.checklistRow,
                        {
                          borderBottomColor: colors.border,
                          alignItems: 'flex-start',
                        },
                      ]}
                    >
                      <View style={{ paddingTop: 2 }}>
                        {answer ? (
                          <CheckCircle2
                            size={18}
                            color="#16a34a"
                          />
                        ) : (
                          <Circle
                            size={18}
                            color={colors.muted}
                          />
                        )}
                      </View>

                      <View style={styles.checklistText}>
                        <Text
                          style={[
                            styles.checklistTitle,
                            { color: colors.text },
                          ]}
                        >
                          {item.displayOrder ?? index + 1}. {item.label}
                          {item.required ? ' *' : ''}
                        </Text>

                        {item.description ? (
                          <Text
                            style={[
                              styles.small,
                              {
                                color: colors.muted,
                                marginTop: 4,
                              },
                            ]}
                          >
                            {item.description}
                          </Text>
                        ) : null}

                        <Text
                          style={[
                            styles.small,
                            {
                              color: answer ? '#16a34a' : colors.muted,
                              marginTop: 8,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          Resposta atual: {answerText}
                        </Text>

                        <TextInput
                          value={draftValues[item.id] ?? ''}
                          onChangeText={(value) =>
                            setDraftValues((previous) => ({
                              ...previous,
                              [item.id]: value,
                            }))
                          }
                          placeholder="Digite a resposta"
                          placeholderTextColor={colors.muted}
                          editable={savingItemId !== item.id}
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            padding: 10,
                            color: colors.text,
                            marginTop: 10,
                          }}
                        />

                        <TextInput
                          value={draftObservations[item.id] ?? ''}
                          onChangeText={(value) =>
                            setDraftObservations((previous) => ({
                              ...previous,
                              [item.id]: value,
                            }))
                          }
                          placeholder="Observação (opcional)"
                          placeholderTextColor={colors.muted}
                          multiline
                          editable={savingItemId !== item.id}
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            padding: 10,
                            color: colors.text,
                            marginTop: 8,
                            minHeight: 65,
                            textAlignVertical: 'top',
                          }}
                        />

                        <TouchableOpacity
                          disabled={savingItemId === item.id}
                          onPress={() => handleSaveAnswer(item)}
                          style={{
                            backgroundColor: '#2563eb',
                            padding: 12,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 8,
                            opacity: savingItemId === item.id ? 0.6 : 1,
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '700' }}>
                            {savingItemId === item.id
                              ? 'Salvando...'
                              : 'Salvar resposta'}
                          </Text>
                        </TouchableOpacity>

                        {item.requiresEvidence ? (
                          <Text
                            style={[
                              styles.small,
                              {
                                color: '#dc2626',
                                marginTop: 6,
                              },
                            ]}
                          >
                            Esta pergunta exige evidência fotográfica.
                          </Text>
                        ) : null}

                        {answer?.observation ? (
                          <Text
                            style={[
                              styles.small,
                              {
                                color: colors.muted,
                                marginTop: 6,
                              },
                            ]}
                          >
                            Observação salva: {answer.observation}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          <Text style={[styles.panelTitleSpaced, { color: colors.text }]}>
            Evidências
          </Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Galeria de evidências',
                'A integração de envio de fotos será conectada na próxima etapa.',
              )
            }
            style={[
              styles.evidence,
              { borderColor: colors.muted },
            ]}
          >
            <Download size={26} color={colors.muted} />

            <Text style={[styles.checklistTitle, { color: colors.muted }]}>
              Galeria de evidências
            </Text>

            <Text style={[styles.small, { color: colors.muted }]}>
              As fotos enviadas pelo técnico aparecerão aqui.
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Dados da inspeção
          </Text>

          {inspectionInformation.map(([label, value]) => (
            <View
              key={label}
              style={[
                styles.info,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.small, { color: colors.muted }]}>
                {label}
              </Text>

              <Text style={[styles.infoValue, { color: colors.text }]}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Revisão
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Revise as respostas e evidências antes de concluir a inspeção.
          </Text>

          <TouchableOpacity
            style={styles.approve}
            onPress={onApprove}
          >
            <CheckCircle2 size={17} color="#ffffff" />

            <Text style={styles.buttonText}>
              Concluir inspeção
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>
            OPERAÇÕES
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Inspeções
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Planeje, acompanhe e revise inspeções técnicas.
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onOpenReports}
          style={styles.reportButton}
        >
          <BarChart3 size={16} color="#ffffff" />

          <Text style={styles.reportButtonText}>
            Relatório
          </Text>
        </TouchableOpacity>
      </View>

      {inspections.length > 0 ? (
        inspections.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            item={inspection}
            colors={colors}
            onPress={() => onOpenInspection(inspection)}
          />
        ))
      ) : (
        <Text style={[styles.empty, { color: colors.muted }]}>
          Nenhuma inspeção encontrada.
        </Text>
      )}
    </ScrollView>
  );
}
