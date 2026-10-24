
import './SettingsPage.css'
import { useEffect, useState } from 'react'
import {
  Bell, CheckCircle2, Globe2, LockKeyhole, Save, Settings,
  ShieldCheck, SunMoon, Users, WifiOff, Mail, RotateCcw, UserRound
} from 'lucide-react'

type SettingsTab =
  | 'Meu perfil'
  | 'Geral'
  | 'Notificações'
  | 'Equipe e permissões'
  | 'Segurança'

type Preferences = {
  organizationName: string
  timezone: string
  language: string
  emailNotifications: boolean
  reviewNotifications: boolean
  assignmentNotifications: boolean
  nonconformityNotifications: boolean
  offlineMode: boolean
  sessionTimeout: string
}

type UserProfile = {
  id: number
  name: string
  email: string
  role: string
  active: boolean
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const STORAGE_KEY = 'fieldops_settings_v1'
const DEFAULTS: Preferences = {
  organizationName: 'FieldOps Operações',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  emailNotifications: true,
  reviewNotifications: true,
  assignmentNotifications: true,
  nonconformityNotifications: true,
  offlineMode: true,
  sessionTimeout: '30',
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function getToken() {
  return localStorage.getItem('fieldops_token')
    || sessionStorage.getItem('fieldops_token')
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = `Erro na requisição (${response.status}).`

    try {
      const body = await response.json()
      message = body.message || body.error || message
    } catch {
      // Mantém a mensagem padrão quando a API não retorna JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) return null

  return response.json()
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('Meu perfil')
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setPreferences(loadPreferences())

    async function loadProfile() {
      try {
        const data = await apiRequest('/api/v1/auth/me') as UserProfile

        setProfile(data)
        setName(data.name)
        setEmail(data.email)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar seu perfil.'
        )
      } finally {
        setLoadingProfile(false)
      }
    }

    void loadProfile()
  }, [])

  function update<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPreferences(current => ({ ...current, [key]: value }))
    setSaved(false)
    setMessage('')
    setError('')
  }

  function savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      setSaved(true)
      setMessage('Preferências salvas neste navegador.')
      setError('')
    } catch {
      setSaved(false)
      setError('Não foi possível salvar as preferências neste navegador.')
    }
  }

  function resetPreferences() {
    setPreferences(DEFAULTS)
    setSaved(false)
    setMessage('')
    setError('')
  }

  async function saveProfile() {
    setMessage('')
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Preencha o nome e o e-mail.')
      return
    }

    setSavingProfile(true)

    try {
      const updated = await apiRequest('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      }) as UserProfile

      setProfile(updated)
      setName(updated.name)
      setEmail(updated.email)
      setMessage('Perfil atualizado com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar o perfil.'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword() {
    setMessage('')
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos de senha.')
      return
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação não corresponde à nova senha.')
      return
    }

    if (newPassword === currentPassword) {
      setError('A nova senha deve ser diferente da senha atual.')
      return
    }

    setSavingPassword(true)

    try {
      await apiRequest('/api/v1/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Senha alterada com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível alterar a senha.'
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const tabs: { label: SettingsTab; icon: typeof Settings }[] = [
    { label: 'Meu perfil', icon: UserRound },
    { label: 'Geral', icon: Settings },
    { label: 'Notificações', icon: Bell },
    { label: 'Equipe e permissões', icon: Users },
    { label: 'Segurança', icon: ShieldCheck },
  ]

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREFERÊNCIAS</span>
          <h1>Configurações</h1>
          <p className="muted">
            Gerencie seu perfil e as preferências do FieldOps.
          </p>
        </div>

        {tab !== 'Meu perfil' && tab !== 'Segurança' && (
          <button className="primary" onClick={savePreferences}>
            <Save size={16} /> Salvar alterações
          </button>
        )}
      </div>

      <div className="settings-layout">
        <nav className="panel settings-menu" aria-label="Categorias de configurações">
          {tabs.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`settings-menu-item ${tab === label ? 'active' : ''}`}
              onClick={() => {
                setTab(label)
                setMessage('')
                setError('')
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}

          <div className="settings-menu-note">
            <LockKeyhole size={15} />
            Seus dados pessoais são atualizados pela API.
          </div>
        </nav>

        <section className="panel settings-content">
          {tab === 'Meu perfil' && (
            <>
              <div className="settings-section-title">
                <UserRound size={20} />
                <div>
                  <h2>Meu perfil</h2>
                  <p>Atualize as informações da sua conta.</p>
                </div>
              </div>

              {loadingProfile ? (
                <p>Carregando seus dados...</p>
              ) : (
                <>
                  <label className="settings-field">
                    Nome completo
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={120}
                      autoComplete="name"
                      placeholder="Seu nome"
                    />
                  </label>

                  <label className="settings-field">
                    E-mail
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={150}
                      autoComplete="email"
                      placeholder="seu@email.com"
                    />
                  </label>

                  <div className="security-info">
                    <ShieldCheck size={20} />
                    <div>
                      <b>Perfil de acesso</b>
                      <p>
                        {profile?.role || 'Não informado'}
                        {' — '}
                        {profile?.active ? 'Conta ativa' : 'Conta inativa'}
                      </p>
                      <small>
                        O perfil de acesso não pode ser alterado nesta tela.
                      </small>
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button
                      className="primary"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      <Save size={16} />
                      {savingProfile ? 'Salvando...' : 'Salvar perfil'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'Geral' && (
            <>
              <div className="settings-section-title">
                <Globe2 size={20} />
                <div>
                  <h2>Preferências do ambiente</h2>
                  <p>Informações gerais e preferências de exibição.</p>
                </div>
              </div>

              <label className="settings-field">
                Nome da organização
                <input
                  value={preferences.organizationName}
                  onChange={e => update('organizationName', e.target.value)}
                  maxLength={120}
                  placeholder="Nome da organização"
                />
                <small>
                  Esta preferência é local e não altera o cadastro da organização na API.
                </small>
              </label>

              <label className="settings-field">
                Fuso horário
                <select
                  value={preferences.timezone}
                  onChange={e => update('timezone', e.target.value)}
                >
                  <option value="America/Sao_Paulo">(GMT-03:00) Brasília / São Paulo</option>
                  <option value="America/Manaus">(GMT-04:00) Manaus</option>
                  <option value="America/Rio_Branco">(GMT-05:00) Rio Branco</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>

              <label className="settings-field">
                Idioma da interface
                <select
                  value={preferences.language}
                  onChange={e => update('language', e.target.value)}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
                <small>Outros idiomas poderão ser adicionados futuramente.</small>
              </label>

              <ToggleRow
                icon={<WifiOff size={18} />}
                title="Modo offline para técnicos"
                description="Preferência para permitir coleta sem conexão no aplicativo móvel."
                checked={preferences.offlineMode}
                onChange={v => update('offlineMode', v)}
              />
            </>
          )}

          {tab === 'Notificações' && (
            <>
              <div className="settings-section-title">
                <Bell size={20} />
                <div>
                  <h2>Notificações</h2>
                  <p>Escolha quais eventos devem gerar avisos no sistema.</p>
                </div>
              </div>

              <ToggleRow
                icon={<Mail size={18} />}
                title="Notificações por e-mail"
                description="Preferência para receber comunicações por e-mail."
                checked={preferences.emailNotifications}
                onChange={v => update('emailNotifications', v)}
              />

              <ToggleRow
                icon={<CheckCircle2 size={18} />}
                title="Inspeções aguardando revisão"
                description="Avisos quando uma inspeção for enviada para revisão."
                checked={preferences.reviewNotifications}
                onChange={v => update('reviewNotifications', v)}
              />

              <ToggleRow
                icon={<Users size={18} />}
                title="Novas atribuições"
                description="Avisos relacionados a inspeções atribuídas à equipe."
                checked={preferences.assignmentNotifications}
                onChange={v => update('assignmentNotifications', v)}
              />

              <ToggleRow
                icon={<ShieldCheck size={18} />}
                title="Não conformidades"
                description="Avisos sobre não conformidades registradas ou pendentes."
                checked={preferences.nonconformityNotifications}
                onChange={v => update('nonconformityNotifications', v)}
              />

              <p className="settings-help">
                As opções são salvas localmente. O envio real de notificações
                ainda depende de integração com o backend.
              </p>
            </>
          )}

          {tab === 'Equipe e permissões' && (
            <>
              <div className="settings-section-title">
                <Users size={20} />
                <div>
                  <h2>Equipe e permissões</h2>
                  <p>Perfis de acesso definidos para o FieldOps.</p>
                </div>
              </div>

              <div className="permission-card">
                <span className="permission-badge admin">ADMIN</span>
                <div>
                  <b>Administrador</b>
                  <p>
                    Gerencia cadastros, usuários e configurações, respeitando
                    as regras de negócio.
                  </p>
                </div>
              </div>

              <div className="permission-card">
                <span className="permission-badge supervisor">SUPERVISOR</span>
                <div>
                  <b>Supervisor</b>
                  <p>
                    Gerencia inspeções, modelos, calendário, não conformidades,
                    relatórios e auditoria dentro do seu escopo.
                  </p>
                </div>
              </div>

              <div className="permission-card">
                <span className="permission-badge technician">TECHNICIAN</span>
                <div>
                  <b>Técnico</b>
                  <p>
                    Executa inspeções atribuídas pelo aplicativo móvel e não
                    acessa o painel web.
                  </p>
                </div>
              </div>

              <p className="settings-help">
                Esta seção é informativa. A gestão de permissões continua na
                tela de Usuários, com validação no backend.
              </p>
            </>
          )}

          {tab === 'Segurança' && (
            <>
              <div className="settings-section-title">
                <ShieldCheck size={20} />
                <div>
                  <h2>Segurança</h2>
                  <p>Altere sua senha e revise as preferências da sessão.</p>
                </div>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  void changePassword()
                }}
              >
                <label className="settings-field">
                  Senha atual
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                <label className="settings-field">
                  Nova senha
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                  <small>Utilize pelo menos 8 caracteres.</small>
                </label>

                <label className="settings-field">
                  Confirmar nova senha
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </label>

                <div className="settings-actions">
                  <button
                    className="primary"
                    type="submit"
                    disabled={savingPassword}
                  >
                    <LockKeyhole size={16} />
                    {savingPassword ? 'Alterando...' : 'Alterar senha'}
                  </button>
                </div>
              </form>

              <div className="security-info">
                <SunMoon size={20} />
                <div>
                  <b>Preferências da sessão</b>
                  <p>
                    O controle efetivo de acesso é responsabilidade da API.
                    Alterar a preferência abaixo não modifica a expiração do token.
                  </p>
                </div>
              </div>

              <label className="settings-field">
                Tempo de inatividade desejado
                <select
                  value={preferences.sessionTimeout}
                  onChange={e => update('sessionTimeout', e.target.value)}
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </label>

              <button className="secondary" onClick={savePreferences}>
                <Save size={16} /> Salvar preferência de sessão
              </button>
            </>
          )}

          {tab !== 'Meu perfil' && tab !== 'Segurança' && (
            <div className="settings-actions">
              <button className="secondary" onClick={resetPreferences}>
                <RotateCcw size={16} /> Restaurar padrão
              </button>
              <button className="primary" onClick={savePreferences}>
                <Save size={16} /> Salvar preferências
              </button>
            </div>
          )}

          {error && (
            <div className="settings-message error" role="alert">
              {error}
            </div>
          )}

          {message && !error && (
            <div className="settings-saved" role="status">
              <CheckCircle2 size={17} /> {message}
            </div>
          )}

          {saved && !message && (
            <div className="settings-saved" role="status">
              <CheckCircle2 size={17} /> Preferências salvas.
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-icon">{icon}</div>
      <div className="settings-toggle-copy">
        <b>{title}</b>
        <span>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`settings-switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <i />
      </button>
    </div>
  )
}
