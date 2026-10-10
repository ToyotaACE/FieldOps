import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  HardHat,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

type AuthScreenProps = {
  onAuthenticated: () => void
}

type LoginResponse = {
  accessToken?: string
  token?: string
  tokenType?: string
  message?: string
}

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '')

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (mode === 'signup') {
      setError(
        'O cadastro pela aplicação web ainda não está conectado ao backend. Solicite a criação do usuário ao administrador.'
      )
      return
    }

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Informe um e-mail válido.')
      return
    }

    if (!password) {
      setError('Informe sua senha.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as LoginResponse

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('E-mail ou senha inválidos, ou acesso não autorizado.')
        }

        throw new Error(
          data.message || `Não foi possível entrar. Erro HTTP ${response.status}.`
        )
      }

      const token = data.accessToken || data.token

      if (!token) {
        throw new Error(
          'A API respondeu, mas não retornou um token de acesso. Verifique o contrato do endpoint de login.'
        )
      }

      const storage = rememberMe ? localStorage : sessionStorage

      // Remove tokens antigos para evitar manter sessões inconsistentes.
      localStorage.removeItem('fieldops_token')
      sessionStorage.removeItem('fieldops_token')

      storage.setItem('fieldops_token', token)

      if (data.tokenType) {
        storage.setItem('fieldops_token_type', data.tokenType)
      }

      onAuthenticated()
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          'Não foi possível conectar ao servidor. Verifique se o backend está em execução e se o CORS está configurado.'
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro inesperado ao entrar.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  function changeMode(next: 'login' | 'signup') {
    setMode(next)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <div className="auth-brand">
          <div className="brand-mark">
            <HardHat size={22} />
          </div>
          <strong>
            Field<span>Ops</span>
          </strong>
        </div>

        <div className="auth-aside-copy">
          <div className="eyebrow">OPERAÇÕES EM CAMPO</div>
          <h1>Clareza para cada inspeção.</h1>
          <p>
            Conecte sua equipe, acompanhe riscos e transforme dados de campo
            em decisões seguras.
          </p>
        </div>

        <div className="auth-aside-footer">
          <span className="auth-status-dot" />
          Ambiente operacional protegido
        </div>
      </div>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <div className="brand-mark">
              <HardHat size={20} />
            </div>
            <strong>
              Field<span>Ops</span>
            </strong>
          </div>

          <div className="auth-heading">
            <div className="eyebrow">BEM-VINDO AO FIELDOPS</div>
            <h2>{mode === 'login' ? 'Acesse sua operação' : 'Crie seu acesso'}</h2>
            <p>
              {mode === 'login'
                ? 'Entre para acompanhar suas inspeções em tempo real.'
                : 'Comece a organizar suas inspeções em um só lugar.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
              disabled={loading}
            >
              Entrar
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => changeMode('signup')}
              disabled={loading}
            >
              Criar conta
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Nome completo
                <div className="field">
                  <UserRound size={17} />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como devemos chamar você?"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </label>
            )}

            <label>
              E-mail corporativo
              <div className="field">
                <Mail size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </label>

            <label>
              Senha
              <div className="field">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {mode === 'login' && (
              <div className="auth-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={loading}
                  />
                  <span>Manter conectado</span>
                </label>

                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setError(
                      'Entre em contato com o administrador para recuperar seu acesso.'
                    )
                  }
                  disabled={loading}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Conectando...'
                : mode === 'login'
                  ? 'Entrar no FieldOps'
                  : 'Criar minha conta'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-legal">
            Ao continuar, você concorda com os termos de uso e a política de
            privacidade.
          </p>
        </div>
      </main>
    </div>
  )
}
