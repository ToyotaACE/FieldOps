import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Pencil,
  UserX,
  UserCheck
} from 'lucide-react'

type UserRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TECHNICIAN'

type User = {
  id: number
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
  updatedAt: string
}

type UserForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080'
).replace(/\/$/, '')

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico'
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getRoleClass(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'badge approved'

    case 'SUPERVISOR':
      return 'badge running'

    case 'TECHNICIAN':
      return 'badge review'

    default:
      return 'badge scheduled'
  }
}

function formatDate(date: string) {
  if (!date) {
    return '-'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '-'
  }

  return parsedDate.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

function getToken() {
  return (
    localStorage.getItem('fieldops_token') ||
    sessionStorage.getItem('fieldops_token')
  )
}

function getTokenType() {
  return (
    localStorage.getItem('fieldops_token_type') ||
    sessionStorage.getItem('fieldops_token_type') ||
    'Bearer'
  )
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers = new Headers(
    options.headers
  )

  headers.set(
    'Content-Type',
    'application/json'
  )

  headers.set(
    'Accept',
    'application/json'
  )

  if (token) {
    headers.set(
      'Authorization',
      `${getTokenType()} ${token}`
    )
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  )

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`

    try {
      const errorBody = await response.json()

      if (typeof errorBody === 'string') {
        message = errorBody
      } else if (errorBody?.message) {
        message = errorBody.message
      } else if (errorBody?.error) {
        message = errorBody.error
      }
    } catch {
      // Resposta sem JSON.
    }

    if (response.status === 401) {
      throw new Error(
        'Sua sessão expirou. Faça login novamente.'
      )
    }

    if (response.status === 403) {
      throw new Error(
        'Seu usuário não possui permissão para acessar o gerenciamento de usuários.'
      )
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export function UsersPermissionsPage() {
  const [users, setUsers] = useState<User[]>([])

  const [search, setSearch] = useState('')

  const [roleFilter, setRoleFilter] = useState<
    UserRole | 'ALL'
  >('ALL')

  const [statusFilter, setStatusFilter] =
    useState<
      'ALL' | 'ACTIVE' | 'INACTIVE'
    >('ALL')

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingUser, setEditingUser] =
    useState<User | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] = useState('')

  const [form, setForm] =
    useState<UserForm>({
      name: '',
      email: '',
      password: '',
      role: 'TECHNICIAN'
    })

  const filteredUsers = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name
          .toLowerCase()
          .includes(term) ||
        user.email
          .toLowerCase()
          .includes(term)

      const matchesRole =
        roleFilter === 'ALL' ||
        user.role === roleFilter

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE'
          ? user.active
          : !user.active)

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      )
    })
  }, [
    users,
    search,
    roleFilter,
    statusFilter
  ])

  const activeUsers =
    users.filter(
      (user) => user.active
    ).length

  const inactiveUsers =
    users.filter(
      (user) => !user.active
    ).length

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const data =
        await apiRequest<User[]>(
          '/api/v1/users'
        )

      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os usuários.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function resetForm() {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'TECHNICIAN'
    })
  }

  function openNewUser() {
    setEditingUser(null)
    resetForm()
    setError('')
    setModalOpen(true)
  }

  function openEditUser(user: User) {
    setEditingUser(user)

    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })

    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setModalOpen(false)
    setEditingUser(null)
    resetForm()
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setSaving(true)
    setError('')

    try {
      if (editingUser) {
        const updatedUser =
          await apiRequest<User>(
            `/api/v1/users/${editingUser.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role
              })
            }
          )

        setUsers((current) =>
          current.map((user) =>
            user.id === updatedUser.id
              ? updatedUser
              : user
          )
        )
      } else {
        const createdUser =
          await apiRequest<User>(
            '/api/v1/users',
            {
              method: 'POST',
              body: JSON.stringify({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role: form.role
              })
            }
          )

        setUsers((current) => [
          createdUser,
          ...current
        ])
      }

      closeModal()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o usuário.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deactivateUser(
    user: User
  ) {
    if (!user.active) {
      return
    }

    const confirmed =
      window.confirm(
        `Deseja realmente desativar o usuário ${user.name}?`
      )

    if (!confirmed) {
      return
    }

    setError('')

    try {
      const updatedUser =
        await apiRequest<User>(
          `/api/v1/users/${user.id}/deactivate`,
          {
            method: 'PATCH'
          }
        )

      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id ===
          updatedUser.id
            ? updatedUser
            : currentUser
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível desativar o usuário.'
      )
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            ADMINISTRAÇÃO
          </div>

          <h1>
            Usuários e permissões
          </h1>

          <p>
            Gerencie usuários e níveis de acesso.
          </p>
        </div>

        <button
          type="button"
          className="primary"
          onClick={openNewUser}
        >
          <Plus size={17} />
          Novo usuário
        </button>
      </div>

      {error && !modalOpen && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background:
              'rgba(220, 38, 38, 0.08)',
            color: '#b91c1c',
            fontSize: '14px'
          }}
        >
          {error}
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <div className="stat-top">
            <span>Total de usuários</span>

            <div className="stat-icon blue">
              <UserRound size={17} />
            </div>
          </div>

          <div className="stat-value">
            {users.length}
          </div>

          <div className="stat-trend">
            Usuários cadastrados
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <span>Usuários ativos</span>

            <div className="stat-icon green">
              <UserCheck size={17} />
            </div>
          </div>

          <div className="stat-value">
            {activeUsers}
          </div>

          <div className="stat-trend">
            Com acesso ao sistema
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <span>Usuários inativos</span>

            <div className="stat-icon red">
              <UserX size={17} />
            </div>
          </div>

          <div className="stat-value">
            {inactiveUsers}
          </div>

          <div className="stat-trend">
            Acesso desativado
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search wide">
            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar usuário ou e-mail..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            className="filter"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as
                  | UserRole
                  | 'ALL'
              )
            }
          >
            <option value="ALL">
              Todos os perfis
            </option>

            <option value="ADMIN">
              Administrador
            </option>

            <option value="SUPERVISOR">
              Supervisor
            </option>

            <option value="TECHNICIAN">
              Técnico
            </option>
          </select>

          <select
            className="filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'ALL'
                  | 'ACTIVE'
                  | 'INACTIVE'
              )
            }
          >
            <option value="ALL">
              Todos os status
            </option>

            <option value="ACTIVE">
              Ativos
            </option>

            <option value="INACTIVE">
              Inativos
            </option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>USUÁRIO</th>
                <th>PERFIL</th>
                <th>STATUS</th>
                <th>ÚLTIMA ATUALIZAÇÃO</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>
                    <div className="no-results">
                      Carregando usuários...
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map(
                  (user) => (
                    <tr key={user.id}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '10px'
                          }}
                        >
                          <div className="avatar">
                            {getInitials(
                              user.name
                            )}
                          </div>

                          <div>
                            <b>
                              {user.name}
                            </b>

                            <span>
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={getRoleClass(
                            user.role
                          )}
                        >
                          {
                            ROLE_LABELS[
                              user.role
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            user.active
                              ? 'approved'
                              : 'scheduled'
                          }`}
                        >
                          {user.active
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.updatedAt
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            justifyContent:
                              'flex-end'
                          }}
                        >
                          <button
                            type="button"
                            className="icon-btn subtle"
                            title="Editar usuário"
                            onClick={() =>
                              openEditUser(
                                user
                              )
                            }
                          >
                            <Pencil
                              size={15}
                            />
                          </button>

                          {user.active && (
                            <button
                              type="button"
                              className="icon-btn subtle"
                              title="Desativar usuário"
                              onClick={() =>
                                deactivateUser(
                                  user
                                )
                              }
                            >
                              <UserX
                                size={15}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}

              {!loading &&
                filteredUsers.length ===
                  0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="no-results">
                        Nenhum usuário
                        encontrado.
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-topline">
              <span className="modal-kicker">
                ADMINISTRAÇÃO
              </span>

              <button
                type="button"
                className="close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="modal-intro">
              <div className="modal-icon">
                <ShieldCheck
                  size={23}
                />
              </div>

              <div>
                <h2>
                  {editingUser
                    ? 'Editar usuário'
                    : 'Novo usuário'}
                </h2>

                <p>
                  {editingUser
                    ? 'Atualize os dados e permissões do usuário.'
                    : 'Cadastre um novo usuário no sistema.'}
                </p>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  borderRadius: '7px',
                  background:
                    'rgba(220, 38, 38, 0.08)',
                  color: '#b91c1c',
                  fontSize: '13px'
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
            >
              <div className="modal-fields">
                <label>
                  Nome completo

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name: event
                            .target.value
                        })
                      )
                    }
                    placeholder="Nome do usuário"
                    required
                    maxLength={120}
                    disabled={saving}
                  />
                </label>

                <label>
                  E-mail

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          email:
                            event.target
                              .value
                        })
                      )
                    }
                    placeholder="usuario@empresa.com"
                    required
                    maxLength={150}
                    disabled={saving}
                  />
                </label>

                {!editingUser && (
                  <label>
                    Senha

                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            password:
                              event.target
                                .value
                          })
                        )
                      }
                      placeholder="Mínimo de 6 caracteres"
                      required
                      minLength={6}
                      disabled={saving}
                    />
                  </label>
                )}

                <label>
                  Perfil

                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          role: event.target
                            .value as UserRole
                        })
                      )
                    }
                    required
                    disabled={saving}
                  >
                    <option value="ADMIN">
                      Administrador
                    </option>

                    <option value="SUPERVISOR">
                      Supervisor
                    </option>

                    <option value="TECHNICIAN">
                      Técnico
                    </option>
                  </select>
                </label>
              </div>

              <div className="modal-footer">
                <small>
                  <ShieldCheck
                    size={13}
                  />
                  As permissões serão
                  aplicadas ao perfil
                  selecionado.
                </small>

                <div>
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Salvando...'
                      : editingUser
                        ? 'Salvar alterações'
                        : 'Cadastrar usuário'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
