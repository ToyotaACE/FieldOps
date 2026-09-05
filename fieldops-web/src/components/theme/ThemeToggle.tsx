import { Moon, Sun } from 'lucide-react'

type ThemeToggleProps = { dark: boolean; onToggle: () => void }

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return <button className="icon-btn" onClick={onToggle} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} title={dark ? 'Tema claro' : 'Tema escuro'}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
}
