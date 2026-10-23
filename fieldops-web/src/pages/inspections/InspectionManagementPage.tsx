import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays, ClipboardCheck, Plus, RefreshCw, Search, X,
  LoaderCircle, AlertCircle, CheckCircle2, MapPin, UserRound,
} from 'lucide-react';
import './InspectionManagementPage.css';

type Id = number;
type Client = { id: Id; name: string; active: boolean };
type Site = { id: Id; name: string; clientId: Id; clientName: string; active: boolean };
type Equipment = { id: Id; name: string; category?: string | null; siteId: Id; siteName: string; clientId: Id; clientName: string; active: boolean };
type User = { id: Id; name: string; email: string; role: string; active: boolean };
type Template = { id: Id; title: string; active: boolean };
type TemplateVersion = { id: Id; templateId: Id; versionNumber: number; published: boolean; publishedAt: string | null };
type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED';
type Inspection = {
  id: Id;
  title: string;
  templateVersionId: Id;
  clientId: Id;
  siteId: Id;
  equipmentId: Id;
  technicianId: Id;
  scheduledDate: string;
  scheduledTime?: string | null;
  priority?: string | null;
  status: InspectionStatus;
  createdAt?: string | null;
};
type FormState = {
  title: string;
  templateVersionId: string;
  clientId: string;
  siteId: string;
  equipmentId: string;
  technicianId: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: string;
};

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const emptyForm: FormState = {
  title: '',
  templateVersionId: '',
  clientId: '',
  siteId: '',
  equipmentId: '',
  technicianId: '',
  scheduledDate: '',
  scheduledTime: '09:00',
  priority: 'NORMAL',
};

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
    const validationErrors = Array.isArray(data?.errors)
      ? data.errors
          .map((item: any) => {
            const field = item.field || item.property || '';
            const message = item.defaultMessage || item.message || '';
            return field ? `${field}: ${message}` : message;
          })
          .filter(Boolean)
          .join('; ')
      : '';

    throw new Error(
      validationErrors ||
      data?.message ||
      data?.detail ||
      data?.error ||
      raw ||
      `Erro HTTP ${response.status}.`,
    );
  }

  return data as T;
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}

function formatDate(value: string) {
  if (!value) return '—';
  const parts = value.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function statusLabel(status: InspectionStatus) {
  const labels: Record<InspectionStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    UNDER_REVIEW: 'Em revisão',
    APPROVED: 'Aprovada',
    REJECTED: 'Reprovada',
    CANCELED: 'Cancelada',
  };
  return labels[status] || status;
}

function statusClass(status: InspectionStatus) {
  if (status === 'APPROVED' || status === 'COMPLETED') return 'success';
  if (status === 'REJECTED' || status === 'CANCELED') return 'danger';
  if (status === 'IN_PROGRESS' || status === 'UNDER_REVIEW') return 'warning';
  return 'scheduled';
}

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function InspectionManagementPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        inspectionData,
        clientData,
        siteData,
        equipmentData,
        userData,
        templateData,
      ] = await Promise.all([
        apiRequest<Inspection[]>('/api/v1/inspections'),
        apiRequest<Client[]>('/api/v1/clients'),
        apiRequest<Site[]>('/api/v1/sites'),
        apiRequest<Equipment[]>('/api/v1/equipments'),
        apiRequest<User[]>('/api/v1/users'),
        apiRequest<Template[]>('/api/v1/inspection-templates'),
      ]);

      const activeTemplates = (Array.isArray(templateData) ? templateData : [])
        .filter(template => template.active);

      const versionLists = await Promise.all(
        activeTemplates.map(async template => {
          try {
            const result = await apiRequest<TemplateVersion[]>(
              `/api/v1/inspection-templates/${template.id}/versions`,
            );
            return Array.isArray(result)
              ? result.filter(version => version.published)
              : [];
          } catch {
            return [];
          }
        }),
      );

      setInspections(Array.isArray(inspectionData) ? inspectionData : []);
      setClients((Array.isArray(clientData) ? clientData : []).filter(item => item.active));
      setSites((Array.isArray(siteData) ? siteData : []).filter(item => item.active));
      setEquipments((Array.isArray(equipmentData) ? equipmentData : []).filter(item => item.active));
      setUsers(
        (Array.isArray(userData) ? userData : []).filter(
          item => item.active && String(item.role).toUpperCase() === 'TECHNICIAN',
        ),
      );
      setTemplates(activeTemplates);
      setVersions(versionLists.flat());
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sitesForClient = useMemo(
    () => sites.filter(site => String(site.clientId) === form.clientId),
    [sites, form.clientId],
  );

  const equipmentForSite = useMemo(
    () => equipments.filter(equipment => String(equipment.siteId) === form.siteId),
    [equipments, form.siteId],
  );

  const publishedVersions = useMemo(
    () => versions.filter(version => templates.some(template => template.id === version.templateId)),
    [versions, templates],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inspections
      .filter(inspection => {
        const client = clients.find(item => item.id === inspection.clientId)?.name || '';
        const site = sites.find(item => item.id === inspection.siteId)?.name || '';
        const equipment = equipments.find(item => item.id === inspection.equipmentId)?.name || '';
        const technician = users.find(item => item.id === inspection.technicianId)?.name || '';
        const version = versions.find(item => item.id === inspection.templateVersionId);
        const template = templates.find(item => item.id === version?.templateId)?.title || '';

        const matchesSearch =
          !query ||
          `${inspection.id} ${inspection.title} ${client} ${site} ${equipment} ${technician} ${template}`
            .toLowerCase()
            .includes(query);

        return matchesSearch &&
          (statusFilter === 'ALL' || inspection.status === statusFilter);
      })
      .sort((a, b) => b.id - a.id);
  }, [
    inspections,
    clients,
    sites,
    equipments,
    users,
    templates,
    versions,
    search,
    statusFilter,
  ]);

  function openModal() {
    setForm({
      ...emptyForm,
      scheduledDate: todayLocal(),
      scheduledTime: '09:00',
      priority: 'NORMAL',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(previous => {
      const next: FormState = { ...previous, [key]: value };

      if (key === 'clientId') {
        next.siteId = '';
        next.equipmentId = '';
      }

      if (key === 'siteId') {
        next.equipmentId = '';
      }

      if (key === 'templateVersionId') {
        const version = versions.find(item => String(item.id) === String(value));
        const template = templates.find(item => item.id === version?.templateId);

        if (template && !previous.title) {
          next.title = template.title;
        }
      }

      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Informe o título da inspeção.');
      return;
    }

    if (!form.scheduledDate || !form.scheduledTime) {
      setError('Informe a data e o horário previstos para a inspeção.');
      return;
    }

    const selectedSite = sites.find(site => String(site.id) === form.siteId);

    if (!selectedSite || String(selectedSite.clientId) !== form.clientId) {
      setError('Selecione um local pertencente ao cliente escolhido.');
      return;
    }

    const selectedEquipment = equipments.find(
      equipment => String(equipment.id) === form.equipmentId,
    );

    if (!selectedEquipment || String(selectedEquipment.siteId) !== form.siteId) {
      setError('Selecione um equipamento ativo pertencente ao local escolhido.');
      return;
    }

    if (!publishedVersions.some(version => String(version.id) === form.templateVersionId)) {
      setError('Selecione uma versão publicada de um modelo ativo.');
      return;
    }

    if (!users.some(user => String(user.id) === form.technicianId)) {
      setError('Selecione um técnico ativo.');
      return;
    }

    setSaving(true);

    try {
      const created = await apiRequest<Inspection>('/api/v1/inspections', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          templateVersionId: Number(form.templateVersionId),
          clientId: Number(form.clientId),
          siteId: Number(form.siteId),
          equipmentId: Number(form.equipmentId),
          technicianId: Number(form.technicianId),
          scheduledDate: form.scheduledDate,
          scheduledTime: `${form.scheduledTime}:00`.slice(0, 8),
          priority: form.priority,
        }),
      });

      setInspections(previous => [created, ...previous]);
      setModalOpen(false);
      setSuccess(`Inspeção "${created.title}" agendada com sucesso.`);
      await loadData();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  const activeCount = inspections.filter(item => item.status === 'SCHEDULED').length;
  const inProgressCount = inspections.filter(item => item.status === 'IN_PROGRESS').length;
  const reviewCount = inspections.filter(
    item => item.status === 'UNDER_REVIEW' || item.status === 'COMPLETED',
  ).length;

  return (
    <section className="inspection-management">
      <header className="page-head inspection-management-head">
        <div>
          <div className="eyebrow">GESTÃO OPERACIONAL</div>
          <h1>Inspeções</h1>
          <p>Planeje, agende e acompanhe as inspeções de campo.</p>
        </div>

        <div className="inspection-head-actions">
          <button
            type="button"
            className="inspection-secondary"
            onClick={() => void loadData()}
            disabled={loading}
          >
            {loading
              ? <LoaderCircle size={16} className="inspection-spin" />
              : <RefreshCw size={16} />}
            Atualizar
          </button>

          <button type="button" className="primary" onClick={openModal}>
            <Plus size={18} /> Nova inspeção
          </button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="inspection-alert error">
          <AlertCircle size={17} /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="inspection-alert success">
          <CheckCircle2 size={17} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="inspection-stats">
        <article>
          <span>Inspeções cadastradas</span>
          <strong>{inspections.length}</strong>
          <small>Total retornado pela API</small>
        </article>
        <article>
          <span>Agendadas</span>
          <strong>{activeCount}</strong>
          <small>Aguardando execução</small>
        </article>
        <article>
          <span>Em andamento</span>
          <strong>{inProgressCount}</strong>
          <small>Execução em campo</small>
        </article>
        <article>
          <span>Aguardando revisão</span>
          <strong>{reviewCount}</strong>
          <small>Concluídas ou em revisão</small>
        </article>
      </div>

      <div className="inspection-toolbar">
        <label className="inspection-search">
          <Search size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por título, cliente, local ou técnico..."
          />
        </label>

        <select
          aria-label="Filtrar por status"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
        >
          <option value="ALL">Todos os status</option>
          <option value="SCHEDULED">Agendada</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="COMPLETED">Concluída</option>
          <option value="UNDER_REVIEW">Em revisão</option>
          <option value="APPROVED">Aprovada</option>
          <option value="REJECTED">Reprovada</option>
          <option value="CANCELED">Cancelada</option>
        </select>
      </div>

      <div className="inspection-table-panel">
        <div className="inspection-table-heading">
          <div>
            <h3>Lista de inspeções</h3>
            <span>{visible.length} registro(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="inspection-state">
            <LoaderCircle className="inspection-spin" size={24} />
            <span>Carregando inspeções...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="inspection-state">
            <ClipboardCheck size={30} />
            <strong>Nenhuma inspeção encontrada</strong>
            <span>
              {inspections.length
                ? 'Tente alterar a busca ou o filtro.'
                : 'Crie a primeira inspeção usando um modelo publicado.'}
            </span>
            {inspections.length === 0 && (
              <button className="primary" onClick={openModal}>
                <Plus size={16} /> Nova inspeção
              </button>
            )}
          </div>
        ) : (
          <div className="inspection-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Inspeção</th>
                  <th>Cliente / Local</th>
                  <th>Equipamento</th>
                  <th>Técnico responsável</th>
                  <th>Data prevista</th>
                  <th>Horário</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {visible.map(item => {
                  const client = clients.find(entry => entry.id === item.clientId);
                  const site = sites.find(entry => entry.id === item.siteId);
                  const equipment = equipments.find(entry => entry.id === item.equipmentId);
                  const technician = users.find(entry => entry.id === item.technicianId);
                  const version = versions.find(entry => entry.id === item.templateVersionId);
                  const template = templates.find(entry => entry.id === version?.templateId);

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong className="inspection-id">
                          INS-{String(item.id).padStart(6, '0')}
                        </strong>
                        <span>{item.title || template?.title || 'Inspeção técnica'}</span>
                      </td>
                      <td>
                        <strong>{client?.name || `Cliente #${item.clientId}`}</strong>
                        <span><MapPin size={13} /> {site?.name || `Local #${item.siteId}`}</span>
                      </td>
                      <td>{equipment?.name || `Equipamento #${item.equipmentId}`}</td>
                      <td>
                        <span className="inspection-technician">
                          <UserRound size={14} />
                          {technician?.name || `Técnico #${item.technicianId}`}
                        </span>
                      </td>
                      <td>{formatDate(item.scheduledDate)}</td>
                      <td>{item.scheduledTime?.slice(0, 5) || '—'}</td>
                      <td>
                        <span className={`inspection-status ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="inspection-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <form className="inspection-modal-card" onSubmit={submit}>
            <div className="inspection-modal-header">
              <div>
                <span className="eyebrow">PLANEJAMENTO</span>
                <h2>Agendar inspeção</h2>
                <p>Selecione o modelo publicado, o local e o técnico responsável.</p>
              </div>
              <button
                type="button"
                className="inspection-close"
                onClick={() => !saving && setModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="inspection-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="inspection-form-grid">
              <label className="inspection-field full">
                Título da inspeção <em>Obrigatório</em>
                <input
                  maxLength={150}
                  required
                  value={form.title}
                  onChange={event => updateForm('title', event.target.value)}
                  placeholder="Ex.: Inspeção de segurança da planta"
                />
              </label>

              <label className="inspection-field full">
                Modelo e versão publicada <em>Obrigatório</em>
                <select
                  required
                  value={form.templateVersionId}
                  onChange={event => updateForm('templateVersionId', event.target.value)}
                >
                  <option value="">Selecione um modelo publicado</option>
                  {templates.map(template => {
                    const templateVersions = publishedVersions.filter(
                      version => version.templateId === template.id,
                    );

                    return templateVersions.map(version => (
                      <option key={version.id} value={version.id}>
                        {template.title} · v{version.versionNumber}
                      </option>
                    ));
                  })}
                </select>
                {publishedVersions.length === 0 && (
                  <small className="inspection-help">
                    Não há versões publicadas disponíveis. Publique um modelo antes de agendar.
                  </small>
                )}
              </label>

              <label className="inspection-field">
                Cliente <em>Obrigatório</em>
                <select
                  required
                  value={form.clientId}
                  onChange={event => updateForm('clientId', event.target.value)}
                >
                  <option value="">Selecione o cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </label>

              <label className="inspection-field">
                Local <em>Obrigatório</em>
                <select
                  required
                  disabled={!form.clientId}
                  value={form.siteId}
                  onChange={event => updateForm('siteId', event.target.value)}
                >
                  <option value="">Selecione o local</option>
                  {sitesForClient.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </label>

              <label className="inspection-field full">
                Equipamento <em>Obrigatório pela API atual</em>
                <select
                  required
                  disabled={!form.siteId}
                  value={form.equipmentId}
                  onChange={event => updateForm('equipmentId', event.target.value)}
                >
                  <option value="">Selecione o equipamento</option>
                  {equipmentForSite.map(equipment => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name}{equipment.category ? ` · ${equipment.category}` : ''}
                    </option>
                  ))}
                </select>
                <small className="inspection-help">
                  O backend atual exige equipamento para toda inspeção.
                </small>
              </label>

              <label className="inspection-field">
                Técnico responsável <em>Obrigatório</em>
                <select
                  required
                  value={form.technicianId}
                  onChange={event => updateForm('technicianId', event.target.value)}
                >
                  <option value="">Selecione um técnico ativo</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </label>

              <label className="inspection-field">
                Data prevista <em>Obrigatório</em>
                <input
                  type="date"
                  required
                  min={todayLocal()}
                  value={form.scheduledDate}
                  onChange={event => updateForm('scheduledDate', event.target.value)}
                />
              </label>

              <label className="inspection-field">
                Horário previsto <em>Obrigatório</em>
                <input
                  type="time"
                  required
                  value={form.scheduledTime}
                  onChange={event => updateForm('scheduledTime', event.target.value)}
                />
              </label>

              <label className="inspection-field">
                Prioridade <em>Obrigatório</em>
                <select
                  required
                  value={form.priority}
                  onChange={event => updateForm('priority', event.target.value)}
                >
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </label>
            </div>

            <div className="inspection-modal-footer">
              <span><CheckCircle2 size={15} /> A inspeção será criada como agendada.</span>
              <div>
                <button
                  type="button"
                  className="inspection-cancel"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={saving || !publishedVersions.length || !users.length}
                >
                  <CalendarDays size={16} />
                  {saving ? 'Salvando...' : 'Criar inspeção'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
