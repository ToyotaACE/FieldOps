import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Bell, CalendarDays, CheckCircle2,
  ChevronDown, ClipboardCheck, ClipboardList, Clock3, Download, FileText,
  Gauge, HardHat, LayoutDashboard, LogOut, Menu, Moon, PackageCheck,
  Plus, QrCode, Search, Settings, ShieldCheck, Sun, Users, Wrench, X
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'

type Status = 'Agendada' | 'Em andamento' | 'Aguardando revisão' | 'Aprovada' | 'Reprovada'
type Inspection = {
  id: string; client: string; location: string; equipment: string; technician: string;
  date: string; status: Status; priority: 'Baixa'|'Normal'|'Alta'|'Crítica'; progress: number
}

const trend = [
  { day:'Seg', total:18 }, { day:'Ter', total:26 }, { day:'Qua', total:21 },
  { day:'Qui', total:34 }, { day:'Sex', total:29 }, { day:'Sáb', total:12 }, { day:'Dom', total:8 }
]
const statuses = [
  { name:'Agendadas', value:18 }, { name:'Em andamento', value:11 },
  { name:'Revisão', value:7 }, { name:'Aprovadas', value:42 }, { name:'Reprovadas', value:5 }
]
const seed: Inspection[] = [
  {id:'INS-000124',client:'Toyota Industrial',location:'Planta Sorocaba',equipment:'Painel Elétrico PE-021',technician:'João Silva',date:'11/08/2026',status:'Aguardando revisão',priority:'Alta',progress:100},
  {id:'INS-000123',client:'Metalúrgica Alpha',location:'Unidade Industrial 01',equipment:'Compressor CP-001',technician:'Marcos Lima',date:'11/08/2026',status:'Em andamento',priority:'Crítica',progress:72},
  {id:'INS-000122',client:'Indústria NovaTech',location:'Planta Campinas',equipment:'Motor MTR-103',technician:'Ana Costa',date:'10/08/2026',status:'Aprovada',priority:'Normal',progress:100},
  {id:'INS-000121',client:'Toyota Industrial',location:'Planta Sorocaba',equipment:'Bomba hidráulica BH-022',technician:'João Silva',date:'10/08/2026',status:'Reprovada',priority:'Alta',progress:100},
  {id:'INS-000120',client:'Metalúrgica Alpha',location:'Unidade Industrial 01',equipment:'Compressor CP-001',technician:'Marcos Lima',date:'09/08/2026',status:'Agendada',priority:'Baixa',progress:0}
]

const menu = [
  ['Dashboard', LayoutDashboard], ['Inspeções', ClipboardCheck], ['Calendário', CalendarDays],
  ['Modelos de inspeção', ClipboardList], ['Clientes', Users], ['Locais', PackageCheck],
  ['Equipamentos', Wrench], ['Não conformidades', AlertTriangle], ['Relatórios', BarChart3],
  ['Auditoria', ShieldCheck], ['Configurações', Settings]
] as const

function App() {
  const [page, setPage] = useState('Dashboard')
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [inspections, setInspections] = useState(seed)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)

  const filtered = useMemo(() => inspections.filter(i =>
    Object.values(i).join(' ').toLowerCase().includes(query.toLowerCase())
  ), [inspections, query])

  function openInspection(i: Inspection) { setSelected(i); setPage('Inspeções') }
  function approve() {
    if (!selected) return
    const next = {...selected, status:'Aprovada' as Status}
    setInspections(prev => prev.map(i => i.id === selected.id ? next : i))
    setSelected(next)
  }
  function reject() {
    if (!selected) return
    const next = {...selected, status:'Reprovada' as Status}
    setInspections(prev => prev.map(i => i.id === selected.id ? next : i))
    setSelected(next)
  }

  return <div className={dark ? 'app dark' : 'app'}>
    <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
      <div className="brand"><div className="brand-mark"><HardHat size={22}/></div>{!collapsed && <div><strong>Field<span>Ops</span></strong><small>Inspeção em campo</small></div>}</div>
      <button className="collapse" onClick={() => setCollapsed(!collapsed)}><Menu size={19}/></button>
      <nav>{menu.map(([label, Icon]) => <button key={label} className={page===label?'nav active':'nav'} onClick={()=>{setPage(label);setSelected(null)}} title={label}><Icon size={19}/>{!collapsed && <span>{label}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">CS</div>{!collapsed && <div><b>Carlos Souza</b><small>Supervisor</small></div>}</div>{!collapsed && <button className="logout"><LogOut size={16}/> Sair</button>}</div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="crumb"><span>Operações</span><b>/</b><strong>{page}</strong></div>
        <div className="top-actions">
          <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar no FieldOps..." /></div>
          <div className="sync"><span className="dot"></span> Sincronizado</div>
          <button className="icon-btn" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
          <button className="icon-btn"><Bell size={18}/><i></i></button>
          <div className="avatar">CS</div>
        </div>
      </header>

      <section className="content">
        {page === 'Dashboard' && <Dashboard inspections={inspections} open={openInspection} />}
        {page === 'Inspeções' && <InspectionsPage inspections={filtered} open={openInspection} selected={selected} approve={approve} reject={reject} />}
        {page !== 'Dashboard' && page !== 'Inspeções' && <GenericPage page={page} onNew={()=>setModal(true)} />}
      </section>
    </main>

    {modal && <div className="overlay" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(false)}><X/></button><div className="modal-icon"><Plus/></div><h2>Nova {page === 'Clientes' ? 'cadastro de cliente' : page === 'Equipamentos' ? 'inspeção de equipamento' : 'configuração'}</h2><p>Este formulário está preparado para receber a integração com o banco PostgreSQL/Supabase.</p><input placeholder="Nome / identificação"/><input placeholder="Descrição"/><button className="primary" onClick={()=>setModal(false)}>Salvar cadastro</button></div></div>}
  </div>
}

function Dashboard({inspections, open}:{inspections:Inspection[],open:(i:Inspection)=>void}) {
  const cards = [
    ['Inspeções hoje','18','+12,5%','blue',ClipboardCheck], ['Em andamento','11','+8,2%','amber',Activity],
    ['Aguardando revisão','7','-3,1%','violet',Clock3], ['Aprovadas','42','+16,8%','green',CheckCircle2],
    ['Não conformidades','13','+4,3%','red',AlertTriangle]
  ] as const
  return <><div className="page-head"><div><div className="eyebrow">VISÃO OPERACIONAL</div><h1>Visão geral das operações</h1><p>Acompanhe a execução das inspeções em campo em tempo real.</p></div><button className="primary" onClick={()=>alert('Fluxo de nova inspeção pronto para integração')}><Plus size={18}/> Nova inspeção</button></div>
    <div className="stats">{cards.map(([label,value,trend,color,Icon])=><div className="stat" key={label}><div className="stat-top"><span>{label}</span><div className={'stat-icon '+color}><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-trend">{trend}</div></div>)}</div>
    <div className="grid-2"><div className="panel"><div className="panel-head"><div><h3>Inspeções por período</h3><span>Últimos 7 dias</span></div><button className="select">Esta semana <ChevronDown size={15}/></button></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".24"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div>
    <div className="panel"><div className="panel-head"><div><h3>Inspeções por status</h3><span>Distribuição atual</span></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={statuses} layout="vertical" margin={{left:10,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--grid)"/><XAxis type="number" axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={95} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" fill="#0f172a" radius={[0,5,5,0]} barSize={18}/></BarChart></ResponsiveContainer></div></div></div>
    <div className="panel"><div className="panel-head"><div><h3>Inspeções recentes</h3><span>Atividades mais recentes</span></div><button className="ghost">Ver todas <ChevronDown size={15}/></button></div><InspectionTable inspections={inspections.slice(0,5)} open={open}/></div>
  </>
}

function InspectionsPage({inspections,open,selected,approve,reject}:{inspections:Inspection[],open:(i:Inspection)=>void,selected:Inspection|null,approve:()=>void,reject:()=>void}) {
  if (selected) return <div><button className="back" onClick={()=>open(selected)}>← Voltar para inspeções</button><div className="page-head"><div><div className="eyebrow">{selected.id}</div><h1>{selected.equipment}</h1><p>{selected.client} · {selected.location}</p></div><StatusBadge status={selected.status}/></div><div className="detail-grid"><div className="panel detail-main"><div className="detail-banner"><div className="qr"><QrCode size={42}/></div><div><b>Inspeção técnica</b><span>Modelo: Segurança Operacional · v2.1</span></div><div className="progress-box"><span>Progresso</span><strong>{selected.progress}%</strong><div className="progress"><i style={{width:selected.progress+'%'}}/></div></div></div><h3>Checklist da inspeção</h3>{['Identificação do equipamento','Condições de segurança','Componentes e conexões','Evidências fotográficas'].map((x,n)=><div className="check-row" key={x}><div className="check-ok"><CheckCircle2 size={18}/></div><div><b>{n+1}. {x}</b><span>Verificação realizada conforme procedimento.</span></div><span className="answer">Conforme</span></div>)}<div className="evidence"><h3>Evidências</h3><div className="photo-placeholder"><Download size={25}/><span>Galeria de evidências</span><small>As fotos enviadas pelo técnico aparecerão aqui.</small></div></div></div><div className="detail-side"><div className="panel"><h3>Dados da inspeção</h3><Info label="Técnico" value={selected.technician}/><Info label="Data" value={selected.date}/><Info label="Prioridade" value={selected.priority}/><Info label="Equipamento" value={selected.equipment}/><Info label="Local" value={selected.location}/></div><div className="panel"><h3>Revisão</h3><p className="muted">Revise as respostas e evidências antes de tomar uma decisão.</p><button className="primary full" onClick={approve}><CheckCircle2 size={17}/> Aprovar inspeção</button><button className="danger full" onClick={reject}><X size={17}/> Reprovar inspeção</button></div></div></div></div>
  return <><div className="page-head"><div><div className="eyebrow">OPERAÇÕES</div><h1>Inspeções</h1><p>Planeje, acompanhe e revise inspeções técnicas.</p></div><button className="primary"><Plus size={18}/> Nova inspeção</button></div><div className="toolbar"><div className="search wide"><Search size={17}/><input placeholder="Filtrar inspeções..." /></div><button className="filter">Status <ChevronDown size={15}/></button><button className="filter">Prioridade <ChevronDown size={15}/></button><button className="filter">Técnico <ChevronDown size={15}/></button></div><div className="panel"><InspectionTable inspections={inspections} open={open}/></div></>
}

function InspectionTable({inspections,open}:{inspections:Inspection[],open:(i:Inspection)=>void}) {
 return <div className="table-wrap"><table><thead><tr><th>ID</th><th>Cliente / Equipamento</th><th>Técnico</th><th>Data</th><th>Prioridade</th><th>Status</th><th>Progresso</th></tr></thead><tbody>{inspections.map(i=><tr key={i.id} onClick={()=>open(i)}><td><b className="id">{i.id}</b></td><td><b>{i.client}</b><span>{i.equipment}</span></td><td>{i.technician}</td><td>{i.date}</td><td><Priority p={i.priority}/></td><td><StatusBadge status={i.status}/></td><td><div className="mini-progress"><i style={{width:i.progress+'%'}}/></div><small>{i.progress}%</small></td></tr>)}</tbody></table></div>
}
function StatusBadge({status}:{status:Status}) { const c=status==='Aprovada'?'approved':status==='Reprovada'?'rejected':status==='Em andamento'?'running':status==='Aguardando revisão'?'review':'scheduled'; return <span className={'badge '+c}>{status}</span> }
function Priority({p}:{p:Inspection['priority']}) { return <span className={'priority '+p.toLowerCase()}><i/> {p}</span> }
function Info({label,value}:{label:string,value:string}) { return <div className="info"><span>{label}</span><b>{value}</b></div> }

function GenericPage({page,onNew}:{page:string,onNew:()=>void}) {
 const descriptions:Record<string,string>={Calendário:'Planeje a agenda das equipes e visualize inspeções por período.', 'Modelos de inspeção':'Crie checklists dinâmicos e gerencie versões publicadas.',Clientes:'Gerencie organizações atendidas pelo FieldOps.',Locais:'Unidades, plantas, prédios e áreas de cada cliente.',Equipamentos:'Controle ativos, QR Codes e histórico de inspeções.','Não conformidades':'Acompanhe ocorrências, severidade, responsáveis e prazos.',Relatórios:'Indicadores operacionais e análises de desempenho.',Auditoria:'Histórico imutável das principais ações realizadas no sistema.',Usuários:'Gerencie perfis e permissões de acesso.',Configurações:'Preferências e configurações do ambiente.'}
 return <><div className="page-head"><div><div className="eyebrow">FIELDOPS</div><h1>{page}</h1><p>{descriptions[page] || 'Gerencie as operações do FieldOps.'}</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo registro</button></div><div className="panel empty-panel"><div className="empty-icon"><Gauge size={28}/></div><h2>Módulo preparado</h2><p>A estrutura desta área está criada e pronta para receber persistência no Supabase, CRUDs e regras de negócio.</p><button className="primary" onClick={onNew}><Plus size={17}/> Criar primeiro registro</button></div></>
}
export default App
