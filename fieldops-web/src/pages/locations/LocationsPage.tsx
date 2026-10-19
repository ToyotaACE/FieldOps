import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Pencil,
  Power,
  RefreshCw,
  X,
  LoaderCircle,
  Building2,
} from 'lucide-react';

type Client = {
  id: number;
  name: string;
  document: string | null;
  active: boolean;
};

type Location = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  clientId: number;
  clientName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type LocationForm = {
  clientId: string;
  name: string;
  address: string;
  city: string;
  state: string;
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

const emptyForm: LocationForm = {
  clientId: '',
  name: '',
  address: '',
  city: '',
  state: '',
};

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [form, setForm] = useState<LocationForm>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [locationsData, clientsData] = await Promise.all([
        apiRequest<Location[]>('/api/v1/sites'),
        apiRequest<Client[]>('/api/v1/clients'),
      ]);

      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeClients = clients.filter((client) => client.active);

  const filteredLocations = locations.filter((location) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      location.name.toLowerCase().includes(term) ||
      location.clientName.toLowerCase().includes(term) ||
      (location.address || '').toLowerCase().includes(term) ||
      (location.city || '').toLowerCase().includes(term) ||
      String(location.id).includes(term);

    return matchesSearch && (showInactive || location.active);
  });

  const activeCount = locations.filter((location) => location.active).length;
  const inactiveCount = locations.length - activeCount;

  function openCreateModal() {
    setEditingLocation(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(location: Location) {
    setEditingLocation(location);

    setForm({
      clientId: String(location.clientId),
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
    });

    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingLocation(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientId = Number(form.clientId);
    const name = form.name.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const state = form.state.trim();

    if (!form.clientId || !Number.isInteger(clientId) || clientId <= 0) {
      setError('O cliente é obrigatório.');
      return;
    }

    if (!name) {
      setError('O nome do local é obrigatório.');
      return;
    }

    if (name.length > 150) {
      setError('O nome deve possuir no máximo 150 caracteres.');
      return;
    }

    if (address.length > 250) {
      setError('O endereço deve possuir no máximo 250 caracteres.');
      return;
    }

    if (city.length > 100) {
      setError('A cidade deve possuir no máximo 100 caracteres.');
      return;
    }

    if (state.length > 100) {
      setError('O estado deve possuir no máximo 100 caracteres.');
      return;
    }

    const selectedClient = clients.find(
      (client) => client.id === clientId,
    );

    if (!selectedClient) {
      setError('Cliente selecionado não encontrado.');
      return;
    }

    if (!selectedClient.active) {
      setError('Não é possível vincular um local a um cliente inativo.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body = JSON.stringify({
        clientId,
        name,
        address: address || null,
        city: city || null,
        state: state || null,
      });

      if (editingLocation) {
        await apiRequest<Location>(
          `/api/v1/sites/${editingLocation.id}`,
          {
            method: 'PUT',
            body,
          },
        );
      } else {
        await apiRequest<Location>('/api/v1/sites', {
          method: 'POST',
          body,
        });
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleLocation(location: Location) {
    const action = location.active ? 'desativar' : 'ativar';

    const confirmed = window.confirm(
      `Deseja realmente ${action} o local "${location.name}"?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await apiRequest<Location>(
        `/api/v1/sites/${location.id}/${
          location.active ? 'deactivate' : 'activate'
        }`,
        {
          method: 'PATCH',
        },
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="locations-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">GESTÃO OPERACIONAL</div>
          <h1>Locais</h1>
          <p>Gerencie unidades e locais atendidos pelo FieldOps.</p>
        </div>

        <button
          type="button"
          className="locations-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Novo local
        </button>
      </header>

      <div className="locations-stats">
        <article className="locations-stat-card">
          <div className="locations-stat-icon">
            <MapPin size={20} />
          </div>

          <div>
            <span>Total de locais</span>
            <strong>{locations.length}</strong>
          </div>
        </article>

        <article className="locations-stat-card">
          <div className="locations-stat-icon locations-stat-active">
            <MapPin size={20} />
          </div>

          <div>
            <span>Locais ativos</span>
            <strong>{activeCount}</strong>
          </div>
        </article>

        <article className="locations-stat-card">
          <div className="locations-stat-icon locations-stat-inactive">
            <Power size={20} />
          </div>

          <div>
            <span>Locais inativos</span>
            <strong>{inactiveCount}</strong>
          </div>
        </article>
      </div>

      {error && !modalOpen && (
        <div className="locations-alert" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadData()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="locations-toolbar">
        <div className="locations-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Buscar por local, cliente, cidade..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar locais"
          />
        </div>

        <label className="locations-inactive-filter">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(event.target.checked)
            }
          />

          Mostrar inativos
        </label>

        <button
          type="button"
          className="locations-icon-button"
          onClick={() => void loadData()}
          disabled={loading}
          aria-label="Atualizar lista"
          title="Atualizar lista"
        >
          <RefreshCw
            size={17}
            className={loading ? 'locations-spinning' : ''}
          />
        </button>
      </div>

      <div className="locations-table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>Local</th>
              <th>Cliente</th>
              <th>Endereço</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="locations-state-cell">
                  <LoaderCircle
                    size={24}
                    className="locations-spinning"
                  />

                  <span>Carregando locais...</span>
                </td>
              </tr>
            ) : filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={6} className="locations-state-cell">
                  <MapPin size={28} />

                  <strong>Nenhum local encontrado</strong>

                  <span>
                    {search
                      ? 'Tente alterar os termos da busca.'
                      : 'Cadastre um local para começar.'}
                  </span>
                </td>
              </tr>
            ) : (
              filteredLocations.map((location) => (
                <tr key={location.id}>
                  <td>
                    <div className="locations-name-cell">
                      <div className="locations-avatar">
                        <MapPin size={18} />
                      </div>

                      <div>
                        <strong>{location.name}</strong>
                        <span>
                          LOC-
                          {String(location.id).padStart(3, '0')}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="locations-client">
                      <Building2 size={15} />
                      {location.clientName}
                    </span>
                  </td>

                  <td>
                    <div className="locations-address">
                      <strong>
                        {location.address || '—'}
                      </strong>

                      {(location.city || location.state) && (
                        <span>
                          {[location.city, location.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`locations-status ${
                        location.active
                          ? 'is-active'
                          : 'is-inactive'
                      }`}
                    >
                      <span className="locations-status-dot" />

                      {location.active
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </td>

                  <td>
                    {location.createdAt
                      ? new Date(
                          location.createdAt,
                        ).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>

                  <td>
                    <div className="locations-actions">
                      <button
                        type="button"
                        className="locations-icon-button"
                        title="Editar local"
                        aria-label={`Editar ${location.name}`}
                        onClick={() =>
                          openEditModal(location)
                        }
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className={`locations-icon-button ${
                          location.active
                            ? 'locations-deactivate-button'
                            : 'locations-activate-button'
                        }`}
                        title={
                          location.active
                            ? 'Desativar local'
                            : 'Ativar local'
                        }
                        aria-label={`${
                          location.active
                            ? 'Desativar'
                            : 'Ativar'
                        } ${location.name}`}
                        onClick={() =>
                          void toggleLocation(location)
                        }
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
          className="locations-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="locations-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="locations-modal-title"
          >
            <header className="locations-modal-header">
              <div>
                <div className="eyebrow">
                  NOVO LOCAL
                </div>

                <h2 id="locations-modal-title">
                  {editingLocation
                    ? 'Editar local'
                    : 'Novo local'}
                </h2>

                <p>
                  {editingLocation
                    ? 'Atualize os dados do local.'
                    : 'Configure os dados principais do local.'}
                </p>
              </div>

              <button
                type="button"
                className="locations-icon-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar formulário"
              >
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="locations-alert"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="locations-form-field">
                <label htmlFor="location-client">
                  Cliente *
                </label>

                <select
                  id="location-client"
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      clientId: event.target.value,
                    }))
                  }
                  required
                  autoFocus
                >
                  <option value="">
                    Selecione o cliente
                  </option>

                  {activeClients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>

                <span>
                  O local deve obrigatoriamente pertencer
                  a um cliente ativo.
                </span>

                {activeClients.length === 0 && (
                  <small className="locations-form-warning">
                    Não existem clientes ativos disponíveis.
                  </small>
                )}
              </div>

              <div className="locations-form-grid">
                <div className="locations-form-field">
                  <label htmlFor="location-name">
                    Nome da unidade *
                  </label>

                  <input
                    id="location-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Planta Sorocaba"
                    maxLength={150}
                    required
                  />

                  <span>
                    Máximo de 150 caracteres.
                  </span>
                </div>

                <div className="locations-form-field">
                  <label htmlFor="location-address">
                    Endereço e referência
                  </label>

                  <textarea
                    id="location-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Informe endereço ou ponto de referência..."
                    maxLength={250}
                    rows={3}
                  />

                  <span>
                    Campo opcional, máximo de 250 caracteres.
                  </span>
                </div>
              </div>

              <div className="locations-form-grid">
                <div className="locations-form-field">
                  <label htmlFor="location-city">
                    Cidade
                  </label>

                  <input
                    id="location-city"
                    type="text"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Sorocaba"
                    maxLength={100}
                  />
                </div>

                <div className="locations-form-field">
                  <label htmlFor="location-state">
                    Estado
                  </label>

                  <input
                    id="location-state"
                    type="text"
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    placeholder="Ex.: SP"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="locations-form-info">
                <MapPin size={16} />
                <span>
                  O cliente é obrigatório conforme a regra
                  de negócio RN-009.
                </span>
              </div>

              <footer className="locations-modal-footer">
                <button
                  type="button"
                  className="locations-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="locations-primary-button"
                  disabled={
                    saving || activeClients.length === 0
                  }
                >
                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="locations-spinning"
                    />
                  )}

                  {saving
                    ? 'Salvando...'
                    : editingLocation
                      ? 'Salvar alterações'
                      : 'Salvar registro'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .locations-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: var(--text, #202b3c);
        }

        .locations-page .page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .locations-page .page-head h1 {
          margin: 7px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.7px;
        }

        .locations-page .page-head p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 14px;
        }

        .locations-page .eyebrow {
          color: var(--muted, #778397);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .locations-primary-button,
        .locations-secondary-button {
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
        }

        .locations-primary-button {
          color: white;
          background: var(--primary, #2457d6);
          border: 1px solid var(--primary, #2457d6);
        }

        .locations-primary-button:hover {
          filter: brightness(.94);
        }

        .locations-primary-button:disabled,
        .locations-secondary-button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .locations-secondary-button {
          color: var(--text, #344054);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
        }

        .locations-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .locations-stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .locations-stat-icon,
        .locations-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          color: var(--primary, #2457d6);
          background: var(--primary-soft, #edf3ff);
          border-radius: 10px;
        }

        .locations-stat-active {
          color: #16845b;
          background: #e8f7ef;
        }

        .locations-stat-inactive {
          color: #8b6470;
          background: #f8eef1;
        }

        .locations-stat-card > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .locations-stat-card span {
          color: var(--muted, #778397);
          font-size: 12px;
        }

        .locations-stat-card strong {
          font-size: 24px;
          line-height: 1.2;
        }

        .locations-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .locations-search {
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

        .locations-search input {
          width: 100%;
          min-width: 0;
          color: var(--text, #202b3c);
          background: transparent;
          border: 0;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .locations-inactive-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted, #667085);
          font-size: 13px;
          cursor: pointer;
        }

        .locations-inactive-filter input {
          accent-color: var(--primary, #2457d6);
        }

        .locations-icon-button {
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

        .locations-icon-button:hover {
          color: var(--primary, #2457d6);
          background: var(--hover, #f6f8fb);
        }

        .locations-icon-button:disabled {
          cursor: not-allowed;
          opacity: .6;
        }

        .locations-table-container {
          overflow-x: auto;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .locations-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .locations-table th {
          padding: 13px 18px;
          color: #60708a;
          background: #f8fafc;
          border-bottom: 1px solid var(--border, #e5eaf1);
          font-size: 11px;
          font-weight: 700;
          text-align: left;
        }

        .locations-table td {
          padding: 15px 18px;
          border-bottom: 1px solid var(--border, #edf0f5);
          font-size: 13px;
          vertical-align: middle;
        }

        .locations-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .locations-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .locations-name-cell > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .locations-name-cell strong {
          font-size: 13px;
        }

        .locations-name-cell span {
          color: var(--muted, #778397);
          font-size: 11px;
        }

        .locations-client {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #50617b;
        }

        .locations-address {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .locations-address strong {
          font-size: 12px;
          font-weight: 500;
        }

        .locations-address span {
          color: var(--muted, #778397);
          font-size: 11px;
        }

        .locations-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-width: 82px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .locations-status.is-active {
          color: #16845b;
          background: #e5f6ed;
        }

        .locations-status.is-inactive {
          color: #8b6470;
          background: #f8eef1;
        }

        .locations-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .locations-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .locations-deactivate-button:hover {
          color: #c24141;
          background: #fff0f0;
        }

        .locations-activate-button:hover {
          color: #16845b;
          background: #e8f7ef;
        }

        .locations-state-cell {
          height: 150px;
          color: var(--muted, #778397);
          text-align: center;
        }

        .locations-state-cell > * {
          display: block;
          margin: 6px auto;
        }

        .locations-state-cell strong {
          color: var(--text, #202b3c);
        }

        .locations-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          color: #9a2f2f;
          background: #fff3f3;
          border: 1px solid #f2d0d0;
          border-radius: 9px;
          font-size: 13px;
        }

        .locations-alert button {
          color: inherit;
          background: transparent;
          border: 0;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .locations-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, .45);
        }

        .locations-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, .18);
        }

        .locations-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 26px 28px 20px;
          border-bottom: 1px solid var(--border, #edf0f5);
        }

        .locations-modal-header h2 {
          margin: 7px 0;
          font-size: 24px;
          letter-spacing: -.5px;
        }

        .locations-modal-header p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 13px;
        }

        .locations-modal form {
          padding: 24px 28px 28px;
        }

        .locations-form-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 18px;
        }

        .locations-form-field label {
          color: var(--text, #344054);
          font-size: 13px;
          font-weight: 700;
        }

        .locations-form-field input,
        .locations-form-field select,
        .locations-form-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          color: var(--text, #202b3c);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #d8dee8);
          border-radius: 9px;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .locations-form-field textarea {
          min-height: 88px;
          resize: vertical;
        }

        .locations-form-field input:focus,
        .locations-form-field select:focus,
        .locations-form-field textarea:focus {
          border-color: var(--primary, #2457d6);
          box-shadow: 0 0 0 3px rgba(36, 87, 214, .10);
        }

        .locations-form-field span {
          color: var(--muted, #778397);
          font-size: 11px;
        }

        .locations-form-warning {
          color: #b54708;
          font-size: 11px;
        }

        .locations-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .locations-form-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 4px 0 22px;
          padding: 11px 12px;
          color: #49617f;
          background: #f4f8ff;
          border: 1px solid #dbe7fb;
          border-radius: 9px;
          font-size: 12px;
        }

        .locations-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 18px;
          border-top: 1px solid var(--border, #edf0f5);
        }

        .locations-spinning {
          animation: locations-spin .8s linear infinite;
        }

        @keyframes locations-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .locations-stats {
            grid-template-columns: 1fr;
          }

          .locations-form-grid {
            grid-template-columns: 1fr;
          }

          .locations-modal-header,
          .locations-modal form {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </section>
  );
}