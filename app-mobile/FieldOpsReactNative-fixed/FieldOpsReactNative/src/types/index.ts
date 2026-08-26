export type Status = 'Agendada' | 'Em andamento' | 'Aguardando revisão' | 'Aprovada' | 'Reprovada';
export type Priority = 'Baixa' | 'Normal' | 'Alta' | 'Crítica';
export type Inspection = { id:string; client:string; location:string; equipment:string; technician:string; date:string; status:Status; priority:Priority; progress:number };
export type Page = 'Dashboard'|'Inspeções'|'Calendário'|'Modelos de inspeção'|'Locais'|'Equipamentos'|'Não conformidades'|'Relatórios'|'Auditoria'|'Configurações';
export type Palette = { bg:string; panel:string; text:string; muted:string; border:string; grid:string };
