
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Play,
  QrCode,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react-native';

import { EvidenceGallery } from '../components/EvidenceGallery';
import { InspectionCard } from '../components/InspectionCard';
import { PageContent } from '../components/PageContent';
import { QrScannerModal } from '../components/QrScannerModal';
import { StatusBadge } from '../components/StatusBadge';
import { SyncBadge } from '../components/SyncBadge';

import { Inspection, Palette, Priority, Status } from '../types';

import {
  approveInspection,
  rejectInspection,
  startInspectionReview,
  SESSION_INVALID,
  type AuthUser,
  type TemplateItem,
} from '../services/api';

import { formatDateTimeBR, formatInspectionCode } from '../services/mappers';

import {
  choiceOptions,
  evidenceRequired,
  formatAnswerValue,
  NONCONFORM,
  validateAnswer,
} from '../offline/answerContract';

import { useLocalQuery } from '../offline/hooks';
import { captureExecution } from '../offline/location';
import * as repo from '../offline/repository';
import { deriveSyncState, syncEngine } from '../offline/syncEngine';

import { inspectionsPageStyles as styles } from './InspectionsPage.styles';

type InspectionsPageProps = {
  colors: Palette;
  inspections: Inspection[];
  selected: Inspection | null;

  user: AuthUser;
  token: string | null;
  online: boolean;

  onOpenInspection: (inspection: Inspection) => void;
  onBack: () => void;
  onOpenReports: (inspectionId?: number) => void;
  onSessionExpired: () => void;
  embedded?: boolean;
};

/* ======================================================================= */
/* LISTA                                                                   */
/* ======================================================================= */

type DateFilter = 'Todas' | 'Hoje' | 'Próximos 7 dias' | 'Atrasadas';

function todayKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function Chip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: Palette;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? '#2563eb' : colors.border,
        backgroundColor: active ? '#dbeafe' : 'transparent',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#1d4ed8' : colors.muted }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InspectionList({
  colors,
  inspections,
  onOpenInspection,
  onOpenReports,
  embedded,
  isTechnician,
}: {
  colors: Palette;
  inspections: Inspection[];
  onOpenInspection: (inspection: Inspection) => void;
  onOpenReports: (inspectionId?: number) => void;
  embedded: boolean;
  isTechnician: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<'Todas' | Status>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<'Todas' | Priority>('Todas');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Todas');

  const filtered = useMemo(() => {
    const today = todayKey();
    const week = todayKey(7);

    return inspections.filter((inspection) => {
      if (statusFilter !== 'Todas' && inspection.status !== statusFilter) return false;
      if (priorityFilter !== 'Todas' && inspection.priority !== priorityFilter) return false;

      const day = inspection.scheduledDate;

      if (dateFilter === 'Hoje' && day !== today) return false;
      if (dateFilter === 'Próximos 7 dias' && (day < today || day > week)) return false;

      if (
        dateFilter === 'Atrasadas' &&
        !(day < today && (inspection.backendStatus === 'SCHEDULED' || inspection.backendStatus === 'IN_PROGRESS'))
      ) {
        return false;
      }

      return true;
    });
  }, [inspections, statusFilter, priorityFilter, dateFilter]);

  const resume = inspections.filter((inspection) => inspection.backendStatus === 'IN_PROGRESS');

  return (
    <PageContent embedded={embedded} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>OPERAÇÕES</Text>

          <Text style={[styles.title, { color: colors.text }]}>
            {isTechnician ? 'Minhas inspeções' : 'Inspeções'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isTechnician
              ? 'Inspeções atribuídas a você. Funciona mesmo sem internet.'
              : 'Acompanhe e revise as inspeções técnicas.'}
          </Text>
        </View>

        {isTechnician && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => onOpenReports()}
            style={styles.reportButton}
          >
            <BarChart3 size={16} color="#ffffff" />
            <Text style={styles.reportButtonText}>Não conformidade</Text>
          </TouchableOpacity>
        )}
      </View>

      {resume.length > 0 && (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: '#eff6ff',
            borderWidth: 1,
            borderColor: '#bfdbfe',
          }}
        >
          <Text style={{ color: '#1e3a8a', fontWeight: '800', fontSize: 12 }}>
            Em andamento ({resume.length})
          </Text>

          {resume.slice(0, 3).map((inspection) => (
            <TouchableOpacity key={inspection.id} onPress={() => onOpenInspection(inspection)} style={{ marginTop: 6 }}>
              <Text style={{ color: '#1d4ed8', fontSize: 12 }}>
                Continuar {formatInspectionCode(inspection.id)} · {inspection.equipment}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {(['Todas', 'Agendada', 'Em andamento', 'Concluída', 'Aguardando revisão', 'Aprovada', 'Reprovada', 'Cancelada'] as const).map((value) => (
          <Chip key={value} label={value} active={statusFilter === value} onPress={() => setStatusFilter(value)} colors={colors} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {(['Todas', 'Baixa', 'Normal', 'Alta', 'Crítica'] as const).map((value) => (
          <Chip
            key={value}
            label={value === 'Todas' ? 'Toda prioridade' : value}
            active={priorityFilter === value}
            onPress={() => setPriorityFilter(value)}
            colors={colors}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 6 }}>
        {(['Todas', 'Hoje', 'Próximos 7 dias', 'Atrasadas'] as const).map((value) => (
          <Chip
            key={value}
            label={value === 'Todas' ? 'Qualquer data' : value}
            active={dateFilter === value}
            onPress={() => setDateFilter(value)}
            colors={colors}
          />
        ))}
      </View>

      {filtered.length > 0 ? (
        filtered.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            item={inspection}
            colors={colors}
            onPress={() => onOpenInspection(inspection)}
          />
        ))
      ) : (
        <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
          <Search size={24} color={colors.muted} />

          <Text style={[styles.empty, { color: colors.muted }]}>
            {inspections.length === 0
              ? 'Nenhuma inspeção baixada. Conecte-se à internet para receber as inspeções atribuídas.'
              : 'Nenhuma inspeção encontrada com os filtros selecionados.'}
          </Text>
        </View>
      )}
    </PageContent>
  );
}

/* ======================================================================= */
/* ITEM DO CHECKLIST (salvamento automático local)                         */
/* ======================================================================= */

function ChecklistItemRow({
  colors,
  item,
  index,
  answer,
  canEdit,
  userId,
  inspectionId,
  localEvidences,
  serverEvidences,
  token,
  online,
}: {
  colors: Palette;
  item: TemplateItem;
  index: number;
  answer: repo.LocalAnswer | undefined;
  canEdit: boolean;
  userId: number;
  inspectionId: number;
  localEvidences: repo.LocalEvidence[];
  serverEvidences: repo.InspectionDetail['serverEvidences'];
  token: string | null;
  online: boolean;
}) {
  const [value, setValue] = useState(answer?.value ?? '');
  const [observation, setObservation] = useState(answer?.observation ?? '');
  const [validation, setValidation] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Atualiza o rascunho quando o dado gravado muda (ex.: download).
  useEffect(() => {
    if (!dirty) {
      setValue(answer?.value ?? '');
      setObservation(answer?.observation ?? '');
    }
  }, [answer?.value, answer?.observation, dirty]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function persist(nextValue: string, nextObservation: string) {
    if (!nextValue.trim()) {
      setValidation(item.required ? 'Resposta obrigatória.' : null);
      return;
    }

    const error = validateAnswer(item, nextValue, nextObservation);

    setValidation(error);

    if (error) return;

    if (
      nextValue.trim() === (answer?.value ?? '') &&
      (nextObservation.trim() || null) === (answer?.observation ?? null)
    ) {
      setDirty(false);
      return;
    }

    try {
      await repo.saveAnswer(userId, inspectionId, item, nextValue.trim(), nextObservation);
      setDirty(false);
    } catch (saveError) {
      Alert.alert(
        'Erro ao salvar no aparelho',
        saveError instanceof Error ? saveError.message : 'Não foi possível salvar a resposta.',
      );
    }
  }

  function schedule(nextValue: string, nextObservation: string) {
    setDirty(true);

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      void persist(nextValue, nextObservation);
    }, 1200);
  }

  const options = choiceOptions(item);
  const isNonConform = (answer?.value ?? value) === NONCONFORM;
  const needsEvidence = evidenceRequired(item, answer?.value ?? value);

  const itemServerEvidences = answer?.serverAnswerId
    ? serverEvidences.filter((evidence) => evidence.answerId === answer.serverAnswerId)
    : [];

  const itemLocalEvidences = localEvidences.filter((evidence) => evidence.templateItemId === item.id);

  const answerSyncLabel = !answer
    ? null
    : answer.syncState === 'SYNCED'
      ? 'Sincronizado'
      : answer.syncState === 'ERROR'
        ? `Erro: ${answer.lastError ?? 'rejeitado pelo servidor'}`
        : 'Salvo no aparelho · aguardando envio';

  return (
    <View
      style={[
        styles.checklistRow,
        { borderBottomColor: colors.border, alignItems: 'flex-start' },
      ]}
    >
      <View style={{ paddingTop: 2 }}>
        {answer?.value ? (
          <CheckCircle2 size={18} color={isNonConform ? '#dc2626' : '#16a34a'} />
        ) : (
          <Circle size={18} color={colors.muted} />
        )}
      </View>

      <View style={styles.checklistText}>
        <Text style={[styles.checklistTitle, { color: colors.text }]}>
          {item.displayOrder ?? index + 1}. {item.label}
          {item.required ? ' *' : ''}
        </Text>

        {item.description ? (
          <Text style={[styles.small, { color: colors.muted, marginTop: 4 }]}>
            {item.description}
          </Text>
        ) : null}

        {!canEdit && (
          <Text
            style={[
              styles.small,
              {
                color: answer?.value ? (isNonConform ? '#dc2626' : '#16a34a') : colors.muted,
                marginTop: 8,
                fontWeight: '600',
              },
            ]}
          >
            Resposta: {formatAnswerValue(item, answer?.value)}
          </Text>
        )}

        {canEdit && options ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {options.map((option) => {
              const active = value === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setValue(option.value);
                    setDirty(true);
                    void persist(option.value, observation);
                  }}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: active ? option.color : colors.border,
                    backgroundColor: active ? option.color : 'transparent',
                  }}
                >
                  <Text style={{ color: active ? '#ffffff' : colors.text, fontWeight: '700', fontSize: 12 }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {item.responseType === 'SINGLE_CHOICE' && options.length === 0 && (
              <Text style={{ color: '#dc2626', fontSize: 11 }}>
                Este item não possui opções cadastradas.
              </Text>
            )}
          </View>
        ) : null}

        {canEdit && !options ? (
          <TextInput
            value={value}
            onChangeText={(next) => {
              setValue(next);
              schedule(next, observation);
            }}
            onBlur={() => void persist(value, observation)}
            placeholder={
              item.responseType === 'DATE'
                ? 'AAAA-MM-DD'
                : item.responseType === 'NUMBER'
                  ? 'Número (ex.: 12.5)'
                  : 'Digite a resposta'
            }
            placeholderTextColor={colors.muted}
            keyboardType={item.responseType === 'NUMBER' ? 'decimal-pad' : 'default'}
            multiline={item.responseType === 'TEXT_LONG'}
            maxLength={item.responseType === 'TEXT_SHORT' ? 255 : 5000}
            style={{
              borderWidth: 1,
              borderColor: validation ? '#dc2626' : colors.border,
              borderRadius: 8,
              padding: 10,
              color: colors.text,
              marginTop: 10,
              minHeight: item.responseType === 'TEXT_LONG' ? 80 : undefined,
              textAlignVertical: item.responseType === 'TEXT_LONG' ? 'top' : 'center',
            }}
          />
        ) : null}

        {canEdit ? (
          <TextInput
            value={observation}
            onChangeText={(next) => {
              setObservation(next);
              schedule(value, next);
            }}
            onBlur={() => void persist(value, observation)}
            placeholder={
              item.requiresObservationOnNonconformity || item.criticalOnNonconformity
                ? 'Observação (obrigatória se não conforme)'
                : 'Observação (opcional)'
            }
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 10,
              color: colors.text,
              marginTop: 8,
              minHeight: 60,
              textAlignVertical: 'top',
            }}
          />
        ) : answer?.observation ? (
          <Text style={[styles.small, { color: colors.muted, marginTop: 6 }]}>
            Observação: {answer.observation}
          </Text>
        ) : null}

        {validation ? (
          <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 6 }}>{validation}</Text>
        ) : null}

        {answerSyncLabel ? (
          <Text
            style={{
              fontSize: 10,
              marginTop: 6,
              color: answer?.syncState === 'ERROR' ? '#dc2626' : answer?.syncState === 'SYNCED' ? '#16a34a' : '#a16207',
            }}
          >
            {answerSyncLabel}
          </Text>
        ) : null}

        {needsEvidence ? (
          <Text style={[styles.small, { color: '#dc2626', marginTop: 6 }]}>
            {item.requiresEvidence
              ? 'Esta pergunta exige evidência fotográfica.'
              : 'Item crítico não conforme: anexe ao menos uma foto.'}
          </Text>
        ) : null}

        {(needsEvidence || itemLocalEvidences.length > 0 || itemServerEvidences.length > 0) && (
          <EvidenceGallery
            colors={colors}
            token={token}
            online={online}
            localEvidences={itemLocalEvidences}
            serverEvidences={itemServerEvidences}
            canAdd={canEdit && Boolean(answer?.value)}
            onAdd={(photo) => repo.addAnswerEvidence(inspectionId, item.id, photo)}
            onDiscard={(localId) => void repo.discardEvidence(localId)}
          />
        )}

        {canEdit && needsEvidence && !answer?.value ? (
          <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>
            Responda o item para poder anexar fotos.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ======================================================================= */
/* DETALHE / EXECUÇÃO                                                      */
/* ======================================================================= */

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

function InspectionDetailView({
  colors,
  selected,
  user,
  token,
  online,
  onBack,
  onOpenReports,
  onSessionExpired,
  embedded,
}: {
  colors: Palette;
  selected: Inspection;
  user: AuthUser;
  token: string | null;
  online: boolean;
  onBack: () => void;
  onOpenReports: (inspectionId?: number) => void;
  onSessionExpired: () => void;
  embedded: boolean;
}) {
  const inspectionId = Number(selected.id);

  const { data: detail, loading } = useLocalQuery(
    () => repo.getInspectionDetail(user.id, inspectionId),
    null as repo.InspectionDetail | null,
    [user.id, inspectionId],
  );

  const [scannerOpen, setScannerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Online: atualiza o pacote ao abrir (respostas e status mais recentes).
  useEffect(() => {
    if (online) void syncEngine.refreshInspection(inspectionId);
  }, [inspectionId, online]);

  if (loading && !detail) {
    return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!detail) {
    return (
      <PageContent embedded={embedded} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Voltar para inspeções</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.muted }}>
          Esta inspeção não está disponível no aparelho. Sincronize com a internet ligada.
        </Text>
      </PageContent>
    );
  }

  const status = detail.inspection.status;
  const isTechnician = user.role === 'TECHNICIAN';
  const isSupervisor = user.role === 'SUPERVISOR';
  const canEdit = isTechnician && status === 'IN_PROGRESS';
  const data = detail.inspection.data;

  const syncState = deriveSyncState(detail.inspection.pending, online, false);

  const totalItems = detail.sections.reduce((total, group) => total + group.items.length, 0);
  const answeredItems = detail.inspection.answeredCount;
  const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  function evidenceCountFor(itemId: number) {
    const answer = detail!.answers[itemId];

    const local = detail!.localEvidences.filter((evidence) => evidence.templateItemId === itemId).length;
    const server = answer?.serverAnswerId
      ? detail!.serverEvidences.filter((evidence) => evidence.answerId === answer.serverAnswerId).length
      : 0;

    return local + server;
  }

  /* ----------------------------- iniciar ----------------------------- */

  async function doStart() {
    try {
      setBusy(true);

      const captured = await captureExecution();

      await repo.startInspection(user.id, inspectionId, captured.execution);

      Alert.alert(
        'Inspeção iniciada',
        [
          online
            ? 'O início será enviado ao servidor agora.'
            : 'Você está sem internet. O início foi salvo no aparelho e será enviado automaticamente.',
          captured.locationStatus === 'OK'
            ? 'Localização registrada.'
            : captured.locationStatus === 'NEGADA'
              ? 'Localização não registrada (permissão negada).'
              : 'Localização indisponível no momento.',
        ].join('\n'),
      );
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível iniciar.');
    } finally {
      setBusy(false);
    }
  }

  function requestStart() {
    if (data.equipmentQrCode && !detail!.inspection.qrValidated) {
      Alert.alert(
        'Identificar equipamento',
        'Leia o QR Code do equipamento para confirmar que você está no equipamento correto.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar sem leitura',
            onPress: () =>
              Alert.alert(
                'Confirmar equipamento',
                `Confirme que você está no equipamento "${data.equipmentName}".`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Confirmar e iniciar', onPress: () => void doStart() },
                ],
              ),
          },
          { text: 'Ler QR Code', onPress: () => setScannerOpen(true) },
        ],
      );
      return;
    }

    Alert.alert('Iniciar inspeção', 'Deseja iniciar esta inspeção agora?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Iniciar', onPress: () => void doStart() },
    ]);
  }

  async function handleScanned(scanned: string) {
    setScannerOpen(false);

    if (scanned === data.equipmentQrCode) {
      await repo.setQrValidated(inspectionId, true);

      Alert.alert('Equipamento confirmado', `${data.equipmentName} identificado.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar inspeção', onPress: () => void doStart() },
      ]);
      return;
    }

    // RN-064: divergência informada antes de continuar.
    Alert.alert(
      'Equipamento divergente',
      `O QR Code lido (${scanned}) não corresponde ao equipamento previsto (${data.equipmentQrCode}).`,
      [
        { text: 'Ler novamente', onPress: () => setScannerOpen(true) },
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar mesmo assim', style: 'destructive', onPress: () => void doStart() },
      ],
    );
  }

  /* ----------------------------- concluir ----------------------------- */

  function completionProblems(): string[] {
    const problems: string[] = [];

    detail!.sections.forEach((group) => {
      group.items.forEach((item) => {
        const answer = detail!.answers[item.id];

        if (item.required && !answer?.value) {
          problems.push(`Responda: ${item.label}`);
          return;
        }

        if (answer?.value && evidenceRequired(item, answer.value) && evidenceCountFor(item.id) === 0) {
          problems.push(`Anexe foto: ${item.label}`);
        }

        if (answer?.syncState === 'ERROR') {
          problems.push(`Resposta rejeitada pelo servidor: ${item.label}`);
        }
      });
    });

    detail!.localNonConformities.forEach((nc) => {
      if (nc.payload.severity === 'CRITICAL') {
        const photos = detail!.localEvidences.filter((evidence) => evidence.ncLocalId === nc.localId).length;

        if (photos === 0) problems.push(`Não conformidade crítica sem foto: ${nc.payload.description}`);
      }
    });

    return problems;
  }

  async function doComplete() {
    try {
      setBusy(true);

      const captured = await captureExecution();

      await repo.completeInspection(user.id, inspectionId, captured.execution);

      Alert.alert(
        'Inspeção concluída',
        online
          ? 'As respostas e fotos estão sendo enviadas. Acompanhe o indicador de sincronização.'
          : 'Inspeção concluída no aparelho. Tudo será enviado automaticamente quando a internet voltar.',
      );
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  }

  function requestComplete() {
    const problems = completionProblems();

    if (problems.length > 0) {
      Alert.alert(
        'Não é possível concluir',
        problems.slice(0, 8).join('\n') + (problems.length > 8 ? `\n... e mais ${problems.length - 8}` : ''),
      );
      return;
    }

    Alert.alert(
      'Concluir inspeção',
      'Após concluir, as respostas ficarão bloqueadas. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Concluir', onPress: () => void doComplete() },
      ],
    );
  }

  function requestReopen() {
    Alert.alert(
      'Corrigir inspeção',
      'A inspeção voltará para "Em andamento" para que você corrija as respostas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reabrir', onPress: () => void repo.reopenInspection(user.id, inspectionId) },
      ],
    );
  }

  /* ------------------------ revisão (supervisor) ----------------------- */

  async function runReview(action: () => Promise<unknown>, success: string) {
    if (!token || !online) {
      Alert.alert('Sem conexão', 'A revisão precisa de internet.');
      return;
    }

    try {
      setBusy(true);
      await action();
      await syncEngine.refreshInspection(inspectionId);
      setReviewComment('');
      setRejectReason('');
      Alert.alert('Sucesso', success);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na operação.';

      if (message === SESSION_INVALID) onSessionExpired();
      else Alert.alert('Não foi possível concluir', message);
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------- tela ------------------------------- */

  const inspectionInformation: [string, string][] = [
    ['Título', data.title],
    ['Cliente', data.clientName],
    ['Local', data.siteName],
    ['Equipamento', data.equipmentName],
    ['QR Code previsto', data.equipmentQrCode ?? '—'],
    ['Técnico', data.technicianName],
    ['Data prevista', selected.date],
    ['Prioridade', selected.priority],
    ['Iniciada em', formatDateTimeBR(data.startedAt) || '—'],
    ['Concluída em', formatDateTimeBR(data.completedAt) || '—'],
  ];

  const allNonConformities = [
    ...detail.localNonConformities.map((nc) => ({
      key: nc.localId,
      severity: nc.payload.severity,
      description: nc.payload.description,
      state: nc.state === 'SYNCED' ? 'Sincronizada' : nc.state === 'ERROR' ? 'Erro no envio' : 'Aguardando envio',
    })),
    ...detail.serverNonConformities.map((nc) => ({
      key: `s-${nc.id}`,
      severity: nc.severity,
      description: nc.description,
      state: 'Sincronizada',
    })),
  ];

  return (
    <PageContent embedded={embedded} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Voltar para inspeções</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>{formatInspectionCode(selected.id)}</Text>

      <Text style={[styles.title, { color: colors.text }]}>{data.equipmentName}</Text>

      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {data.clientName} · {data.siteName}
      </Text>

      <View style={[styles.statusWrapper, { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }]}>
        <StatusBadge status={selected.status} />
        <SyncBadge state={syncState} count={selected.pendingCount} />
      </View>

      {data.instructions ? (
        <View style={{ marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: '#eff6ff' }}>
          <Text style={{ color: '#1e3a8a', fontSize: 12 }}>
            <Text style={{ fontWeight: '800' }}>Instruções: </Text>
            {data.instructions}
          </Text>
        </View>
      ) : null}

      {status === 'REJECTED' && data.reviewComment ? (
        <View style={{ marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: '#fef2f2' }}>
          <Text style={{ color: '#991b1b', fontSize: 12 }}>
            <Text style={{ fontWeight: '800' }}>Motivo da reprovação: </Text>
            {data.reviewComment}
          </Text>
        </View>
      ) : null}

      {status === 'CANCELLED' && data.cancelReason ? (
        <View style={{ marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: '#f1f5f9' }}>
          <Text style={{ color: '#334155', fontSize: 12 }}>
            <Text style={{ fontWeight: '800' }}>Cancelada: </Text>
            {data.cancelReason}
          </Text>
        </View>
      ) : null}

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.banner}>
          <View style={[styles.qr, { borderColor: colors.border }]}>
            <QrCode size={44} color={detail.inspection.qrValidated ? '#16a34a' : '#0f172a'} />
          </View>

          <View style={styles.bannerText}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Checklist</Text>

            <Text style={[styles.small, { color: colors.muted }]}>
              {detail.inspection.qrValidated ? 'Equipamento confirmado por QR Code.' : 'Versão do modelo definida pelo supervisor.'}
            </Text>

            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              Progresso: {progress}% ({answeredItems}/{totalItems})
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {isTechnician && status === 'SCHEDULED' && (
          <Text style={[styles.small, { color: colors.muted, marginTop: 12 }]}>
            Inicie a inspeção para responder o checklist.
          </Text>
        )}

        {detail.sections.length === 0 ? (
          <Text style={[styles.small, { color: colors.muted, padding: 12 }]}>
            O checklist ainda não foi baixado. Conecte-se à internet para recebê-lo.
          </Text>
        ) : (
          detail.sections.map((group) => (
            <View key={group.section.id}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 18, marginBottom: 8 }}>
                {group.section.title}
              </Text>

              {group.section.description ? (
                <Text style={[styles.small, { color: colors.muted, marginBottom: 8 }]}>
                  {group.section.description}
                </Text>
              ) : null}

              {group.items.map((item, index) => (
                <ChecklistItemRow
                  key={item.id}
                  colors={colors}
                  item={item}
                  index={index}
                  answer={detail.answers[item.id]}
                  canEdit={canEdit}
                  userId={user.id}
                  inspectionId={inspectionId}
                  localEvidences={detail.localEvidences}
                  serverEvidences={detail.serverEvidences}
                  token={token}
                  online={online}
                />
              ))}
            </View>
          ))
        )}
      </View>

      {/* NÃO CONFORMIDADES */}
      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Não conformidades</Text>

        {allNonConformities.length === 0 && (
          <Text style={[styles.small, { color: colors.muted }]}>Nenhuma não conformidade registrada.</Text>
        )}

        {allNonConformities.map((nc) => (
          <View key={nc.key} style={[styles.info, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              <AlertTriangle size={14} color="#dc2626" />
              <Text style={[styles.small, { color: colors.text, flex: 1 }]}>
                {SEVERITY_LABELS[nc.severity] ?? nc.severity} · {nc.description}
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.muted, flex: 0 }]}>{nc.state}</Text>
          </View>
        ))}

        {canEdit && (
          <TouchableOpacity
            style={[styles.approve, { backgroundColor: '#dc2626' }]}
            onPress={() => onOpenReports(inspectionId)}
          >
            <AlertTriangle size={17} color="#ffffff" />
            <Text style={styles.buttonText}>Registrar não conformidade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DADOS */}
      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Dados da inspeção</Text>

        {inspectionInformation.map(([label, value]) => (
          <View key={label} style={[styles.info, { borderBottomColor: colors.border }]}>
            <Text style={[styles.small, { color: colors.muted }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* AÇÕES */}
      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Andamento</Text>

        {isTechnician && status === 'SCHEDULED' && (
          <TouchableOpacity disabled={busy} style={[styles.approve, { opacity: busy ? 0.6 : 1 }]} onPress={requestStart}>
            <Play size={17} color="#ffffff" />
            <Text style={styles.buttonText}>{busy ? 'Aguarde...' : 'Iniciar inspeção'}</Text>
          </TouchableOpacity>
        )}

        {isTechnician && status === 'IN_PROGRESS' && (
          <>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              As respostas são salvas automaticamente no aparelho.
            </Text>

            <TouchableOpacity disabled={busy} style={[styles.approve, { opacity: busy ? 0.6 : 1 }]} onPress={requestComplete}>
              <CheckCircle2 size={17} color="#ffffff" />
              <Text style={styles.buttonText}>{busy ? 'Aguarde...' : 'Concluir inspeção'}</Text>
            </TouchableOpacity>
          </>
        )}

        {isTechnician && status === 'REJECTED' && (
          <TouchableOpacity disabled={busy} style={styles.approve} onPress={requestReopen}>
            <RotateCcw size={17} color="#ffffff" />
            <Text style={styles.buttonText}>Corrigir inspeção</Text>
          </TouchableOpacity>
        )}

        {isTechnician && status === 'COMPLETED' && (
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {syncState === 'SINCRONIZADO'
              ? 'Inspeção enviada. Aguardando revisão do supervisor.'
              : 'Inspeção concluída no aparelho. O envio é feito automaticamente.'}
          </Text>
        )}

        {isSupervisor && status === 'COMPLETED' && (
          <TouchableOpacity
            disabled={busy}
            style={styles.approve}
            onPress={() => void runReview(() => startInspectionReview(token as string, inspectionId), 'Revisão iniciada.')}
          >
            <ClipboardCheck size={17} color="#ffffff" />
            <Text style={styles.buttonText}>Iniciar revisão</Text>
          </TouchableOpacity>
        )}

        {isSupervisor && status === 'UNDER_REVIEW' && (
          <>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Comentário da aprovação (opcional)"
              placeholderTextColor={colors.muted}
              multiline
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginTop: 10 }}
            />

            <TouchableOpacity
              disabled={busy}
              style={styles.approve}
              onPress={() => void runReview(() => approveInspection(token as string, inspectionId, reviewComment), 'Inspeção aprovada.')}
            >
              <CheckCircle2 size={17} color="#ffffff" />
              <Text style={styles.buttonText}>Aprovar</Text>
            </TouchableOpacity>

            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Motivo da reprovação (obrigatório)"
              placeholderTextColor={colors.muted}
              multiline
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginTop: 14 }}
            />

            <TouchableOpacity
              disabled={busy}
              style={[styles.approve, { backgroundColor: '#dc2626' }]}
              onPress={() => {
                if (!rejectReason.trim()) {
                  Alert.alert('Motivo obrigatório', 'Informe o motivo da reprovação.');
                  return;
                }

                void runReview(() => rejectInspection(token as string, inspectionId, rejectReason.trim()), 'Inspeção reprovada.');
              }}
            >
              <XCircle size={17} color="#ffffff" />
              <Text style={styles.buttonText}>Reprovar</Text>
            </TouchableOpacity>
          </>
        )}

        {!isTechnician && !isSupervisor && (
          <Text style={[styles.subtitle, { color: colors.muted }]}>Consulta somente leitura.</Text>
        )}
      </View>

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(value) => void handleScanned(value)}
      />
    </PageContent>
  );
}

/* ======================================================================= */
/* COMPONENTE PÚBLICO                                                      */
/* ======================================================================= */

export function InspectionsPage({
  colors,
  inspections,
  selected,
  user,
  token,
  online,
  onOpenInspection,
  onBack,
  onOpenReports,
  onSessionExpired,
  embedded = false,
}: InspectionsPageProps) {
  if (selected) {
    return (
      <InspectionDetailView
        colors={colors}
        selected={selected}
        user={user}
        token={token}
        online={online}
        onBack={onBack}
        onOpenReports={onOpenReports}
        onSessionExpired={onSessionExpired}
        embedded={embedded}
      />
    );
  }

  return (
    <InspectionList
      colors={colors}
      inspections={inspections}
      onOpenInspection={onOpenInspection}
      onOpenReports={onOpenReports}
      embedded={embedded}
      isTechnician={user.role === 'TECHNICIAN'}
    />
  );
}
