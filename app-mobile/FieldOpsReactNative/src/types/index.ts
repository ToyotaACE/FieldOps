export type Page =
  | 'Dashboard'
  | 'Inspeções'
  | 'Calendário'
  | 'Modelos de inspeção'
  | 'Clientes'
  | 'Locais'
  | 'Equipamentos'
  | 'Não conformidades'
  | 'Relatórios'
  | 'Auditoria'
  | 'Configurações';

export type Palette = {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  grid: string;
};

export type Status =
  | 'Agendada'
  | 'Em andamento'
  | 'Aguardando revisão'
  | 'Aprovada'
  | 'Reprovada';

export type Priority =
  | 'Baixa'
  | 'Normal'
  | 'Alta'
  | 'Crítica';

export type Inspection = {
  id: string;
  client: string;
  location: string;
  equipment: string;
  technician: string;
  date: string;
  status: Status;
  priority: Priority;
  progress: number;
};

/*
|--------------------------------------------------------------------------
| NÃO CONFORMIDADES
|--------------------------------------------------------------------------
*/

export type NonConformitySeverity =
  | 'Baixa'
  | 'Moderada'
  | 'Alta'
  | 'Crítica';

export type NonConformityStatus =
  | 'Aberta'
  | 'Em análise'
  | 'Resolvida';

export type NonConformity = {
  id: string;

  equipmentId: string;
  equipmentName: string;
  tag: string;

  client: string;
  factory: string;
  sector: string;

  type: string;
  severity: NonConformitySeverity;

  problemDescription: string;
  probableCause: string;
  recommendedAction: string;
  technicalNotes: string;

  photos: string[];
  videos: string[];

  status: NonConformityStatus;

  createdAt: string;
};