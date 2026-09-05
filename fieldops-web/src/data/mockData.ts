import type { Inspection, Resource } from '../types'

export const trend = [
  { day: 'Seg', total: 18 }, { day: 'Ter', total: 26 }, { day: 'Qua', total: 21 },
  { day: 'Qui', total: 34 }, { day: 'Sex', total: 29 }, { day: 'Sáb', total: 12 }, { day: 'Dom', total: 8 }
]

export const statuses = [
  { name: 'Agendadas', value: 18 }, { name: 'Em andamento', value: 11 },
  { name: 'Revisão', value: 7 }, { name: 'Aprovadas', value: 42 }, { name: 'Reprovadas', value: 5 }
]

export const seed: Inspection[] = [
  { id: 'INS-000124', client: 'Toyota Industrial', location: 'Planta Sorocaba', equipment: 'Painel Elétrico PE-021', technician: 'João Silva', date: '11/08/2026', status: 'Aguardando revisão', priority: 'Alta', progress: 100 },
  { id: 'INS-000123', client: 'Metalúrgica Alpha', location: 'Unidade Industrial 01', equipment: 'Compressor CP-001', technician: 'Marcos Lima', date: '11/08/2026', status: 'Em andamento', priority: 'Crítica', progress: 72 },
  { id: 'INS-000122', client: 'Indústria NovaTech', location: 'Planta Campinas', equipment: 'Motor MTR-103', technician: 'Ana Costa', date: '10/08/2026', status: 'Aprovada', priority: 'Normal', progress: 100 },
  { id: 'INS-000121', client: 'Toyota Industrial', location: 'Planta Sorocaba', equipment: 'Bomba hidráulica BH-022', technician: 'João Silva', date: '10/08/2026', status: 'Reprovada', priority: 'Alta', progress: 100 },
  { id: 'INS-000120', client: 'Metalúrgica Alpha', location: 'Unidade Industrial 01', equipment: 'Compressor CP-001', technician: 'Marcos Lima', date: '09/08/2026', status: 'Agendada', priority: 'Baixa', progress: 0 }
]

export const resources: Record<string, Resource[]> = {
  'Modelos de inspeção': [
    { id: 'MOD-0021', name: 'Segurança Operacional', detail: '24 itens · v2.1', status: 'Publicado', meta: 'Atualizado hoje' },
    { id: 'MOD-0018', name: 'NR-12 Máquinas e Equipamentos', detail: '31 itens · v1.4', status: 'Publicado', meta: 'Atualizado em 02/08/2026' },
    { id: 'MOD-0011', name: 'Instalações Elétricas', detail: '18 itens · v3.0', status: 'Rascunho', meta: 'Criado em 28/07/2026' }
  ],
  Clientes: [
    { id: 'CLI-001', name: 'Toyota Industrial', detail: 'Indústria automotiva', status: 'Ativo', meta: '3 locais · 48 equipamentos' },
    { id: 'CLI-002', name: 'Metalúrgica Alpha', detail: 'Metalurgia', status: 'Ativo', meta: '1 local · 19 equipamentos' },
    { id: 'CLI-003', name: 'Indústria NovaTech', detail: 'Manufatura', status: 'Ativo', meta: '2 locais · 27 equipamentos' }
  ],
  Locais: [
    { id: 'LOC-021', name: 'Planta Sorocaba', detail: 'Toyota Industrial · Sorocaba, SP', status: 'Ativo', meta: '18 equipamentos' },
    { id: 'LOC-014', name: 'Unidade Industrial 01', detail: 'Metalúrgica Alpha · Campinas, SP', status: 'Ativo', meta: '19 equipamentos' },
    { id: 'LOC-009', name: 'Planta Campinas', detail: 'Indústria NovaTech · Campinas, SP', status: 'Ativo', meta: '27 equipamentos' }
  ],
  Equipamentos: [
    { id: 'PE-021', name: 'Painel Elétrico PE-021', detail: 'Planta Sorocaba · Toyota Industrial', status: 'Operacional', meta: 'Última inspeção: 11/08/2026' },
    { id: 'CP-001', name: 'Compressor CP-001', detail: 'Unidade Industrial 01 · Metalúrgica Alpha', status: 'Atenção', meta: 'Última inspeção: 11/08/2026' },
    { id: 'MTR-103', name: 'Motor MTR-103', detail: 'Planta Campinas · Indústria NovaTech', status: 'Operacional', meta: 'Última inspeção: 10/08/2026' }
  ],
  'Não conformidades': [
    { id: 'NC-0048', name: 'Proteção do compressor ausente', detail: 'CP-001 · Metalúrgica Alpha', status: 'Aberta', meta: 'Alta · vence em 3 dias' },
    { id: 'NC-0047', name: 'Cabo com isolamento danificado', detail: 'PE-021 · Toyota Industrial', status: 'Em tratamento', meta: 'Crítica · Carlos Souza' },
    { id: 'NC-0042', name: 'Sinalização de segurança apagada', detail: 'MTR-103 · Indústria NovaTech', status: 'Resolvida', meta: 'Baixa · resolvida em 08/08/2026' }
  ]
}
