import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Bell, CalendarDays, CheckCircle2,
  ChevronDown, ClipboardCheck, ClipboardList, Clock3, Download, FileBarChart,
  Gauge, HardHat, LayoutDashboard, LogOut, Menu, Moon, PackageCheck, FileText,
  Plus, QrCode, Search, Settings, ShieldCheck, Sun, Users, Wrench, X,
  Building2, CalendarCheck, Filter, MapPin, MoreHorizontal, Pencil, Save,
  SlidersHorizontal, Trash2, Mail, LockKeyhole, UserRound, ArrowRight, Eye, EyeOff
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import type { Inspection, InspectionDraft, Resource, Status } from './types'
import { seed, statuses, trend } from './data/mockData'
import { downloadCsv } from './utils/downloadCsv'
import { AuthScreen as AuthPage } from './pages/auth/AuthScreen'

const menu = [
  ['Dashboard', LayoutDashboard], ['Inspeções', ClipboardCheck], ['Calendário', CalendarDays],
  ['Modelos de inspeção', ClipboardList], ['Clientes', Users], ['Locais', PackageCheck],
  ['Equipamentos', Wrench], ['Não conformidades', AlertTriangle], ['Relatórios', BarChart3],
  ['Auditoria', ShieldCheck], ['Configurações', Settings]
] as const

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [page, setPage] = useState('Dashboard')
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [inspections, setInspections] = useState(seed)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [newInspectionOpen, setNewInspectionOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(3)

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
  function createInspection(draft:InspectionDraft) {
    const scheduledDate = new Date(draft.date).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})
    const next:Inspection = {...draft, date:scheduledDate, id:`INS-${String(inspections.length + 125).padStart(6, '0')}`, status:'Agendada', progress:0}
    setInspections(prev => [next, ...prev])
    setNewInspectionOpen(false)
    setSelected(null)
    setPage('Inspeções')
  }

  if (!authenticated) return <AuthPage onAuthenticated={() => setAuthenticated(true)} />

  return <div className={dark ? 'app dark' : 'app'}>
    <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
      <div className="brand"><div className="brand-mark"><HardHat size={22}/></div>{!collapsed && <div><strong>Field<span>Ops</span></strong><small>Inspeção em campo</small></div>}</div>
      <button className="collapse" onClick={() => setCollapsed(!collapsed)}><Menu size={19}/></button>
      <nav>{menu.map(([label, Icon]) => <button key={label} className={page===label?'nav active':'nav'} onClick={()=>{setPage(label);setSelected(null)}} title={label}><Icon size={19}/>{!collapsed && <span>{label}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">CS</div>{!collapsed && <div><b>Carlos Souza</b><small>Supervisor</small></div>}</div>{!collapsed && <button className="logout" onClick={()=>setAuthenticated(false)}><LogOut size={16}/> Sair</button>}</div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="crumb"><span>Operações</span><b>/</b><strong>{page}</strong></div>
        <div className="top-actions">
          <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar no FieldOps..." /></div>
          <div className="sync"><span className="dot"></span> Sincronizado</div>
          <button className="icon-btn" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
          <div className="notification-wrap"><button className="icon-btn notification-button" onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Abrir notificações"><Bell size={18}/>{unreadNotifications > 0 && <i></i>}</button>{notificationsOpen && <div className="notification-panel"><div className="notification-head"><div><strong>Notificações</strong><span>{unreadNotifications} não lidas</span></div><button onClick={()=>setUnreadNotifications(0)}>Marcar como lidas</button></div><div className="notification-item unread"><div className="notification-dot amber"><AlertTriangle size={15}/></div><div><b>Inspeção aguardando revisão</b><span>INS-000124 precisa da sua análise.</span><small>Há 12 minutos</small></div></div><div className="notification-item unread"><div className="notification-dot blue"><ClipboardCheck size={15}/></div><div><b>Nova evidência recebida</b><span>Ana Costa enviou fotos da inspeção.</span><small>Há 38 minutos</small></div></div><div className="notification-item"><div className="notification-dot green"><CheckCircle2 size={15}/></div><div><b>Inspeção aprovada</b><span>INS-000122 foi aprovada por Carlos Souza.</span><small>Hoje, 09:42</small></div></div><button className="notification-footer" onClick={()=>setNotificationsOpen(false)}>Ver todas as atividades <ArrowRight size={14}/></button></div>}</div>
          <div className="avatar">CS</div>
        </div>
      </header>

      <section className="content">
        {page === 'Dashboard' && <Dashboard inspections={filtered} open={openInspection} onNew={()=>setNewInspectionOpen(true)} onViewAll={()=>{setPage('Inspeções');setSelected(null)}} />}
        {page === 'Inspeções' && <InspectionsPage inspections={filtered} open={openInspection} selected={selected} approve={approve} reject={reject} onNew={()=>setNewInspectionOpen(true)} />}
        {page !== 'Dashboard' && page !== 'Inspeções' && <ModulePage page={page} />}
      </section>
    </main>
    {newInspectionOpen && <InspectionModal onClose={()=>setNewInspectionOpen(false)} onSave={createInspection} />}
  </div>
}

function Dashboard({inspections, open, onNew, onViewAll}:{inspections:Inspection[],open:(i:Inspection)=>void,onNew:()=>void,onViewAll:()=>void}) {
  const pendingInspections = inspections.filter(inspection => inspection.status !== 'Aprovada' && inspection.status !== 'Reprovada').length
  const [period,setPeriod] = useState<'week'|'month'>('week')
  const chartData = period === 'week' ? trend : [{day:'Sem 1',total:86},{day:'Sem 2',total:104},{day:'Sem 3',total:92},{day:'Sem 4',total:118}]
  const cards = [
    ['Inspeções hoje','18','+12,5%','blue',ClipboardCheck], ['Em andamento','11','+8,2%','amber',Activity],
    ['Aguardando revisão','7','-3,1%','violet',Clock3], ['Inspeções pendentes',String(pendingInspections),'Em aberto','orange',ClipboardList], ['Aprovadas','42','+16,8%','green',CheckCircle2],
    ['Não conformidades','13','+4,3%','red',AlertTriangle]
  ] as const
  return <><div className="page-head"><div><div className="eyebrow">VISÃO OPERACIONAL</div><h1>Visão geral das operações</h1><p>Acompanhe a execução das inspeções em campo em tempo real.</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Nova inspeção</button></div>
    <div className="stats">{cards.map(([label,value,trend,color,Icon])=><div className="stat" key={label}><div className="stat-top"><span>{label}</span><div className={'stat-icon '+color}><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-trend">{trend}</div></div>)}</div>
    <div className="grid-2"><div className="panel"><div className="panel-head"><div><h3>Inspeções por período</h3><span>{period === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias'}</span></div><button className="select" onClick={()=>setPeriod(period === 'week' ? 'month' : 'week')}>{period === 'week' ? 'Esta semana' : 'Este mês'} <ChevronDown size={15}/></button></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".24"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div>
    <div className="panel"><div className="panel-head"><div><h3>Inspeções por status</h3><span>Distribuição atual</span></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={statuses} layout="vertical" margin={{left:10,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--grid)"/><XAxis type="number" axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={95} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" fill="#0f172a" radius={[0,5,5,0]} barSize={18}/></BarChart></ResponsiveContainer></div></div></div>
    <div className="panel"><div className="panel-head"><div><h3>Inspeções recentes</h3><span>Atividades mais recentes</span></div><button className="ghost" onClick={onViewAll}>Ver todas <ArrowRight size={15}/></button></div><InspectionTable inspections={inspections.slice(0,5)} open={open}/></div>
  </>
}

function InspectionsPage({inspections,open,selected,approve,reject,onNew}:{inspections:Inspection[],open:(i:Inspection)=>void,selected:Inspection|null,approve:()=>void,reject:()=>void,onNew:()=>void}) {
  const [statusFilter,setStatusFilter] = useState('Todos')
  const [priorityFilter,setPriorityFilter] = useState('Todas')
  const [technicianFilter,setTechnicianFilter] = useState('Todos')
  const [localQuery,setLocalQuery] = useState('')
  const visible = inspections.filter(item => `${item.id} ${item.client} ${item.location} ${item.equipment} ${item.technician}`.toLowerCase().includes(localQuery.toLowerCase()) && (statusFilter === 'Todos' || item.status === statusFilter) && (priorityFilter === 'Todas' || item.priority === priorityFilter) && (technicianFilter === 'Todos' || item.technician === technicianFilter))
  if (selected) return <div><button className="back" onClick={()=>open(selected)}>← Voltar para inspeções</button><div className="page-head"><div><div className="eyebrow">{selected.id}</div><h1>{selected.equipment}</h1><p>{selected.client} · {selected.location}</p></div><StatusBadge status={selected.status}/></div><div className="detail-grid"><div className="panel detail-main"><div className="detail-banner"><div className="qr"><QrCode size={42}/></div><div><b>Inspeção técnica</b><span>Modelo: Segurança Operacional · v2.1</span></div><div className="progress-box"><span>Progresso</span><strong>{selected.progress}%</strong><div className="progress"><i style={{width:selected.progress+'%'}}/></div></div></div><h3>Checklist da inspeção</h3>{['Identificação do equipamento','Condições de segurança','Componentes e conexões','Evidências fotográficas'].map((x,n)=><div className="check-row" key={x}><div className="check-ok"><CheckCircle2 size={18}/></div><div><b>{n+1}. {x}</b><span>Verificação realizada conforme procedimento.</span></div><span className="answer">Conforme</span></div>)}<div className="evidence"><h3>Evidências</h3><div className="photo-placeholder"><Download size={25}/><span>Galeria de evidências</span><small>As fotos enviadas pelo técnico aparecerão aqui.</small></div></div></div><div className="detail-side"><div className="panel"><h3>Dados da inspeção</h3><Info label="Técnico" value={selected.technician}/><Info label="Data" value={selected.date}/><Info label="Prioridade" value={selected.priority}/><Info label="Equipamento" value={selected.equipment}/><Info label="Local" value={selected.location}/></div><div className="panel"><h3>Revisão</h3><p className="muted">Revise as respostas e evidências antes de tomar uma decisão.</p><button className="primary full" onClick={approve}><CheckCircle2 size={17}/> Aprovar inspeção</button><button className="danger full" onClick={reject}><X size={17}/> Reprovar inspeção</button></div></div></div></div>
  return <><div className="page-head"><div><div className="eyebrow">OPERAÇÕES</div><h1>Inspeções</h1><p>Planeje, acompanhe e revise inspeções técnicas.</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Nova inspeção</button></div><div className="toolbar"><div className="search wide"><Search size={17}/><input value={localQuery} onChange={e=>setLocalQuery(e.target.value)} placeholder="Filtrar inspeções..." /></div><select className="filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>Todos</option><option>Agendada</option><option>Em andamento</option><option>Aguardando revisão</option><option>Aprovada</option><option>Reprovada</option></select><select className="filter" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option>Todas</option><option>Baixa</option><option>Normal</option><option>Alta</option><option>Crítica</option></select><select className="filter" value={technicianFilter} onChange={e=>setTechnicianFilter(e.target.value)}><option>Todos</option><option>João Silva</option><option>Marcos Lima</option><option>Ana Costa</option></select></div><div className="panel"><InspectionTable inspections={visible} open={open}/></div></>
}

function InspectionTable({inspections,open}:{inspections:Inspection[],open:(i:Inspection)=>void}) {
 return <div className="table-wrap"><table><thead><tr><th>ID</th><th>Cliente / Equipamento</th><th>Técnico</th><th>Data</th><th>Prioridade</th><th>Status</th><th>Progresso</th></tr></thead><tbody>{inspections.map(i=><tr key={i.id} onClick={()=>open(i)}><td><b className="id">{i.id}</b></td><td><b>{i.client}</b><span>{i.equipment}</span></td><td>{i.technician}</td><td>{i.date}</td><td><Priority p={i.priority}/></td><td><StatusBadge status={i.status}/></td><td><div className="mini-progress"><i style={{width:i.progress+'%'}}/></div><small>{i.progress}%</small></td></tr>)}</tbody></table></div>
}
function StatusBadge({status}:{status:Status}) { const c=status==='Aprovada'?'approved':status==='Reprovada'?'rejected':status==='Em andamento'?'running':status==='Aguardando revisão'?'review':'scheduled'; return <span className={'badge '+c}>{status}</span> }
function Priority({p}:{p:Inspection['priority']}) { return <span className={'priority '+p.toLowerCase()}><i/> {p}</span> }
function Info({label,value}:{label:string,value:string}) { return <div className="info"><span>{label}</span><b>{value}</b></div> }

const resources:Record<string,Resource[]> = {
  'Modelos de inspeção':[
    {id:'MOD-0021',name:'Segurança Operacional',detail:'24 itens · v2.1',status:'Publicado',meta:'Atualizado hoje'},
    {id:'MOD-0018',name:'NR-12 Máquinas e Equipamentos',detail:'31 itens · v1.4',status:'Publicado',meta:'Atualizado em 02/08/2026'},
    {id:'MOD-0011',name:'Instalações Elétricas',detail:'18 itens · v3.0',status:'Rascunho',meta:'Criado em 28/07/2026'}
  ],
  Clientes:[
    {id:'CLI-001',name:'Toyota Industrial',detail:'Indústria automotiva',status:'Ativo',meta:'3 locais · 48 equipamentos'},
    {id:'CLI-002',name:'Metalúrgica Alpha',detail:'Metalurgia',status:'Ativo',meta:'1 local · 19 equipamentos'},
    {id:'CLI-003',name:'Indústria NovaTech',detail:'Manufatura',status:'Ativo',meta:'2 locais · 27 equipamentos'}
  ],
  Locais:[
    {id:'LOC-021',name:'Planta Sorocaba',detail:'Toyota Industrial · Sorocaba, SP',status:'Ativo',meta:'18 equipamentos'},
    {id:'LOC-014',name:'Unidade Industrial 01',detail:'Metalúrgica Alpha · Campinas, SP',status:'Ativo',meta:'19 equipamentos'},
    {id:'LOC-009',name:'Planta Campinas',detail:'Indústria NovaTech · Campinas, SP',status:'Ativo',meta:'27 equipamentos'}
  ],
  Equipamentos:[
    {id:'PE-021',name:'Painel Elétrico PE-021',detail:'Planta Sorocaba · Toyota Industrial',status:'Operacional',meta:'Última inspeção: 11/08/2026'},
    {id:'CP-001',name:'Compressor CP-001',detail:'Unidade Industrial 01 · Metalúrgica Alpha',status:'Atenção',meta:'Última inspeção: 11/08/2026'},
    {id:'MTR-103',name:'Motor MTR-103',detail:'Planta Campinas · Indústria NovaTech',status:'Operacional',meta:'Última inspeção: 10/08/2026'}
  ],
  'Não conformidades':[
    {id:'NC-0048',name:'Proteção do compressor ausente',detail:'CP-001 · Metalúrgica Alpha',status:'Aberta',meta:'Alta · vence em 3 dias'},
    {id:'NC-0047',name:'Cabo com isolamento danificado',detail:'PE-021 · Toyota Industrial',status:'Em tratamento',meta:'Crítica · Carlos Souza'},
    {id:'NC-0042',name:'Sinalização de segurança apagada',detail:'MTR-103 · Indústria NovaTech',status:'Resolvida',meta:'Baixa · resolvida em 08/08/2026'}
  ]
}

function ModulePage({page}:{page:string}) {
  if (page === 'Calendário') return <CalendarPage />
  if (page === 'Relatórios') return <ReportsPage />
  if (page === 'Auditoria') return <AuditPage />
  if (page === 'Configurações') return <SettingsPage />
  return <ResourcePage page={page} initial={resources[page] || []} />
}

function ResourcePage({page,initial}:{page:string,initial:Resource[]}) {
  const [items,setItems] = useState(initial.map(item=>({...item,kind:page})))
  const [query,setQuery] = useState('')
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<string | null>(null)
  const [draft,setDraft] = useState({name:'',detail:''})
  const [statusFilter,setStatusFilter] = useState('Todos')
  const filtered = items.filter(item => item.kind === page && (statusFilter === 'Todos' || item.status === statusFilter) && `${item.id} ${item.name} ${item.detail} ${item.status}`.toLowerCase().includes(query.toLowerCase()))
  const labels:Record<string,[string,string,string]> = { 'Modelos de inspeção':['modelos','checklists versionados','Novo modelo'], Clientes:['clientes','organizações atendidas','Novo cliente'], Locais:['locais','unidades e plantas','Novo local'], Equipamentos:['equipamentos','ativos monitorados','Novo equipamento'], 'Não conformidades':['não conformidades','ocorrências registradas','Nova ocorrência'] }
  const resourceIcons:Record<string,typeof Wrench> = {'Modelos de inspeção':ClipboardList,Clientes:Users,Locais:MapPin,Equipamentos:Wrench,'Não conformidades':AlertTriangle}
  const [noun,subtitle,action] = labels[page] || ['registros','dados operacionais','Novo registro']
  const ResourceIcon = resourceIcons[page] || Building2
  function save() { if (!draft.name.trim()) return; if (editing) setItems(items.map(item=>item.id===editing ? {...item,name:draft.name,detail:draft.detail || 'Sem descrição'} : item)); else setItems([{id:`${page.slice(0,3).toUpperCase()}-${String(items.length+1).padStart(3,'0')}`,name:draft.name,detail:draft.detail || 'Sem descrição',status:'Ativo',meta:'Criado agora',kind:page},...items]); setDraft({name:'',detail:''}); setEditing(null); setModal(false) }
  function edit(item:Resource) { setEditing(item.id); setDraft({name:item.name,detail:item.detail}); setModal(true) }
  return <><PageHeading eyebrow="GESTÃO OPERACIONAL" title={page} description={`Gerencie ${subtitle} do FieldOps.`} action={action} onAction={()=>setModal(true)} />
    <div className="toolbar"><div className="search wide"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar ${noun}...`} /></div><select className="filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>Todos</option><option>Ativo</option><option>Operacional</option><option>Atenção</option><option>Publicado</option><option>Rascunho</option><option>Aberta</option><option>Em tratamento</option><option>Resolvida</option></select><button className="filter"><SlidersHorizontal size={15}/> Filtros</button></div>
    <div className="panel"><div className="panel-head"><div><h3>{filtered.length} {noun}</h3><span>Registros exclusivos deste módulo</span></div><button className="ghost" onClick={()=>downloadCsv(`${noun}.csv`,[['ID','Nome','Detalhes','Status','Metadados'],...filtered.map(item=>[item.id,item.name,item.detail,item.status,item.meta])])}><Download size={15}/> Exportar</button></div><div className="resource-list">{filtered.map(item=><div className="resource-row" key={item.id}><div className="resource-icon"><ResourceIcon size={19}/></div><div className="resource-main"><b>{item.name}</b><span>{item.detail}</span></div><span className={'badge '+(item.status==='Resolvida'||item.status==='Publicado'||item.status==='Ativo'||item.status==='Operacional'?'approved':item.status==='Atenção'||item.status==='Em tratamento'?'review':'scheduled')}>{item.status}</span><div className="resource-meta">{item.meta}</div><button className="icon-btn subtle" title="Editar" onClick={()=>edit(item)}><Pencil size={16}/></button><button className="icon-btn subtle" title="Excluir" onClick={()=>setItems(items.filter(current=>current.id!==item.id))}><Trash2 size={16}/></button></div>)}</div>{filtered.length===0 && <div className="no-results">Nenhum registro encontrado.</div>}</div>
    {modal && <FormModal page={page} title={editing ? `Editar ${noun.slice(0,-1)}` : action} draft={draft} setDraft={setDraft} onClose={()=>{setModal(false);setEditing(null)}} onSave={save} />}
  </>
}

function PageHeading({eyebrow,title,description,action,onAction}:{eyebrow:string,title:string,description:string,action:string,onAction:()=>void}) { return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="primary" onClick={onAction}><Plus size={18}/> {action}</button></div> }

function CalendarPage() { const [week,setWeek]=useState(0); const days=['Seg 10','Ter 11','Qua 12','Qui 13','Sex 14','Sáb 15','Dom 16']; const events=[['08:00','Toyota Industrial','Painel Elétrico PE-021','running'],['09:30','Metalúrgica Alpha','Compressor CP-001','review'],['13:00','Indústria NovaTech','Motor MTR-103','approved'],['15:30','Toyota Industrial','Bomba hidráulica BH-022','scheduled']]; return <><PageHeading eyebrow="PLANEJAMENTO" title="Calendário" description="Organize a agenda das equipes e evite conflitos de atendimento." action="Agendar inspeção" onAction={()=>downloadCsv('agenda-inspecoes.csv',[['Horário','Cliente','Equipamento','Status'],...events.map(event=>event.slice(0,4))])} /><div className="calendar-toolbar"><button className="filter" onClick={()=>setWeek(week-1)}>‹ Semana anterior</button><strong>{week===0?'11 a 17 de agosto de 2026':week<0?'04 a 10 de agosto de 2026':'18 a 24 de agosto de 2026'}</strong><button className="filter" onClick={()=>setWeek(week+1)}>Próxima semana ›</button><button className="ghost" onClick={()=>setWeek(0)}><CalendarCheck size={16}/> Hoje</button></div><div className="panel calendar"><div className="calendar-grid calendar-days">{days.map(day=><b key={day}>{day}</b>)}</div><div className="calendar-grid calendar-events">{days.map((day,index)=><div className="calendar-day" key={day}>{events.filter((_,eventIndex)=>eventIndex===index%4).map(event=><div className={'event '+event[3]} key={event[0]}><b>{event[0]}</b><strong>{event[1]}</strong><span>{event[2]}</span></div>)}</div>)}</div></div></> }

function ReportsPage() { const [range,setRange]=useState('Últimos 30 dias'); const reportRows=[['Indicador','Valor'],['Taxa de aprovação','84,6%'],['Tempo médio','42 min'],['Conclusão no prazo','91,2%']]; return <><PageHeading eyebrow="INTELIGÊNCIA" title="Relatórios" description="Transforme os dados de campo em decisões operacionais." action="Gerar relatório" onAction={()=>downloadCsv('relatorio-fieldops.csv',reportRows)} /><div className="report-controls"><button className="select" onClick={()=>setRange(range==='Últimos 30 dias'?'Este trimestre':'Últimos 30 dias')}>{range} <ChevronDown size={15}/></button><button className="ghost" onClick={()=>downloadCsv('relatorio-fieldops.csv',reportRows)}><Download size={16}/> Exportar CSV</button><button className="ghost" onClick={()=>window.print()}><FileBarChart size={16}/> PDF</button></div><div className="stats report-stats"><div className="stat"><span>Taxa de aprovação</span><div className="stat-value">84,6%</div><div className="stat-trend">+6,4% no período</div></div><div className="stat"><span>Tempo médio</span><div className="stat-value">42 min</div><div className="stat-trend">-8 min no período</div></div><div className="stat"><span>Conclusão no prazo</span><div className="stat-value">91,2%</div><div className="stat-trend">+3,8% no período</div></div></div><div className="grid-2"><div className="panel report-panel"><h3>Relatórios disponíveis</h3>{['Desempenho por técnico','Não conformidades por cliente','Histórico de inspeções','Indicadores de SLA'].map(x=><button className="report-row" key={x} onClick={()=>downloadCsv(`${x.toLowerCase().replaceAll(' ','-')}.csv`,reportRows)}><FileBarChart size={18}/><span><b>{x}</b><small>Atualizado em 11/08/2026</small></span><Download size={16}/></button>)}</div><div className="panel report-panel"><h3>Resumo de produtividade</h3>{[['Inspeções concluídas','112'],['Horas em campo','86h 40min'],['Clientes atendidos','18'],['Alertas críticos','5']].map(row=><div className="metric-line" key={row[0]}><span>{row[0]}</span><b>{row[1]}</b></div>)}</div></div></> }

function AuditPage() { const logs=[['Hoje, 10:42','Carlos Souza','aprovou a inspeção INS-000122','Aprovação'],['Hoje, 09:18','Ana Costa','enviou evidências para INS-000124','Evidência'],['Ontem, 17:06','Marcos Lima','alterou o status de NC-0048','Atualização'],['10/08/2026, 15:30','Carlos Souza','criou o modelo MOD-0021','Criação']]; const [query,setQuery]=useState(''); const [type,setType]=useState('Todos'); const visible=logs.filter(log=>(type==='Todos'||log[3]===type)&&log.join(' ').toLowerCase().includes(query.toLowerCase())); const exportLog=()=>downloadCsv('log-auditoria.csv',[['Data','Usuário','Ação','Tipo'],...visible]); return <><PageHeading eyebrow="GOVERNANÇA" title="Auditoria" description="Rastreabilidade completa das ações realizadas no sistema." action="Exportar log" onAction={exportLog} /><div className="toolbar"><div className="search wide"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por usuário ou ação..." /></div><select className="filter" value={type} onChange={e=>setType(e.target.value)}><option>Todos</option><option>Aprovação</option><option>Evidência</option><option>Atualização</option><option>Criação</option></select><button className="filter" onClick={()=>setQuery('')}><CalendarDays size={15}/> Limpar</button></div><div className="panel"><div className="audit-list">{visible.map(log=><div className="audit-row" key={log[0]+log[1]}><div className="audit-icon"><ShieldCheck size={17}/></div><div><b>{log[1]} <span>{log[2]}</span></b><small>{log[0]}</small></div><span className="badge scheduled">{log[3]}</span><MoreHorizontal size={18} className="audit-more" /></div>)}{visible.length===0&&<div className="no-results">Nenhuma atividade encontrada.</div>}</div></div></> }

function SettingsPage() { const [saved,setSaved]=useState(false); const [notifications,setNotifications]=useState(true); const [offline,setOffline]=useState(true); const [tab,setTab]=useState('Geral'); const [organization,setOrganization]=useState('FieldOps Operações'); const [timezone,setTimezone]=useState('America/Sao_Paulo'); const tabs=[['Geral',Settings],['Notificações',Bell],['Equipe e permissões',Users],['Segurança',ShieldCheck]] as const; return <><PageHeading eyebrow="ADMINISTRAÇÃO" title="Configurações" description="Ajuste preferências, notificações e regras do ambiente." action="Salvar alterações" onAction={()=>setSaved(true)} /><div className="settings-grid"><div className="panel settings-nav">{tabs.map(([label,Icon])=><button key={label} className={'settings-tab '+(tab===label?'active':'')} onClick={()=>{setTab(label);setSaved(false)}}><Icon size={17}/> {label}</button>)}</div><div className="panel settings-form"><h3>{tab === 'Geral' ? 'Preferências do ambiente' : tab}</h3><p className="muted">{tab === 'Geral' ? 'Defina como sua equipe trabalha no FieldOps.' : `Configure as opções de ${tab.toLowerCase()}.`}</p>{tab === 'Geral' && <><label>Nome da organização<input value={organization} onChange={e=>setOrganization(e.target.value)} /></label><label>Fuso horário<select value={timezone} onChange={e=>setTimezone(e.target.value)}><option value="America/Sao_Paulo">(GMT-03:00) São Paulo</option><option value="America/New_York">(GMT-04:00) New York</option></select></label></>}{(tab === 'Geral'||tab === 'Notificações') && <div className="toggle-row"><div><b>Notificações de revisão</b><span>Avise supervisores quando uma inspeção aguardar revisão.</span></div><button className={'toggle '+(notifications?'on':'')} onClick={()=>setNotifications(!notifications)}><i/></button></div>}{(tab === 'Geral'||tab === 'Segurança') && <div className="toggle-row"><div><b>Modo offline para técnicos</b><span>Permita coleta de dados sem conexão.</span></div><button className={'toggle '+(offline?'on':'')} onClick={()=>setOffline(!offline)}><i/></button></div>}{saved&&<div className="saved"><CheckCircle2 size={16}/> Alterações salvas nesta sessão.</div>}<button className="primary" onClick={()=>setSaved(true)}><Save size={16}/> Salvar preferências</button></div></div></> }

function InspectionModal({onClose,onSave}:{onClose:()=>void,onSave:(draft:InspectionDraft)=>void}) {
  const [draft,setDraft] = useState<InspectionDraft>({client:'',location:'',equipment:'',technician:'',date:'2026-08-25T09:00',priority:'Normal'})
  const ready = Object.values(draft).every(value => value.trim())
  return <div className="overlay" onClick={onClose}><div className="modal inspection-modal" role="dialog" aria-modal="true" aria-labelledby="inspection-modal-title" onClick={e=>e.stopPropagation()}>
    <div className="modal-topline"><span className="modal-kicker">NOVA INSPEÇÃO</span><button className="close" onClick={onClose} aria-label="Fechar"><X size={22}/></button></div>
    <div className="modal-intro"><div className="modal-icon"><ClipboardCheck size={22}/></div><div><h2 id="inspection-modal-title">Agendar inspeção</h2><p>Organize a próxima visita e atribua os responsáveis.</p></div></div>
    <div className="inspection-form-grid">
      <label>Cliente <span>Obrigatório</span><input autoFocus placeholder="Ex.: Toyota Industrial" value={draft.client} onChange={e=>setDraft({...draft,client:e.target.value})}/></label>
      <label>Local <span>Obrigatório</span><input placeholder="Ex.: Planta Sorocaba" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/></label>
      <label className="span-2">Equipamento <span>Obrigatório</span><input placeholder="Ex.: Painel Elétrico PE-021" value={draft.equipment} onChange={e=>setDraft({...draft,equipment:e.target.value})}/></label>
      <label>Técnico responsável <span>Obrigatório</span><select value={draft.technician} onChange={e=>setDraft({...draft,technician:e.target.value})}><option value="">Selecione um técnico</option><option>João Silva</option><option>Marcos Lima</option><option>Ana Costa</option></select></label>
      <label>Data e horário <span>Obrigatório</span><input type="datetime-local" value={draft.date} min="2026-08-25T00:00" onChange={e=>setDraft({...draft,date:e.target.value})}/></label>
      <label className="span-2">Prioridade <span>Obrigatório</span><select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as InspectionDraft['priority']})}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Crítica</option></select></label>
    </div>
    <div className="modal-footer"><small><CheckCircle2 size={14}/> A inspeção será criada como agendada</small><div><button className="modal-cancel" onClick={onClose}>Cancelar</button><button className="primary" disabled={!ready} onClick={()=>onSave(draft)}><CalendarCheck size={16}/> Criar inspeção</button></div></div>
  </div></div>
}

function FormModal({page,title,draft,setDraft,onClose,onSave}:{page:string,title:string,draft:{name:string,detail:string},setDraft:(draft:{name:string,detail:string})=>void,onClose:()=>void,onSave:()=>void}) {
  const editing = title.startsWith('Editar')
  const config:Record<string,{icon:typeof Wrench; eyebrow:string; name:string; namePlaceholder:string; detail:string; detailPlaceholder:string; optionLabel:string; options:string[]}> = {
    'Modelos de inspeção':{icon:ClipboardList,eyebrow:'NOVO CHECKLIST',name:'Nome do modelo',namePlaceholder:'Ex.: Segurança Operacional',detail:'Objetivo e escopo',detailPlaceholder:'Descreva quando este checklist deve ser usado...',optionLabel:'Versão inicial',options:['v1.0 · Rascunho','v1.0 · Publicado']},
    Clientes:{icon:Building2,eyebrow:'NOVO CLIENTE',name:'Razão social',namePlaceholder:'Ex.: Toyota Industrial',detail:'Segmento e observações',detailPlaceholder:'Adicione informações sobre a organização...',optionLabel:'Status do cliente',options:['Ativo','Em implantação','Prospect']},
    Locais:{icon:MapPin,eyebrow:'NOVO LOCAL',name:'Nome da unidade',namePlaceholder:'Ex.: Planta Sorocaba',detail:'Endereço e referência',detailPlaceholder:'Informe endereço, cidade ou ponto de referência...',optionLabel:'Tipo de unidade',options:['Planta industrial','Unidade operacional','Escritório']},
    Equipamentos:{icon:Wrench,eyebrow:'NOVO EQUIPAMENTO',name:'Nome / identificação',namePlaceholder:'Ex.: Compressor CP-002',detail:'Descrição ou observação',detailPlaceholder:'Adicione detalhes técnicos ou observações...',optionLabel:'Status operacional',options:['Operacional','Atenção','Fora de operação']},
    'Não conformidades':{icon:AlertTriangle,eyebrow:'NOVA OCORRÊNCIA',name:'Título da ocorrência',namePlaceholder:'Ex.: Proteção do compressor ausente',detail:'Descrição da não conformidade',detailPlaceholder:'Descreva o risco encontrado e a ação necessária...',optionLabel:'Prioridade',options:['Baixa','Normal','Alta','Crítica']}
  }
  const current = config[page] || config.Equipamentos
  const Icon = current.icon
  const [option,setOption] = useState(current.options[0])
  return <div className="overlay" onClick={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title" onClick={e=>e.stopPropagation()}>
      <div className="modal-topline"><span className="modal-kicker">{editing ? 'ATUALIZAÇÃO DE REGISTRO' : current.eyebrow}</span><button className="close" onClick={onClose} aria-label="Fechar"><X size={22}/></button></div>
      <div className="modal-intro"><div className="modal-icon"><Icon size={22}/></div><div><h2 id="form-modal-title">{title}</h2><p>{editing ? 'Revise as informações e mantenha sua operação atualizada.' : `Configure os dados principais de ${page.toLowerCase()}.`}</p></div></div>
      <div className="modal-context"><div className="context-icon"><ClipboardList size={16}/></div><div><strong>Informações essenciais</strong><span>Você poderá complementar este registro depois.</span></div><span className="context-status"><i/> Rascunho</span></div>
      <div className="modal-fields">
        <label>{current.name} <span>Obrigatório</span><div className="modal-field"><Icon size={17}/><input autoFocus placeholder={current.namePlaceholder} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div></label>
        <label>{current.detail} <em>Opcional</em><div className="modal-field textarea"><FileText size={17}/><textarea rows={3} placeholder={current.detailPlaceholder} value={draft.detail} onChange={e=>setDraft({...draft,detail:e.target.value})}/></div></label>
        <label className="modal-option">{current.optionLabel}<select value={option} onChange={e=>setOption(e.target.value)}>{current.options.map(item=><option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="modal-footer"><small><CheckCircle2 size={14}/> Salvamento seguro e rastreável</small><div><button className="modal-cancel" onClick={onClose}>Cancelar</button><button className="primary" disabled={!draft.name.trim()} onClick={onSave}><Save size={16}/> {editing ? 'Salvar alterações' : 'Salvar registro'}</button></div></div>
    </div>
  </div>
}
export default App
