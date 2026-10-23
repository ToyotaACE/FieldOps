import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ClipboardList, Eye, FileImage,
  LoaderCircle, MapPin, RefreshCw, Search, ShieldAlert, UserRound, X,
} from 'lucide-react';
import './NonconformitiesPage.css';

type Id = number;
type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED' | string;
type Inspection = {
  id: Id; title: string; templateVersionId: Id; clientId: Id; siteId: Id;
  equipmentId: Id | null; technicianId: Id; scheduledDate: string; status: InspectionStatus;
};
type Client = { id: Id; name: string };
type Site = { id: Id; name: string; clientId: Id };
type Equipment = { id: Id; name: string; siteId: Id };
type Technician = { id: Id; name: string; role: string };
type Answer = { id: Id; inspectionId: Id; templateItemId: Id; value: string | null; observation: string | null; createdAt?: string | null };
type Section = { id: Id; templateVersionId: Id; title: string; displayOrder?: number };
type TemplateItem = { id: Id; sectionId: Id; label: string; description?: string | null; responseType?: string; criticalOnNonconformity?: boolean; requiresEvidence?: boolean };
type Evidence = { id: Id; answerId: Id; originalFilename: string; contentType?: string | null; uploadedAt?: string | null };
type Occurrence = {
  id: string; answer: Answer; inspection: Inspection; item: TemplateItem | undefined;
  section: Section | undefined; client?: Client; site?: Site; equipment?: Equipment;
  technician?: Technician; evidences: Evidence[]; critical: boolean;
};

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('fieldops_token') || sessionStorage.getItem('fieldops_token');
}

async function apiRequest<T>(path: string): Promise<T> {
  const accessToken = getToken();
  if (!accessToken) throw new Error('Sessão não encontrada. Entre novamente no FieldOps.');
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
  });
  const raw = await response.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || data?.detail || data?.error || raw || `Erro HTTP ${response.status}.`);
  return data as T;
}

function asArray<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function textValue(value?: string | null) { return value?.trim() || ''; }
function normalize(value?: string | null) {
  return (value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[\s-]+/g, '_');
}
function isNonconformity(value?: string | null) {
  return ['NONCONFORM', 'NON_CONFORM', 'NONCONFORMING', 'NAO_CONFORME', 'NAO_CONFORMIDADE', 'NOK'].includes(normalize(value));
}
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: 'Agendada', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluída',
    UNDER_REVIEW: 'Em revisão', APPROVED: 'Aprovada', REJECTED: 'Reprovada', CANCELED: 'Cancelada',
  };
  return labels[status] || status || '—';
}
function dateLabel(value?: string | null) {
  if (!value) return '—';
  const date = value.slice(0, 10).split('-');
  return date.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : value;
}
function dateTimeLabel(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

export function NonconformitiesPage() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<Occurrence | null>(null);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<number, string>>({});
  const [evidenceErrors, setEvidenceErrors] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inspectionRows, clientRows, siteRows, equipmentRows, userRows] = await Promise.all([
        apiRequest<Inspection[]>('/api/v1/inspections'),
        apiRequest<Client[]>('/api/v1/clients'),
        apiRequest<Site[]>('/api/v1/sites'),
        apiRequest<Equipment[]>('/api/v1/equipments'),
        apiRequest<Technician[]>('/api/v1/users'),
      ]);
      const inspections = asArray<Inspection>(inspectionRows);
      const clients = asArray<Client>(clientRows);
      const sites = asArray<Site>(siteRows);
      const equipment = asArray<Equipment>(equipmentRows);
      const users = asArray<Technician>(userRows);

      const answerGroups = await Promise.all(inspections.map(async inspection => {
        try {
          const rows = await apiRequest<Answer[]>(`/api/v1/inspections/${inspection.id}/answers`);
          return { inspection, answers: asArray<Answer>(rows).filter(answer => isNonconformity(answer.value)) };
        } catch {
          // Uma inspeção sem respostas consultáveis não deve impedir as demais de carregar.
          return { inspection, answers: [] as Answer[] };
        }
      }));
      const relevantGroups = answerGroups.filter(group => group.answers.length > 0);
      const versionIds = [...new Set(relevantGroups.map(group => group.inspection.templateVersionId))];

      const sectionGroups = await Promise.all(versionIds.map(async versionId => {
        try {
          return asArray<Section>(await apiRequest<Section[]>(`/api/v1/template-sections/version/${versionId}`));
        } catch { return [] as Section[]; }
      }));
      const sections = sectionGroups.flat();
      const sectionIds = [...new Set(sections.map(section => section.id))];
      const itemGroups = await Promise.all(sectionIds.map(async sectionId => {
        try {
          return asArray<TemplateItem>(await apiRequest<TemplateItem[]>(`/api/v1/template-sections/${sectionId}/items`));
        } catch { return [] as TemplateItem[]; }
      }));
      const items = itemGroups.flat();

      const answerRows = relevantGroups.flatMap(group => group.answers.map(answer => ({ answer, inspection: group.inspection })));
      const evidenceRows = await Promise.all(answerRows.map(async row => {
        try {
          const evidence = await apiRequest<Evidence[]>(`/api/v1/inspection-evidences/answers/${row.answer.id}`);
          return { answerId: row.answer.id, evidences: asArray<Evidence>(evidence) };
        } catch { return { answerId: row.answer.id, evidences: [] as Evidence[] }; }
      }));
      const evidenceMap = new Map(evidenceRows.map(row => [row.answerId, row.evidences]));

      const result: Occurrence[] = answerRows.map(({ answer, inspection }) => {
        const item = items.find(candidate => candidate.id === answer.templateItemId);
        const section = item ? sections.find(candidate => candidate.id === item.sectionId) : undefined;
        return {
          id: `${inspection.id}-${answer.id}`,
          answer,
          inspection,
          item,
          section,
          client: clients.find(candidate => candidate.id === inspection.clientId),
          site: sites.find(candidate => candidate.id === inspection.siteId),
          equipment: equipment.find(candidate => candidate.id === inspection.equipmentId),
          technician: users.find(candidate => candidate.id === inspection.technicianId),
          evidences: evidenceMap.get(answer.id) || [],
          critical: Boolean(item?.criticalOnNonconformity),
        };
      }).sort((a, b) => (b.answer.createdAt || '').localeCompare(a.answer.createdAt || ''));
      setOccurrences(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as não conformidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    const createdUrls: string[] = [];
    setEvidenceUrls({});
    setEvidenceErrors({});
    if (!selected?.evidences.length) return;

    const loadEvidenceFiles = async () => {
      const accessToken = getToken();
      if (!accessToken) {
        setEvidenceErrors(Object.fromEntries(selected.evidences.map(file => [file.id, 'Sessão expirada. Entre novamente.'])));
        return;
      }
      await Promise.all(selected.evidences.map(async evidence => {
        try {
          const response = await fetch(`${API_URL}/api/v1/inspection-evidences/${evidence.id}/file`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error(response.status === 404 ? 'Arquivo não encontrado.' : 'Não foi possível abrir esta imagem.');
          const blob = await response.blob();
          if (!blob.type.startsWith('image/')) throw new Error('O arquivo retornado não é uma imagem visualizável.');
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          if (!cancelled) setEvidenceUrls(previous => ({ ...previous, [evidence.id]: url }));
        } catch (err) {
          if (!cancelled) setEvidenceErrors(previous => ({ ...previous, [evidence.id]: err instanceof Error ? err.message : 'Falha ao abrir a imagem.' }));
        }
      }));
    };
    void loadEvidenceFiles();
    return () => {
      cancelled = true;
      createdUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selected]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return occurrences.filter(item => {
      const haystack = [item.inspection.title, item.inspection.id, item.item?.label, item.section?.title,
        item.answer.observation, item.client?.name, item.site?.name, item.equipment?.name, item.technician?.name]
        .filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesSeverity = severityFilter === 'ALL' || (severityFilter === 'CRITICAL' ? item.critical : !item.critical);
      const matchesStatus = statusFilter === 'ALL' || item.inspection.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [occurrences, search, severityFilter, statusFilter]);

  const criticalCount = occurrences.filter(item => item.critical).length;
  const openCount = new Set(occurrences.filter(item => !['APPROVED', 'CANCELED'].includes(item.inspection.status)).map(item => item.inspection.id)).size;
  const evidenceCount = occurrences.filter(item => item.evidences.length > 0).length;

  return (
    <section className="nc-page">
      <header className="nc-heading">
        <div>
          <div className="eyebrow">QUALIDADE</div>
          <h1>Não conformidades</h1>
          <p>Acompanhe ocorrências, riscos e ações corretivas identificadas nas inspeções.</p>
        </div>
        <button className="nc-refresh" type="button" onClick={() => void loadData()} disabled={loading}>
          {loading ? <LoaderCircle size={16} className="nc-spin" /> : <RefreshCw size={16} />} Atualizar
        </button>
      </header>

      {error && <div className="nc-alert"><AlertCircle size={18} /><span>{error}</span></div>}

      <div className="nc-stats">
        <article><span><AlertTriangle size={17} /> Total identificado</span><strong>{occurrences.length}</strong><small>Respostas não conformes</small></article>
        <article><span><ShieldAlert size={17} /> Críticas</span><strong>{criticalCount}</strong><small>Marcadas como críticas no modelo</small></article>
        <article><span><ClipboardList size={17} /> Em acompanhamento</span><strong>{openCount}</strong><small>Inspeções não aprovadas/canceladas</small></article>
        <article><span><FileImage size={17} /> Com evidências</span><strong>{evidenceCount}</strong><small>Ocorrências com anexos registrados</small></article>
      </div>

      <div className="nc-toolbar">
        <label className="nc-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar ocorrência, inspeção, cliente ou técnico..." /></label>
        <select aria-label="Filtrar criticidade" value={severityFilter} onChange={event => setSeverityFilter(event.target.value)}>
          <option value="ALL">Todas as criticidades</option><option value="CRITICAL">Críticas</option><option value="NORMAL">Não críticas</option>
        </select>
        <select aria-label="Filtrar status da inspeção" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="ALL">Todos os status</option>
          <option value="SCHEDULED">Agendada</option><option value="IN_PROGRESS">Em andamento</option>
          <option value="COMPLETED">Concluída</option><option value="UNDER_REVIEW">Em revisão</option>
          <option value="APPROVED">Aprovada</option><option value="REJECTED">Reprovada</option><option value="CANCELED">Cancelada</option>
        </select>
      </div>

      <div className="nc-panel">
        <div className="nc-panel-head"><div><h3>Ocorrências identificadas</h3><span>{visible.length} registro(s) encontrado(s)</span></div></div>
        {loading ? <div className="nc-state"><LoaderCircle size={25} className="nc-spin" /><span>Consultando inspeções e respostas...</span></div>
          : visible.length === 0 ? <div className="nc-state"><CheckCircle2 size={30} /><strong>Nenhuma não conformidade encontrada</strong><span>{occurrences.length ? 'Tente alterar a busca ou os filtros.' : 'Ainda não há respostas marcadas como não conformes nas inspeções consultadas.'}</span></div>
          : <div className="nc-table-scroll"><table className="nc-table"><thead><tr><th>Ocorrência</th><th>Cliente / local</th><th>Equipamento</th><th>Técnico</th><th>Identificada em</th><th>Criticidade</th><th>Status</th><th /></tr></thead>
            <tbody>{visible.map(item => <tr key={item.id}>
              <td><strong>{item.item?.label || `Resposta #${item.answer.id}`}</strong><span>INS-{String(item.inspection.id).padStart(6, '0')} · {item.inspection.title || 'Inspeção técnica'}</span></td>
              <td><strong>{item.client?.name || `Cliente #${item.inspection.clientId}`}</strong><span><MapPin size={12} /> {item.site?.name || `Local #${item.inspection.siteId}`}</span></td>
              <td>{item.equipment?.name || '—'}</td>
              <td><span className="nc-technician"><UserRound size={13} /> {item.technician?.name || `Técnico #${item.inspection.technicianId}`}</span></td>
              <td>{dateLabel(item.answer.createdAt || item.inspection.scheduledDate)}</td>
              <td><span className={`nc-severity ${item.critical ? 'critical' : 'normal'}`}><i />{item.critical ? 'Crítica' : 'Normal'}</span></td>
              <td><span className={`nc-status ${item.inspection.status.toLowerCase()}`}>{statusLabel(item.inspection.status)}</span></td>
              <td><button className="nc-view" type="button" onClick={() => setSelected(item)} aria-label="Ver detalhes"><Eye size={16} /></button></td>
            </tr>)}</tbody></table></div>}
      </div>

      {selected && <div className="nc-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section className="nc-detail" role="dialog" aria-modal="true" aria-labelledby="nc-detail-title">
          <header><div><span className="eyebrow">DETALHES DA OCORRÊNCIA</span><h2 id="nc-detail-title">{selected.item?.label || `Resposta #${selected.answer.id}`}</h2><p>Inspeção INS-{String(selected.inspection.id).padStart(6, '0')}</p></div><button type="button" className="nc-close" onClick={() => setSelected(null)} aria-label="Fechar"><X size={20} /></button></header>
          <div className="nc-detail-grid">
            <div><small>Cliente</small><strong>{selected.client?.name || `Cliente #${selected.inspection.clientId}`}</strong></div>
            <div><small>Local</small><strong>{selected.site?.name || `Local #${selected.inspection.siteId}`}</strong></div>
            <div><small>Equipamento</small><strong>{selected.equipment?.name || 'Não informado'}</strong></div>
            <div><small>Técnico responsável</small><strong>{selected.technician?.name || `Técnico #${selected.inspection.technicianId}`}</strong></div>
            <div><small>Seção do modelo</small><strong>{selected.section?.title || 'Não identificada'}</strong></div>
            <div><small>Data registrada</small><strong>{dateTimeLabel(selected.answer.createdAt)}</strong></div>
          </div>
          <div className="nc-detail-block"><small>Observação registrada pelo técnico</small><p>{textValue(selected.answer.observation) || 'Nenhuma observação foi registrada para esta resposta.'}</p></div>
          <div className="nc-detail-block"><small>Resposta</small><p>{selected.answer.value || 'Não informado'}</p></div>
          <div className="nc-detail-block"><small>Evidências anexadas</small>
            {selected.evidences.length ? <ul className="nc-evidence-list">{selected.evidences.map(evidence => <li key={evidence.id} className="nc-evidence-item"><div className="nc-evidence-preview">{evidenceUrls[evidence.id] ? <a href={evidenceUrls[evidence.id]} target="_blank" rel="noreferrer" aria-label={`Abrir ${evidence.originalFilename}`}><img src={evidenceUrls[evidence.id]} alt={evidence.originalFilename || 'Evidência da inspeção'} /></a> : evidenceErrors[evidence.id] ? <AlertCircle size={19} /> : <LoaderCircle size={19} className="nc-spin" />}</div><span className="nc-evidence-info"><strong>{evidence.originalFilename || 'Imagem anexada'}</strong><small>{evidence.contentType || 'Arquivo de imagem'} · {dateTimeLabel(evidence.uploadedAt)}</small>{evidenceErrors[evidence.id] && <small className="nc-evidence-error">{evidenceErrors[evidence.id]}</small>}</span>{evidenceUrls[evidence.id] && <a className="nc-evidence-open" href={evidenceUrls[evidence.id]} target="_blank" rel="noreferrer">Visualizar</a>}</li>)}</ul>
              : <p>Nenhuma evidência encontrada para esta resposta.</p>}
          </div>
          <footer><span className={`nc-severity ${selected.critical ? 'critical' : 'normal'}`}><i />{selected.critical ? 'Ocorrência crítica' : 'Ocorrência não crítica'}</span><button type="button" className="nc-done" onClick={() => setSelected(null)}>Fechar</button></footer>
        </section>
      </div>}
    </section>
  );
}
