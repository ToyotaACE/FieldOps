import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  Wrench,
  Plus,
  Search,
  Pencil,
  Power,
  RefreshCw,
  X,
  LoaderCircle,
} from 'lucide-react';

type Equipment = {
  id: number;
  name: string;
  category: string | null;
  serialNumber: string | null;
  qrCode: string;
  active: boolean;
  siteId: number;
  siteName: string;
  clientId: number;
  clientName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type Site = {
  id: number;
  name: string;
  active: boolean;
  clientId: number;
  clientName: string;
};

type EquipmentForm = {
  name: string;
  category: string;
  serialNumber: string;
  qrCode: string;
  siteId: string;
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
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message ||
        `Erro na API (${response.status}). Tente novamente.`,
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

export function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] =
    useState<Equipment | null>(null);

  const [form, setForm] = useState<EquipmentForm>({
    name: '',
    category: '',
    serialNumber: '',
    qrCode: '',
    siteId: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [equipmentData, siteData] =
        await Promise.all([
          apiRequest<Equipment[]>(
            '/api/v1/equipments',
          ),
          apiRequest<Site[]>(
            '/api/v1/sites',
          ),
        ]);

      setEquipments(
        Array.isArray(equipmentData)
          ? equipmentData
          : [],
      );

      setSites(
        Array.isArray(siteData)
          ? siteData
          : [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeSites = sites.filter(
    (site) => site.active,
  );

  const filteredEquipments =
    equipments.filter((equipment) => {
      const term = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        !term ||
        equipment.name
          .toLowerCase()
          .includes(term) ||
        (equipment.category || '')
          .toLowerCase()
          .includes(term) ||
        (equipment.serialNumber || '')
          .toLowerCase()
          .includes(term) ||
        equipment.qrCode
          .toLowerCase()
          .includes(term) ||
        equipment.siteName
          .toLowerCase()
          .includes(term) ||
        equipment.clientName
          .toLowerCase()
          .includes(term) ||
        String(equipment.id).includes(term);

      return (
        matchesSearch &&
        (showInactive || equipment.active)
      );
    });

  const activeCount = equipments.filter(
    (equipment) => equipment.active,
  ).length;

  const inactiveCount =
    equipments.length - activeCount;

  function openCreateModal() {
    setEditingEquipment(null);

    setForm({
      name: '',
      category: '',
      serialNumber: '',
      qrCode: '',
      siteId: '',
    });

    setError('');
    setModalOpen(true);
  }

  function openEditModal(
    equipment: Equipment,
  ) {
    setEditingEquipment(equipment);

    setForm({
      name: equipment.name,
      category: equipment.category || '',
      serialNumber:
        equipment.serialNumber || '',
      qrCode: equipment.qrCode,
      siteId: String(equipment.siteId),
    });

    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingEquipment(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const serialNumber =
      form.serialNumber.trim();
    const qrCode = form.qrCode.trim();
    const siteId = Number(form.siteId);

    if (!name) {
      setError(
        'O nome do equipamento é obrigatório.',
      );
      return;
    }

    if (name.length > 150) {
      setError(
        'O nome deve possuir no máximo 150 caracteres.',
      );
      return;
    }

    if (!qrCode) {
      setError(
        'O QR Code é obrigatório.',
      );
      return;
    }

    if (qrCode.length > 150) {
      setError(
        'O QR Code deve possuir no máximo 150 caracteres.',
      );
      return;
    }

    if (category.length > 100) {
      setError(
        'A categoria deve possuir no máximo 100 caracteres.',
      );
      return;
    }

    if (serialNumber.length > 100) {
      setError(
        'O número de série deve possuir no máximo 100 caracteres.',
      );
      return;
    }

    if (
      !form.siteId ||
      !Number.isInteger(siteId) ||
      siteId <= 0
    ) {
      setError(
        'O local é obrigatório.',
      );
      return;
    }

    const selectedSite =
      sites.find(
        (site) => site.id === siteId,
      );

    if (!selectedSite) {
      setError(
        'Local selecionado não encontrado.',
      );
      return;
    }

    if (!selectedSite.active) {
      setError(
        'Não é possível vincular um equipamento a um local inativo.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body = JSON.stringify({
        name,
        category: category || null,
        serialNumber:
          serialNumber || null,
        qrCode,
        siteId,
      });

      if (editingEquipment) {
        await apiRequest<Equipment>(
          `/api/v1/equipments/${editingEquipment.id}`,
          {
            method: 'PUT',
            body,
          },
        );
      } else {
        await apiRequest<Equipment>(
          '/api/v1/equipments',
          {
            method: 'POST',
            body,
          },
        );
      }

      setModalOpen(false);
      setEditingEquipment(null);

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleEquipment(
    equipment: Equipment,
  ) {
    const action = equipment.active
      ? 'desativar'
      : 'ativar';

    const confirmed =
      window.confirm(
        `Deseja realmente ${action} o equipamento "${equipment.name}"?`,
      );

    if (!confirmed) return;

    setError('');

    try {
      await apiRequest<Equipment>(
        `/api/v1/equipments/${equipment.id}/${
          equipment.active
            ? 'deactivate'
            : 'activate'
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
    <section className="equipment-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">
            GESTÃO OPERACIONAL
          </div>

          <h1>Equipamentos</h1>

          <p>
            Gerencie os equipamentos utilizados nas
            inspeções.
          </p>
        </div>

        <button
          type="button"
          className="equipment-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Novo equipamento
        </button>
      </header>

      <div className="equipment-stats">
        <article className="equipment-stat-card">
          <div className="equipment-stat-icon">
            <Wrench size={20} />
          </div>

          <div>
            <span>
              Total de equipamentos
            </span>

            <strong>
              {equipments.length}
            </strong>
          </div>
        </article>

        <article className="equipment-stat-card">
          <div className="equipment-stat-icon equipment-stat-active">
            <Wrench size={20} />
          </div>

          <div>
            <span>
              Equipamentos ativos
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="equipment-stat-card">
          <div className="equipment-stat-icon equipment-stat-inactive">
            <Power size={20} />
          </div>

          <div>
            <span>
              Equipamentos inativos
            </span>

            <strong>
              {inactiveCount}
            </strong>
          </div>
        </article>
      </div>

      {error && !modalOpen && (
        <div
          className="equipment-alert"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadData()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="equipment-toolbar">
        <div className="equipment-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Buscar por nome, QR Code, série ou local..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Buscar equipamentos"
          />
        </div>

        <label className="equipment-inactive-filter">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(
                event.target.checked,
              )
            }
          />

          Mostrar inativos
        </label>

        <button
          type="button"
          className="equipment-icon-button"
          onClick={() => void loadData()}
          disabled={loading}
          aria-label="Atualizar lista"
          title="Atualizar lista"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? 'equipment-spinning'
                : ''
            }
          />
        </button>
      </div>

      <div className="equipment-table-container">
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Equipamento</th>
              <th>QR Code</th>
              <th>Nº de série</th>
              <th>Local</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="equipment-state-cell"
                >
                  <LoaderCircle
                    className="equipment-spinning"
                    size={24}
                  />

                  <span>
                    Carregando equipamentos...
                  </span>
                </td>
              </tr>
            ) : filteredEquipments.length ===
              0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="equipment-state-cell"
                >
                  <Wrench size={28} />

                  <strong>
                    Nenhum equipamento encontrado
                  </strong>

                  <span>
                    {search
                      ? 'Tente alterar os termos da busca.'
                      : 'Cadastre um equipamento para começar.'}
                  </span>
                </td>
              </tr>
            ) : (
              filteredEquipments.map(
                (equipment) => (
                  <tr key={equipment.id}>
                    <td>
                      <div className="equipment-name-cell">
                        <div className="equipment-avatar">
                          <Wrench size={18} />
                        </div>

                        <div>
                          <strong>
                            {equipment.name}
                          </strong>

                          <span>
                            EQP-
                            {String(
                              equipment.id,
                            ).padStart(3, '0')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {equipment.qrCode}
                    </td>

                    <td>
                      {equipment.serialNumber ||
                        '—'}
                    </td>

                    <td>
                      <div className="equipment-location">
                        <strong>
                          {equipment.siteName}
                        </strong>

                        {equipment.category && (
                          <span>
                            {equipment.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {equipment.clientName}
                    </td>

                    <td>
                      <span
                        className={`equipment-status ${
                          equipment.active
                            ? 'is-active'
                            : 'is-inactive'
                        }`}
                      >
                        <span className="equipment-status-dot" />

                        {equipment.active
                          ? 'Ativo'
                          : 'Inativo'}
                      </span>
                    </td>

                    <td>
                      {equipment.createdAt
                        ? new Date(
                            equipment.createdAt,
                          ).toLocaleDateString(
                            'pt-BR',
                          )
                        : '—'}
                    </td>

                    <td>
                      <div className="equipment-actions">
                        <button
                          type="button"
                          className="equipment-icon-button"
                          title="Editar equipamento"
                          aria-label={`Editar ${equipment.name}`}
                          onClick={() =>
                            openEditModal(
                              equipment,
                            )
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className={`equipment-icon-button ${
                            equipment.active
                              ? 'equipment-deactivate-button'
                              : 'equipment-activate-button'
                          }`}
                          title={
                            equipment.active
                              ? 'Desativar equipamento'
                              : 'Ativar equipamento'
                          }
                          aria-label={`${
                            equipment.active
                              ? 'Desativar'
                              : 'Ativar'
                          } ${equipment.name}`}
                          onClick={() =>
                            void toggleEquipment(
                              equipment,
                            )
                          }
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="equipment-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="equipment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="equipment-modal-title"
          >
            <header className="equipment-modal-header">
              <div>
                <div className="eyebrow">
                  GESTÃO OPERACIONAL
                </div>

                <h2 id="equipment-modal-title">
                  {editingEquipment
                    ? 'Editar equipamento'
                    : 'Novo equipamento'}
                </h2>

                <p>
                  {editingEquipment
                    ? 'Atualize os dados do equipamento.'
                    : 'Preencha os dados do equipamento que será utilizado nas inspeções.'}
                </p>
              </div>

              <button
                type="button"
                className="equipment-icon-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar formulário"
              >
                <X size={19} />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
            >
              {error && (
                <div
                  className="equipment-alert"
                  role="alert"
                >
                  <span>{error}</span>
                </div>
              )}

              <div className="equipment-form-grid">
                <div className="equipment-form-field">
                  <label htmlFor="equipment-name">
                    Nome / identificação *
                  </label>

                  <input
                    id="equipment-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name: event.target.value,
                        }),
                      )
                    }
                    placeholder="Ex.: Compressor CP-002"
                    maxLength={150}
                    required
                    autoFocus
                    disabled={saving}
                  />

                  <span>
                    Máximo de 150 caracteres.
                  </span>
                </div>

                <div className="equipment-form-field">
                  <label htmlFor="equipment-category">
                    Categoria
                  </label>

                  <input
                    id="equipment-category"
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          category:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Ex.: Compressor"
                    maxLength={100}
                    disabled={saving}
                  />

                  <span>
                    Campo opcional.
                  </span>
                </div>

                <div className="equipment-form-field">
                  <label htmlFor="equipment-qr">
                    Código QR *
                  </label>

                  <input
                    id="equipment-qr"
                    type="text"
                    value={form.qrCode}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          qrCode:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Ex.: EQP-0002"
                    maxLength={150}
                    required
                    disabled={saving}
                  />

                  <span>
                    O código deve ser único no sistema.
                  </span>
                </div>

                <div className="equipment-form-field">
                  <label htmlFor="equipment-serial">
                    Número de série
                  </label>

                  <input
                    id="equipment-serial"
                    type="text"
                    value={form.serialNumber}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          serialNumber:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Ex.: SN-2026-0002"
                    maxLength={100}
                    disabled={saving}
                  />

                  <span>
                    Campo opcional.
                  </span>
                </div>

                <div className="equipment-form-field equipment-form-full">
                  <label htmlFor="equipment-site">
                    Local *
                  </label>

                  <select
                    id="equipment-site"
                    value={form.siteId}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          siteId:
                            event.target.value,
                        }),
                      )
                    }
                    required
                    disabled={
                      saving ||
                      activeSites.length === 0
                    }
                  >
                    <option value="">
                      Selecione o local
                    </option>

                    {activeSites.map(
                      (site) => (
                        <option
                          key={site.id}
                          value={site.id}
                        >
                          {site.name} —{' '}
                          {site.clientName}
                        </option>
                      ),
                    )}
                  </select>

                  <span>
                    Somente locais ativos podem receber equipamentos.
                  </span>

                  {activeSites.length === 0 && (
                    <small className="equipment-form-warning">
                      Não existem locais ativos disponíveis.
                    </small>
                  )}
                </div>
              </div>

              <footer className="equipment-modal-footer">
                <button
                  type="button"
                  className="equipment-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="equipment-primary-button"
                  disabled={saving}
                >
                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="equipment-spinning"
                    />
                  )}

                  {saving
                    ? 'Salvando...'
                    : editingEquipment
                      ? 'Salvar alterações'
                      : 'Cadastrar equipamento'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .equipment-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: var(--text, #202b3c);
        }

        .equipment-page .page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .equipment-page .page-head h1 {
          margin: 7px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.7px;
        }

        .equipment-page .page-head p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 14px;
        }

        .equipment-page .eyebrow {
          color: var(--muted, #778397);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .equipment-primary-button,
        .equipment-secondary-button {
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
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .equipment-primary-button {
          color: white;
          background: var(--primary, #2457d6);
          border: 1px solid var(--primary, #2457d6);
        }

        .equipment-primary-button:hover {
          filter: brightness(0.94);
        }

        .equipment-secondary-button {
          color: var(--text, #344054);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
        }

        .equipment-secondary-button:hover {
          background: var(--hover, #f6f8fb);
        }

        .equipment-primary-button:disabled,
        .equipment-secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .equipment-stats {
          display: grid;
          grid-template-columns: repeat(
            3,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        .equipment-stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 20px;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .equipment-stat-icon,
        .equipment-avatar {
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

        .equipment-stat-active {
          color: #16845b;
          background: #e8f7ef;
        }

        .equipment-stat-inactive {
          color: #8b6470;
          background: #f8eef1;
        }

        .equipment-stat-card > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .equipment-stat-card span {
          color: var(--muted, #778397);
          font-size: 12px;
        }

        .equipment-stat-card strong {
          font-size: 24px;
          line-height: 1.2;
        }

        .equipment-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .equipment-search {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 10px;
          min-width: 260px;
          min-height: 42px;
          padding: 0 12px;
          color: var(--muted, #8994a5);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
          border-radius: 9px;
        }

        .equipment-search input {
          width: 100%;
          min-width: 0;
          color: var(--text, #202b3c);
          background: transparent;
          border: 0;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .equipment-inactive-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted, #667085);
          font-size: 13px;
          cursor: pointer;
        }

        .equipment-inactive-filter input {
          accent-color: var(--primary, #2457d6);
        }

        .equipment-icon-button {
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

        .equipment-icon-button:hover {
          color: var(--primary, #2457d6);
          background: var(--hover, #f6f8fb);
        }

        .equipment-icon-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .equipment-table-container {
          overflow-x: auto;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5eaf1);
          border-radius: 12px;
        }

        .equipment-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .equipment-table th {
          padding: 13px 18px;
          color: #60708a;
          background: #f8fafc;
          border-bottom: 1px solid var(--border, #e5eaf1);
          font-size: 11px;
          font-weight: 700;
          text-align: left;
        }

        .equipment-table td {
          padding: 15px 18px;
          border-bottom: 1px solid var(--border, #edf0f5);
          font-size: 13px;
          vertical-align: middle;
        }

        .equipment-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .equipment-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .equipment-name-cell > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .equipment-name-cell strong {
          font-size: 13px;
        }

        .equipment-name-cell span {
          color: var(--muted, #778397);
          font-size: 11px;
        }

        .equipment-location {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .equipment-location strong {
          font-size: 12px;
          font-weight: 600;
        }

        .equipment-location span {
          color: var(--muted, #778397);
          font-size: 11px;
        }

        .equipment-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-width: 82px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .equipment-status.is-active {
          color: #16845b;
          background: #e5f6ed;
        }

        .equipment-status.is-inactive {
          color: #8b6470;
          background: #f8eef1;
        }

        .equipment-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .equipment-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .equipment-deactivate-button:hover {
          color: #c24141;
          background: #fff0f0;
        }

        .equipment-activate-button:hover {
          color: #16845b;
          background: #e8f7ef;
        }

        .equipment-state-cell {
          height: 150px;
          color: var(--muted, #778397);
          text-align: center;
        }

        .equipment-state-cell > * {
          display: block;
          margin: 6px auto;
        }

        .equipment-state-cell strong {
          color: var(--text, #202b3c);
        }

        .equipment-alert {
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

        .equipment-alert button {
          color: inherit;
          background: transparent;
          border: 0;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .equipment-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.45);
        }

        .equipment-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e0e5ed);
          border-radius: 16px;
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.18);
        }

        .equipment-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 26px 28px 20px;
          border-bottom: 1px solid var(--border, #edf0f5);
        }

        .equipment-modal-header h2 {
          margin: 7px 0;
          font-size: 24px;
          letter-spacing: -0.5px;
        }

        .equipment-modal-header p {
          margin: 0;
          color: var(--muted, #778397);
          font-size: 13px;
        }

        .equipment-modal form {
          padding: 24px 28px 28px;
        }

        .equipment-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .equipment-form-full {
          grid-column: 1 / -1;
        }

        .equipment-form-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .equipment-form-field label {
          color: var(--text, #344054);
          font-size: 13px;
          font-weight: 700;
        }

        .equipment-form-field input,
        .equipment-form-field select {
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

        .equipment-form-field input:focus,
        .equipment-form-field select:focus {
          border-color: var(--primary, #2457d6);
          box-shadow:
            0 0 0 3px rgba(36, 87, 214, 0.1);
        }

        .equipment-form-field span {
          color: var(--muted, #778397);
          font-size: 11px;
          font-weight: 400;
        }

        .equipment-form-warning {
          color: #b54708;
          font-size: 11px;
        }

        .equipment-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--border, #edf0f5);
        }

        .equipment-modal-footer > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .equipment-spinning {
          animation: equipment-spin 0.8s linear infinite;
        }

        @keyframes equipment-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .equipment-table {
            min-width: 1000px;
          }
        }

        @media (max-width: 760px) {
          .equipment-stats {
            grid-template-columns: 1fr;
          }

          .equipment-form-grid {
            grid-template-columns: 1fr;
          }

          .equipment-form-full {
            grid-column: auto;
          }

          .equipment-modal-header,
          .equipment-modal form {
            padding-left: 20px;
            padding-right: 20px;
          }

          .equipment-modal-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .equipment-modal-footer > div {
            justify-content: flex-end;
          }
        }
      `}</style>
    </section>
  );
}

export default EquipmentPage;