import { Inspection } from '../types';
export const trend = [{day:'Seg',total:18},{day:'Ter',total:26},{day:'Qua',total:21},{day:'Qui',total:34},{day:'Sex',total:29},{day:'Sáb',total:12},{day:'Dom',total:8}];
export const statuses = [{name:'Agendadas',value:18},{name:'Em andamento',value:11},{name:'Revisão',value:7},{name:'Aprovadas',value:42},{name:'Reprovadas',value:5}];
export const inspectionsSeed: Inspection[] = [
{id:'INS-000124',client:'Toyota Industrial',location:'Planta Sorocaba',equipment:'Painel Elétrico PE-021',technician:'João Silva',date:'11/08/2026',status:'Aguardando revisão',priority:'Alta',progress:100},
{id:'INS-000123',client:'Metalúrgica Alpha',location:'Unidade Industrial 01',equipment:'Compressor CP-001',technician:'Marcos Lima',date:'11/08/2026',status:'Em andamento',priority:'Crítica',progress:72},
{id:'INS-000122',client:'Indústria NovaTech',location:'Planta Campinas',equipment:'Motor MTR-103',technician:'Ana Costa',date:'10/08/2026',status:'Aprovada',priority:'Normal',progress:100},
{id:'INS-000121',client:'Toyota Industrial',location:'Planta Sorocaba',equipment:'Bomba hidráulica BH-022',technician:'João Silva',date:'10/08/2026',status:'Reprovada',priority:'Alta',progress:100},
{id:'INS-000120',client:'Metalúrgica Alpha',location:'Unidade Industrial 01',equipment:'Compressor CP-001',technician:'Marcos Lima',date:'09/08/2026',status:'Agendada',priority:'Baixa',progress:0}
];
