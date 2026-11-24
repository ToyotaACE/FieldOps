import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Camera, CheckCircle2, ClipboardCheck, Clock3,
  History, LoaderCircle, MapPin, RefreshCw, ShieldCheck, X, XCircle,
} from 'lucide-react';
import './InspectionReviewPanel.css';

/* ------------------------------------------------------------------ */
/* Tipos (espelham os DTOs do backend: InspectionPackageDTO)          */
/* ------------------------------------------------------------------ */

type InspectionStatus =
  | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_REVIEW'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED';

type ResponseType =
  | 'TEXT_SHORT' | 'TEXT_LONG' | 'NUMBER' | 'BOOLEAN'
  | 'CONFORMITY' | 'SINGLE_CHOICE' | 'DATE';

type InspectionDto = {
  id: number;
  title: string;
  instructions?: string | null;
  clientName: string;
  siteName: string;
  equipmentName: string;
  technicianName: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  priority?: string | null;
  status: InspectionStatus;
  startedAt?: string | null;
  startedAtDevice?: string | null;
  completedAt?: string | null;
  completedAtDevice?: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  startAccuracy?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  endAccuracy?: number | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  cancelledByName?: string | null;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewComment?: string | null;
};

type ItemDto = {
  id: number;
  label: string;
  description?: string | null;
  responseType: ResponseType;
  required: boolean;
  requiresEvidence: boolean;
  criticalOnNonconformity: boolean;
  displayOrder: number;
  options?: string[] | null;
};

type SectionDto = {
  id: number;
  title: string;
  description?: string | null;
  displayOrder: number;
  items: ItemDto[];
};

type AnswerDto = {
  id: number;
  templateItemId: number;
  value: string | null;
  observation: string | null;
  updatedAt?: string | null;
};

type EvidenceDto = {
  id: number;
  answerId: number | null;
  nonConformityId: number | null;
  originalFilename: string;
  contentType?: string | null;
};

type NonConformityDto = {
  id: number;
  templateItemId?: number | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  type?: string | null;
  description: string;
  probableCause?: string | null;
  recommendedAction?: string | null;
  technicalNotes?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
};

type HistoryDto = {
  id: number;
  action: string;
  actorName?: string | null;
  description?: string | null;
  createdAt: string;
};

type PackageDto = {
  inspection: InspectionDto;
  sections: SectionDto[];
  answers: AnswerDto[];
  evidences: EvidenceDto[];
  nonConformities: NonConformityDto[];
  history: HistoryDto[];
};

type Me = { role: 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' };

/* ------------------------------------------------------------------ */
/* API                                                                */
/* ------------------------------------------------------------------ */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

function token() {
  return localStorage.getItem('fieldops_token') || sessionStorage.getItem('fieldops_token');
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = token();

  if (!accessToken) {
    throw new Error('Sessão não encontrada. Entre novamente no FieldOps.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || raw || `Erro HTTP ${response.status}.`);
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/* Formatação                                                         */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<InspectionStatus, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída (aguardando revisão)',
  UNDER_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELLED: 'Cancelada',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa', NORMAL: 'Normal', HIGH: 'Alta', CRITICAL: 'Crítica',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criação', UPDATE: 'Atualização', STATUS_CHANGE: 'Mudança de status',
  PUBLISH: 'Publicação', LOGIN: 'Acesso',
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const parts = value.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function formatAnswer(item: ItemDto, value: string | null) {
  if (value === null || value === undefined || value === '') return 'Não respondido';

  switch (item.responseType) {
    case 'CONFORMITY':
      if (value === 'CONFORM') return 'Conforme';
      if (value === 'NONCONFORM') return 'Não conforme';
      if (value === 'NOT_APPLICABLE') return 'Não se aplica';
      return value;
    case 'BOOLEAN':
      return value === 'true' ? 'Sim' : value === 'false' ? 'Não' : value;
    case 'DATE':
      return formatDate(value);
    default:
      return value;
  }
}

function answerTone(item: ItemDto, value: string | null) {
  if (!value) return 'empty';
  if (item.responseType === 'CONFORMITY') {
    if (value === 'NONCONFORM') return 'bad';
    if (value === 'CONFORM') return 'good';
  }
  return 'neutral';
}

function mapsLink(lat?: number | null, lng?: number | null) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

/* ------------------------------------------------------------------ */
/* Miniatura de evidência (imagem protegida por token)                 */
/* ------------------------------------------------------------------ */

function EvidenceThumb({ evidence }: { evidence: EvidenceDto }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let active = true;

    async function load() {
      try {
        const response = await fetch(
          `${API_URL}/api/v1/inspection-evidences/${evidence.id}/file`,
          { headers: { Authorization: `Bearer ${token() ?? ''}` } },
        );

        if (!response.ok) throw new Error(String(response.status));

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;

        if (active) setUrl(objectUrl);
      } catch {
        if (active) setFailed(true);
      }
    }

    void load();

    return () => {
      active = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [evidence.id]);

  if (failed) {
    return <span className="review-evidence-fail" title={evidence.originalFilename}>Imagem indisponível</span>;
  }

  if (!url) {
    return <span className="review-evidence-loading"><LoaderCircle size={16} className="review-spin" /></span>;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" title={evidence.originalFilename}>
      <img src={url} alt={evidence.originalFilename} className="review-evidence-img" />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Painel                                                             */
/* ------------------------------------------------------------------ */

export function InspectionReviewPanel({
  inspectionId,
  onClose,
  onChanged,
}: {
  inspectionId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<PackageDto | null>(null);
  const [role, setRole] = useState<Me['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [pack, me] = await Promise.all([
        apiRequest<PackageDto>(`/api/v1/inspections/${inspectionId}/package`),
        apiRequest<Me>('/api/v1/auth/me'),
      ]);

      setData(pack);
      setRole(me.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a inspeção.');
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const answersByItem = useMemo(() => {
    const map = new Map<number, AnswerDto>();
    data?.answers.forEach(answer => map.set(answer.templateItemId, answer));
    return map;
  }, [data]);

  const evidencesByAnswer = useMemo(() => {
    const map = new Map<number, EvidenceDto[]>();
    data?.evidences.forEach(evidence => {
      if (evidence.answerId !== null) {
        map.set(evidence.answerId, [...(map.get(evidence.answerId) ?? []), evidence]);
      }
    });
    return map;
  }, [data]);

  const totals = useMemo(() => {
    const items = data?.sections.flatMap(section => section.items) ?? [];
    const answered = items.filter(item => answersByItem.has(item.id)).length;
    const nonConform = items.filter(item => answersByItem.get(item.id)?.value === 'NONCONFORM');
    return { total: items.length, answered, nonConform };
  }, [data, answersByItem]);

  async function act(path: string, body?: unknown, successMessage?: string) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await apiRequest(path, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      setNotice(successMessage ?? 'Inspeção atualizada.');
      setComment('');
      setRejectReason('');
      setCancelReason('');

      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a ação.');
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    if (!rejectReason.trim()) {
      setError('Informe o motivo da reprovação.');
      return;
    }

    void act(
      `/api/v1/inspections/${inspectionId}/reject`,
      { reason: rejectReason.trim() },
      'Inspeção reprovada. O técnico poderá corrigi-la.',
    );
  }

  function cancel() {
    if (!cancelReason.trim()) {
      setError('Informe a justificativa do cancelamento.');
      return;
    }

    void act(
      `/api/v1/inspections/${inspectionId}/cancel`,
      { reason: cancelReason.trim() },
      'Inspeção cancelada.',
    );
  }

  const inspection = data?.inspection;
  const status = inspection?.status;
  const isSupervisor = role === 'SUPERVISOR';
  const canCancel =
    (role === 'SUPERVISOR' || role === 'ADMIN') &&
    status !== undefined &&
    status !== 'APPROVED' &&
    status !== 'CANCELLED';

  const startLink = mapsLink(inspection?.startLatitude, inspection?.startLongitude);
  const endLink = mapsLink(inspection?.endLatitude, inspection?.endLongitude);

  return (
    <div className="review-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="review-card" role="dialog" aria-modal="true" aria-label="Revisão da inspeção">
        <header className="review-header">
          <div>
            <span className="eyebrow">REVISÃO DA INSPEÇÃO</span>
            <h2>
              INS-{String(inspectionId).padStart(6, '0')}
              {inspection ? ` · ${inspection.title}` : ''}
            </h2>
            {status && <span className={`review-status ${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>}
          </div>

          <div className="review-header-actions">
            <button type="button" onClick={() => void load()} disabled={loading || busy} aria-label="Atualizar">
              <RefreshCw size={16} className={loading ? 'review-spin' : ''} />
            </button>
            <button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
          </div>
        </header>

        {error && (
          <div className="review-alert error"><AlertCircle size={16} /> <span>{error}</span></div>
        )}

        {notice && (
          <div className="review-alert success"><CheckCircle2 size={16} /> <span>{notice}</span></div>
        )}

        {loading && !data ? (
          <div className="review-state"><LoaderCircle size={24} className="review-spin" /> Carregando inspeção...</div>
        ) : !data || !inspection ? null : (
          <div className="review-body">

            {/* RESUMO */}
            <div className="review-summary">
              <div><span>Cliente</span><strong>{inspection.clientName}</strong></div>
              <div><span>Local</span><strong>{inspection.siteName}</strong></div>
              <div><span>Equipamento</span><strong>{inspection.equipmentName}</strong></div>
              <div><span>Técnico responsável</span><strong>{inspection.technicianName}</strong></div>
              <div><span>Prevista para</span><strong>{formatDate(inspection.scheduledDate)} {inspection.scheduledTime?.slice(0, 5) ?? ''}</strong></div>
              <div><span>Prioridade</span><strong>{PRIORITY_LABELS[inspection.priority ?? 'NORMAL'] ?? inspection.priority}</strong></div>
              <div>
                <span>Início (servidor / dispositivo)</span>
                <strong>{formatDateTime(inspection.startedAt)}</strong>
                <small>{formatDateTime(inspection.startedAtDevice)}</small>
              </div>
              <div>
                <span>Conclusão (servidor / dispositivo)</span>
                <strong>{formatDateTime(inspection.completedAt)}</strong>
                <small>{formatDateTime(inspection.completedAtDevice)}</small>
              </div>
              <div>
                <span>Localização no início</span>
                {startLink
                  ? <a href={startLink} target="_blank" rel="noreferrer"><MapPin size={13} /> {inspection.startLatitude?.toFixed(5)}, {inspection.startLongitude?.toFixed(5)}</a>
                  : <strong>Não registrada</strong>}
                {inspection.startAccuracy != null && <small>Precisão ≈ {Math.round(inspection.startAccuracy)} m</small>}
              </div>
              <div>
                <span>Localização na conclusão</span>
                {endLink
                  ? <a href={endLink} target="_blank" rel="noreferrer"><MapPin size={13} /> {inspection.endLatitude?.toFixed(5)}, {inspection.endLongitude?.toFixed(5)}</a>
                  : <strong>Não registrada</strong>}
                {inspection.endAccuracy != null && <small>Precisão ≈ {Math.round(inspection.endAccuracy)} m</small>}
              </div>
              <div>
                <span>Progresso</span>
                <strong>{totals.answered}/{totals.total} itens respondidos</strong>
                <small>{totals.nonConform.length} não conformidade(s) no checklist</small>
              </div>
            </div>

            {inspection.instructions && (
              <div className="review-note"><strong>Instruções do supervisor:</strong> {inspection.instructions}</div>
            )}

            {inspection.reviewComment && (
              <div className={`review-note ${status === 'REJECTED' ? 'danger' : ''}`}>
                <strong>{status === 'REJECTED' ? 'Motivo da reprovação' : 'Comentário da revisão'}</strong>
                {' '}({inspection.reviewedByName ?? '—'}, {formatDateTime(inspection.reviewedAt)}): {inspection.reviewComment}
              </div>
            )}

            {inspection.cancelReason && (
              <div className="review-note danger">
                <strong>Cancelada por {inspection.cancelledByName ?? '—'}</strong>
                {' '}em {formatDateTime(inspection.cancelledAt)}: {inspection.cancelReason}
              </div>
            )}

            {/* CHECKLIST COMPLETO */}
            <h3 className="review-title"><ClipboardCheck size={17} /> Checklist e respostas</h3>

            {data.sections.length === 0 && <p className="review-muted">O modelo desta inspeção não possui seções.</p>}

            {data.sections.map(section => (
              <div className="review-section" key={section.id}>
                <h4>{section.displayOrder}. {section.title}</h4>
                {section.description && <p className="review-muted">{section.description}</p>}

                {section.items.map(item => {
                  const answer = answersByItem.get(item.id);
                  const itemEvidences = answer ? evidencesByAnswer.get(answer.id) ?? [] : [];
                  const tone = answerTone(item, answer?.value ?? null);

                  return (
                    <article className={`review-item ${tone}`} key={item.id}>
                      <div className="review-item-head">
                        <strong>{item.displayOrder}. {item.label}</strong>
                        <span className="review-tags">
                          {item.required && <em>Obrigatório</em>}
                          {item.requiresEvidence && <em><Camera size={11} /> Evidência</em>}
                          {item.criticalOnNonconformity && <em className="critical"><AlertTriangle size={11} /> Crítico</em>}
                        </span>
                      </div>

                      {item.description && <p className="review-muted">{item.description}</p>}

                      <div className="review-answer">
                        <span>Resposta</span>
                        <b className={tone}>{formatAnswer(item, answer?.value ?? null)}</b>
                      </div>

                      {answer?.observation && (
                        <div className="review-observation"><span>Observação</span> {answer.observation}</div>
                      )}

                      {itemEvidences.length > 0 && (
                        <div className="review-evidences">
                          {itemEvidences.map(evidence => <EvidenceThumb key={evidence.id} evidence={evidence} />)}
                        </div>
                      )}

                      {item.requiresEvidence && answer && itemEvidences.length === 0 && (
                        <div className="review-warning">Este item exige evidência e nenhuma foi enviada.</div>
                      )}
                    </article>
                  );
                })}
              </div>
            ))}

            {/* NÃO CONFORMIDADES */}
            <h3 className="review-title"><AlertTriangle size={17} /> Não conformidades registradas</h3>

            {data.nonConformities.length === 0 && (
              <p className="review-muted">Nenhuma não conformidade registrada separadamente pelo técnico.</p>
            )}

            {data.nonConformities.map(nc => {
              const ncEvidences = data.evidences.filter(evidence => evidence.nonConformityId === nc.id);

              return (
                <article className="review-item bad" key={nc.id}>
                  <div className="review-item-head">
                    <strong>{nc.type || 'Não conformidade'} · {SEVERITY_LABELS[nc.severity] ?? nc.severity}</strong>
                    <span className="review-muted">{nc.createdByName} · {formatDateTime(nc.createdAt)}</span>
                  </div>
                  <p>{nc.description}</p>
                  {nc.probableCause && <div className="review-observation"><span>Causa provável</span> {nc.probableCause}</div>}
                  {nc.recommendedAction && <div className="review-observation"><span>Ação recomendada</span> {nc.recommendedAction}</div>}
                  {nc.technicalNotes && <div className="review-observation"><span>Notas técnicas</span> {nc.technicalNotes}</div>}
                  {ncEvidences.length > 0 && (
                    <div className="review-evidences">
                      {ncEvidences.map(evidence => <EvidenceThumb key={evidence.id} evidence={evidence} />)}
                    </div>
                  )}
                </article>
              );
            })}

            {/* HISTÓRICO */}
            <h3 className="review-title"><History size={17} /> Histórico de alterações</h3>

            <ol className="review-history">
              {data.history.length === 0 && <li className="review-muted">Sem registros.</li>}
              {data.history.map(event => (
                <li key={event.id}>
                  <Clock3 size={13} />
                  <div>
                    <strong>{ACTION_LABELS[event.action] ?? event.action}</strong>
                    <span>{event.description}</span>
                    <small>{event.actorName ?? 'Sistema'} · {formatDateTime(event.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ol>

            {/* AÇÕES */}
            <div className="review-actions">
              {isSupervisor && status === 'COMPLETED' && (
                <div className="review-action-box">
                  <p>O técnico concluiu a inspeção. Inicie a revisão para poder aprovar ou reprovar.</p>
                  <button
                    type="button"
                    className="primary"
                    disabled={busy}
                    onClick={() => void act(`/api/v1/inspections/${inspectionId}/review`, undefined, 'Revisão iniciada.')}
                  >
                    <ShieldCheck size={16} /> Iniciar revisão
                  </button>
                </div>
              )}

              {isSupervisor && status === 'UNDER_REVIEW' && (
                <div className="review-action-box">
                  <label>
                    Comentário da aprovação (opcional)
                    <textarea value={comment} onChange={event => setComment(event.target.value)} rows={2} maxLength={2000} />
                  </label>
                  <button
                    type="button"
                    className="primary"
                    disabled={busy}
                    onClick={() => void act(`/api/v1/inspections/${inspectionId}/approve`, { reason: comment.trim() || null }, 'Inspeção aprovada.')}
                  >
                    <CheckCircle2 size={16} /> Aprovar inspeção
                  </button>

                  <label>
                    Motivo da reprovação (obrigatório)
                    <textarea value={rejectReason} onChange={event => setRejectReason(event.target.value)} rows={2} maxLength={2000} />
                  </label>
                  <button type="button" className="danger" disabled={busy} onClick={reject}>
                    <XCircle size={16} /> Reprovar inspeção
                  </button>
                </div>
              )}

              {!isSupervisor && (status === 'COMPLETED' || status === 'UNDER_REVIEW') && (
                <p className="review-muted">Somente o supervisor pode revisar, aprovar ou reprovar inspeções.</p>
              )}

              {canCancel && (
                <div className="review-action-box">
                  <label>
                    Justificativa do cancelamento
                    <textarea value={cancelReason} onChange={event => setCancelReason(event.target.value)} rows={2} maxLength={2000} />
                  </label>
                  <button type="button" className="danger outline" disabled={busy} onClick={cancel}>
                    <XCircle size={16} /> Cancelar inspeção
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
