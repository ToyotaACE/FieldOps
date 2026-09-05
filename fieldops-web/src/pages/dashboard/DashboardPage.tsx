type DashboardPageProps = { onNewInspection?: () => void }

export function DashboardPage({ onNewInspection }: DashboardPageProps) {
  return <section className="page-head"><div><div className="eyebrow">VISÃO OPERACIONAL</div><h1>Visão geral das operações</h1><p>Acompanhe a execução das inspeções em campo em tempo real.</p></div>{onNewInspection && <button className="primary" onClick={onNewInspection}>Nova inspeção</button>}</section>
}
