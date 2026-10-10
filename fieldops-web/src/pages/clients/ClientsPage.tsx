import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Power,
  RefreshCw,
  X,
  LoaderCircle,
  Users,
} from 'lucide-react';

type Client = {
  id: number;
  name: string;
  document: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type ClientForm = {
  name: string;
  document: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

function getToken(): string | null {
  return (
    localStorage.getItem('fieldops_token') ||
    sessionStorage.getItem('fieldops_token')
  );
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error(
      'Token de autenticação não encontrado. Entre novamente no sistema.',
    );
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Erro na API (${response.status}). Tente novamente.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocorreu um erro inesperado.';
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>({
    name: '',
    document: '',
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<Client[]>('/api/v1/clients');
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((client) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      client.name.toLowerCase().includes(term) ||
      (client.document || '').toLowerCase().includes(term) ||
      String(client.id).includes(term);

    return matchesSearch && (showInactive || client.active);
  });

  function openCreateModal() {
    setEditingClient(null);
    setForm({ name: '', document: '' });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      document: client.document || '',
    });
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingClient(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const document = form.document.trim();

    if (!name) {
      setError('O nome do cliente é obrigatório.');
      return;
    }

    if (name.length > 150) {
      setError('O nome deve possuir no máximo 150 caracteres.');
      return;
    }

    if (document.length > 20) {
      setError('O documento deve possuir no máximo 20 caracteres.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body = JSON.stringify({
        name,
        document: document || null,
      });

      if (editingClient) {
        await apiRequest<Client>(
          `/api/v1/clients/${editingClient.id}`,
          {
            method: 'PUT',
            body,
          },
        );
      } else {
        await apiRequest<Client>('/api/v1/clients', {
          method: 'POST',
          body,
        });
      }

      setModalOpen(false);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleClient(client: Client) {
    const action = client.active ? 'desativar' : 'ativar';

    const confirmed = window.confirm(
      `Deseja realmente ${action} o cliente "${client.name}"?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await apiRequest<Client>(
        `/api/v1/clients/${client.id}/${client.active ? 'deactivate' : 'activate'}`,
        { method: 'PATCH' },
      );

      await loadClients();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeCount = clients.filter((client) => client.active).length;
  const inactiveCount = clients.length - activeCount;

  return (
    <section className="clients-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">GESTÃO OPERACIONAL</div>
          <h1>Clientes</h1>
          <p>Gerencie as organizações atendidas pelo FieldOps.</p>
        </div>

        <button
          type="button"
          className="clients-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Novo cliente
        </button>
      </header>

      <div className="clients-stats">
        <article className="clients-stat-card">
          <div className="clients-stat-icon">
            <Building2 size={20} />
          </div>
          <div>
            <span>Total de clientes</span>
            <strong>{clients.length}</strong>
          </div>
        </article>

        <article className="clients-stat-card">
          <div className="clients-stat-icon clients-stat-active">
            <Users size={20} />
          </div>
          <div>
            <span>Clientes ativos</span>
            <strong>{activeCount}</strong>
          </div>
        </article>

        <article className="clients-stat-card">
          <div className="clients-stat-icon clients-stat-inactive">
            <Power size={20} />
          </div>
          <div>
            <span>Clientes inativos</span>
            <strong>{inactiveCount}</strong>
          </div>
        </article>
      </div>

      {error && !modalOpen && (
        <div className="clients-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadClients()}>
            Tentar novamente
          </button>
        </div>
      )}

      <div className="clients-toolbar">
        <div className="clients-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por nome, documento ou código..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar clientes"
          />
        </div>

        <label className="clients-inactive-filter">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
          />
          Mostrar inativos
        </label>

        <button
          type="button"
          className="clients-icon-button"
          onClick={() => void loadClients()}
          disabled={loading}
          aria-label="Atualizar lista"
          title="Atualizar lista"
        >
          <RefreshCw size={17} className={loading ? 'clients-spinning' : ''} />
        </button>
      </div>

      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="clients-state-cell">
                  <LoaderCircle className="clients-spinning" size={24} />
                  <span>Carregando clientes...</span>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="clients-state-cell">
                  <Building2 size={28} />
                  <strong>Nenhum cliente encontrado</strong>
                  <span>
                    {search
                      ? 'Tente alterar os termos da busca.'
                      : 'Cadastre um cliente para começar.'}
                  </span>
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="clients-name-cell">
                      <div className="clients-avatar">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <strong>{client.name}</strong>
                        <span>CLI-{String(client.id).padStart(3, '0')}</span>
                      </div>
                    </div>
                  </td>

                  <td>{client.document || '—'}</td>

                  <td>
                    <span
                      className={`clients-status ${
                        client.active ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      <span className="clients-status-dot" />
                      {client.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td>
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>

                  <td>
                    <div className="clients-actions">
                      <button
                        type="button"
                        className="clients-icon-button"
                        title="Editar cliente"
                        aria-label={`Editar ${client.name}`}
                        onClick={() => openEditModal(client)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className={`clients-icon-button ${
                          client.active
                            ? 'clients-deactivate-button'
                            : 'clients-activate-button'
                        }`}
                        title={client.active ? 'Desativar cliente' : 'Ativar cliente'}
                        aria-label={`${client.active ? 'Desativar' : 'Ativar'} ${client.name}`}
                        onClick={() => void toggleClient(client)}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="clients-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="clients-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clients-modal-title"
          >
            <header className="clients-modal-header">
              <div>
                <div className="eyebrow">GESTÃO OPERACIONAL</div>
                <h2 id="clients-modal-title">
                  {editingClient ? 'Editar cliente' : 'Novo cliente'}
                </h2>
                <p>
                  {editingClient
                    ? 'Atualize os dados da organização.'
                    : 'Preencha os dados da organização que será atendida.'}
                </p>
              </div>

              <button
                type="button"
                className="clients-icon-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar formulário"
              >
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="clients-alert" role="alert">
                  {error}
                </div>
              )}

              <div className="clients-form-field">
                <label htmlFor="client-name">Nome do cliente *</label>
                <input
                  id="client-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Toyota Industrial"
                  maxLength={150}
                  required
                  autoFocus
                />
                <span>Máximo de 150 caracteres.</span>
              </div>

              <div className="clients-form-field">
                <label htmlFor="client-document">Documento</label>
                <input
                  id="client-document"
                  type="text"
                  value={form.document}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      document: event.target.value,
                    }))
                  }
                  placeholder="CNPJ ou outro identificador"
                  maxLength={20}
                />
                <span>Campo opcional, máximo de 20 caracteres.</span>
              </div>

              <footer className="clients-modal-footer">
                <button
                  type="button"
                  className="clients-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="clients-primary-button"
                  disabled={saving}
                >
                  {saving && <LoaderCircle size={17} className="clients-spinning" />}
                  {saving
                    ? 'Salvando...'
                    : editingClient
                      ? 'Salvar alterações'
                      : 'Cadastrar cliente'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .clients-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: var(--text, #202b3c);
        }

        .clients-page .page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .clients-page .page-head h1 {
          margin: 7px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.7px;
        }

        .clients-page .page-head p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 14px;
        }

        .clients-page .eyebrow {
          color: var(--muted, #778397);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .clients-primary-button,
        .clients-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 9px;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .clients-primary-button {
          color: white;
          background: var(--primary, #2457d6);
          border: 1px solid var(--primary, #2457d6);
        }

        .clients-primary-button:hover {
          filter: brightness(0.94);
        }

        .clients-secondary-button {
          color: var(--text, #344054);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
        }

        .clients-secondary-button:hover {
          background: var(--hover, #f6f8fb);
        }

        .clients-primary-button:disabled,
        .clients-secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .clients-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .clients-stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 20px;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .clients-stat-icon,
        .clients-avatar {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          color: var(--primary, #2457d6);
          background: var(--primary-soft, #edf3ff);
          border-radius: 10px;
        }

        .clients-stat-active {
          color: #16845b;
          background: #e8f7ef;
        }

        .clients-stat-inactive {
          color: #8b6470;
          background: #f8eef1;
        }

        .clients-stat-card > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .clients-stat-card span {
          color: var(--muted, #778397);
          font-size: 12px;
        }

        .clients-stat-card strong {
          font-size: 24px;
          line-height: 1.2;
        }

        .clients-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .clients-search {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 10px;
          min-width: 220px;
          min-height: 42px;
          padding: 0 12px;
          color: var(--muted, #8994a5);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
          border-radius: 9px;
        }

        .clients-search input {
          width: 100%;
          min-width: 0;
          color: var(--text, #202b3c);
          background: transparent;
          border: 0;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .clients-inactive-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted, #667085);
          font-size: 13px;
          cursor: pointer;
        }

        .clients-inactive-filter input {
          accent-color: var(--primary, #2457d6);
        }

        .clients-icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 36px;
          height: 36px;
          color: var(--muted, #667085);
          background: transparent;
          border: 1px solid var(--border, #e0e5ed);
          border-radius: 8px;
          cursor: pointer;
        }

        .clients-icon-button:hover {
          color: var(--primary, #2457d6);
          background: var(--hover, #f6f8fb);
        }

        .clients-icon-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .clients-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .clients-deactivate-button:hover {
          color: #c24141;
          background: #fff0f0;
        }

        .clients-activate-button:hover {
          color: #16845b;
          background: #e8f7ef;
        }

        .clients-table-container {
          overflow-x: auto;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .clients-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .clients-table th {
          padding: 14px 18px;
          color: var(--muted, #778397);
          background: var(--table-head, #f8f9fc);
          border-bottom: 1px solid var(--border, #e5eaf1);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.35px;
          white-space: nowrap;
        }

        .clients-table td {
          padding: 15px 18px;
          border-bottom: 1px solid var(--border, #edf0f5);
          vertical-align: middle;
        }

        .clients-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .clients-table tbody tr:hover {
          background: var(--hover, #fafbfe);
        }

        .clients-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 180px;
        }

        .clients-name-cell > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .clients-name-cell strong {
          font-weight: 600;
        }

        .clients-name-cell span {
          color: var(--muted, #8994a5);
          font-size: 11px;
        }

        .clients-avatar {
          width: 38px;
          height: 38px;
        }

        .clients-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .clients-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .clients-status.is-active {
          color: #16784f;
          background: #e7f7ee;
        }

        .clients-status.is-inactive {
          color: #687386;
          background: #eef0f4;
        }

        .clients-state-cell {
          height: 180px;
          color: var(--muted, #778397);
          text-align: center !important;
        }

        .clients-state-cell > * {
          margin-right: 6px;
          vertical-align: middle;
        }

        .clients-state-cell strong,
        .clients-state-cell span {
          display: block;
          margin: 8px 0 0;
        }

        .clients-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          color: #a32929;
          background: #fff0f0;
          border: 1px solid #ffd8d8;
          border-radius: 9px;
          font-size: 13px;
        }

        .clients-alert button {
          padding: 4px 0;
          color: inherit;
          background: transparent;
          border: 0;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .clients-modal-overlay {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgb(16 24 40 / 48%);
        }

        .clients-modal {
          width: min(100%, 520px);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          padding: 24px;
          color: var(--text, #202b3c);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 16px;
          box-shadow: 0 24px 70px rgb(16 24 40 / 22%);
        }

        .clients-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 26px;
        }

        .clients-modal-header h2 {
          margin: 8px 0;
          font-size: 22px;
          letter-spacing: -0.4px;
        }

        .clients-modal-header p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 13px;
          line-height: 1.5;
        }

        .clients-form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .clients-form-field label {
          font-size: 13px;
          font-weight: 600;
        }

        .clients-form-field input {
          width: 100%;
          box-sizing: border-box;
          min-height: 44px;
          padding: 0 12px;
          color: var(--text, #202b3c);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #d7deea);
          border-radius: 8px;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .clients-form-field input:focus {
          border-color: var(--primary, #2457d6);
          box-shadow: 0 0 0 3px rgb(36 87 214 / 10%);
        }

        .clients-form-field > span {
          color: var(--muted, #8994a5);
          font-size: 11px;
        }

        .clients-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid var(--border, #e5eaf1);
        }

        .clients-spinning {
          animation: clients-spin 1s linear infinite;
        }

        @keyframes clients-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .clients-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .clients-stat-card {
            padding: 14px;
          }

          .clients-toolbar {
            align-items: stretch;
          }

          .clients-search {
            flex-basis: 100%;
          }

          .clients-inactive-filter {
            flex: 1;
          }

          .clients-modal {
            padding: 18px;
          }

          .clients-modal-footer {
            flex-direction: column-reverse;
          }

          .clients-modal-footer button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
