import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  HardHat,
  LockKeyhole,
  Mail,
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

export function AuthScreen({
  onAuthenticated,
}: AuthScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedEmail = email.trim()

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
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

      const data = (await response
        .json()
        .catch(() => ({}))) as LoginResponse

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'E-mail ou senha inválidos, ou acesso não autorizado.',
          )
        }

        throw new Error(
          data.message ||
            `Não foi possível entrar. Erro HTTP ${response.status}.`,
        )
      }

      const token = data.accessToken || data.token

      if (!token) {
        throw new Error(
          'A API respondeu, mas não retornou um token de acesso. Verifique o contrato do endpoint de login.',
        )
      }

      const storage = rememberMe ? localStorage : sessionStorage

      localStorage.removeItem('fieldops_token')
      localStorage.removeItem('fieldops_token_type')

      sessionStorage.removeItem('fieldops_token')
      sessionStorage.removeItem('fieldops_token_type')

      storage.setItem('fieldops_token', token)
      storage.setItem(
        'fieldops_token_type',
        data.tokenType || 'Bearer',
      )

      onAuthenticated()
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          'Não foi possível conectar ao servidor. Verifique se o backend está em execução e se o CORS está configurado.',
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro inesperado ao entrar.',
        )
      }
    } finally {
      setLoading(false)
    }
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
            Conecte sua equipe, acompanhe riscos e transforme dados de
            campo em decisões seguras.
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

            <h2>Acesse sua operação</h2>

            <p>
              Entre para acompanhar suas inspeções em tempo real.
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
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
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Ocultar senha' : 'Mostrar senha'
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <div className="auth-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={loading}
                />

                <span>Manter conectado</span>
              </label>

              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setError(
                    'Entre em contato com o administrador para recuperar seu acesso.',
                  )
                }
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Conectando...' : 'Entrar no FieldOps'}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-legal">
            Ao continuar, você concorda com os termos de uso e a política
            de privacidade.
          </p>
        </div>
      </main>
    </div>
  )
}
