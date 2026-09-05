export type Status = 'Agendada' | 'Em andamento' | 'Aguardando revisão' | 'Aprovada' | 'Reprovada'

export type Inspection = {
  id: string
  client: string
  location: string
  equipment: string
  technician: string
  date: string
  status: Status
  priority: 'Baixa' | 'Normal' | 'Alta' | 'Crítica'
  progress: number
}

export type InspectionDraft = Pick<Inspection, 'client' | 'location' | 'equipment' | 'technician' | 'date' | 'priority'>

export type Resource = {
  id: string
  name: string
  detail: string
  status: string
  meta: string
  kind?: string
}
