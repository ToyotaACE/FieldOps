
import './SettingsPage.css'
import { useEffect, useState, type FormEvent } from 'react'
import { LockKeyhole, Save, ShieldCheck, UserRound, Phone, FileText } from 'lucide-react'

type UserProfile = {
  id: number
  name: string
  email: string
  document: string | null
  phone: string | null
  role: string
  active: boolean
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getToken() {
  return localStorage.getItem('fieldops_token')
    || sessionStorage.getItem('fieldops_token')
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.'

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

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest('/api/v1/auth/me') as UserProfile

        setProfile(data)
        setName(data.name || '')
        setDocument(data.document ? formatDocument(data.document) : '')
        setPhone(data.phone ? formatPhone(data.phone) : '')
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar seu perfil.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!name.trim()) {
      setError('Informe seu nome completo.')
      return
    }

    setSavingProfile(true)

    try {
      const updated = await apiRequest('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          document: document.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
        }),
      }) as UserProfile

      setProfile(updated)
      setName(updated.name || '')
      setDocument(updated.document ? formatDocument(updated.document) : '')
      setPhone(updated.phone ? formatPhone(updated.phone) : '')
      setMessage('Dados pessoais salvos com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar seus dados.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

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
      setPasswordOpen(false)
      setMessage('Senha alterada com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível alterar a senha.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <div className="page-heading settings-page-heading">
        <div>
          <span className="eyebrow">CONTA</span>
          <h1>Configurações</h1>
          <p className="muted">
            Gerencie seus dados pessoais e sua senha.
          </p>
        </div>
      </div>

      <section className="panel settings-simple-card">
        <div className="settings-section-title">
          <UserRound size={21} />
          <div>
            <h2>Meu perfil</h2>
            <p>Seus dados de acesso e contato.</p>
          </div>
        </div>

        {loading ? (
          <p className="settings-status">Carregando seus dados...</p>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="settings-simple-grid">
              <label className="settings-field">
                Nome completo
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  required
                />
              </label>

              <label className="settings-field">
                E-mail
                <span className="settings-readonly-label">
                  Não editável
                </span>
                <input
                  value={profile?.email || ''}
                  readOnly
                  aria-readonly="true"
                />
              </label>

              <label className="settings-field">
                Documento (CPF)
                <span className="settings-input-icon">
                  <FileText size={16} />
                  <input
                    value={document}
                    onChange={event =>
                      setDocument(formatDocument(event.target.value))
                    }
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </span>
              </label>

              <label className="settings-field">
                Número de telefone
                <span className="settings-input-icon">
                  <Phone size={16} />
                  <input
                    value={phone}
                    onChange={event =>
                      setPhone(formatPhone(event.target.value))
                    }
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </span>
              </label>
            </div>

            <div className="settings-access-card">
              <ShieldCheck size={21} />
              <div>
                <b>Usuário e permissões</b>
                <p>
                  Perfil:{' '}
                  <strong>{profile?.role || 'Não informado'}</strong>
                </p>
                <p>
                  Status da conta:{' '}
                  <strong>
                    {profile?.active ? 'Ativa' : 'Inativa'}
                  </strong>
                </p>
                <small>
                  O perfil de permissões e o status são definidos pelo
                  sistema e não podem ser alterados aqui.
                </small>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="primary"
                type="submit"
                disabled={savingProfile}
              >
                <Save size={16} />
                {savingProfile ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel settings-simple-card settings-password-card">
        <div className="settings-section-title">
          <LockKeyhole size={21} />
          <div>
            <h2>Senha</h2>
            <p>Atualize sua senha para manter sua conta segura.</p>
          </div>
        </div>

        {!passwordOpen ? (
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setPasswordOpen(true)
              setMessage('')
              setError('')
            }}
          >
            <LockKeyhole size={16} />
            Alterar senha
          </button>
        ) : (
          <form
            className="settings-password-form"
            onSubmit={changePassword}
          >
            <label className="settings-field">
              Senha atual
              <input
                type="password"
                value={currentPassword}
                onChange={event =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />
            </label>

            <label className="settings-field">
              Nova senha
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
              <small>Use pelo menos 8 caracteres.</small>
            </label>

            <label className="settings-field">
              Confirmar nova senha
              <input
                type="password"
                value={confirmPassword}
                onChange={event =>
                  setConfirmPassword(event.target.value)
                }
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
                <Save size={16} />
                {savingPassword ? 'Alterando...' : 'Salvar nova senha'}
              </button>

              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setPasswordOpen(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {(message || error) && (
        <div
          className={
            error
              ? 'settings-feedback error'
              : 'settings-feedback success'
          }
          role="status"
        >
          {error || message}
        </div>
      )}
    </>
  )
}
