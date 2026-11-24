type InspectionDetailsPageProps = { inspectionId?: string }

export function InspectionDetailsPage({ inspectionId = 'INS-000124' }: InspectionDetailsPageProps) {
  return <section className="page-head"><div><div className="eyebrow">{inspectionId}</div><h1>Detalhes da inspeção</h1><p>Consulte os dados, respostas e andamento da inspeção.</p></div></section>
}
