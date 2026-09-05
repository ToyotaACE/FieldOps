import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, HardHat, LockKeyhole, Mail, UserRound } from 'lucide-react'

type AuthScreenProps = { onAuthenticated: () => void }

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'signup' && name.trim().length < 2) { setError('Informe seu nome completo.'); return }
    if (!email.includes('@')) { setError('Informe um e-mail válido.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    onAuthenticated()
  }

  function changeMode(next: 'login' | 'signup') {
    setMode(next)
    setError('')
  }

  return <div className="auth-page">
    <div className="auth-aside">
      <div className="auth-brand"><div className="brand-mark"><HardHat size={22}/></div><strong>Field<span>Ops</span></strong></div>
      <div className="auth-aside-copy"><div className="eyebrow">OPERAÇÕES EM CAMPO</div><h1>Clareza para cada inspeção.</h1><p>Conecte sua equipe, acompanhe riscos e transforme dados de campo em decisões seguras.</p></div>
      <div className="auth-aside-footer"><span className="auth-status-dot"/> Ambiente operacional protegido</div>
    </div>
    <main className="auth-main">
      <div className="auth-card">
        <div className="auth-mobile-brand"><div className="brand-mark"><HardHat size={20}/></div><strong>Field<span>Ops</span></strong></div>
        <div className="auth-heading"><div className="eyebrow">BEM-VINDO AO FIELDOPS</div><h2>{mode === 'login' ? 'Acesse sua operação' : 'Crie seu acesso'}</h2><p>{mode === 'login' ? 'Entre para acompanhar suas inspeções em tempo real.' : 'Comece a organizar suas inspeções em um só lugar.'}</p></div>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Entrar</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Criar conta</button></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <label>Nome completo<div className="field"><UserRound size={17}/><input value={name} onChange={e => setName(e.target.value)} placeholder="Como devemos chamar você?" autoComplete="name" /></div></label>}
          <label>E-mail corporativo<div className="field"><Mail size={17}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" /></div></label>
          <label>Senha<div className="field"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          {mode === 'login' && <div className="auth-options"><label className="remember"><input type="checkbox"/> <span>Manter conectado</span></label><button type="button" className="text-button" onClick={() => setError('Entre em contato com o administrador para recuperar seu acesso.')}>Esqueci minha senha</button></div>}
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-submit" type="submit">{mode === 'login' ? 'Entrar no FieldOps' : 'Criar minha conta'} <ArrowRight size={17}/></button>
        </form>
        <p className="auth-legal">Ao continuar, você concorda com os termos de uso e a política de privacidade.</p>
      </div>
    </main>
  </div>
}
