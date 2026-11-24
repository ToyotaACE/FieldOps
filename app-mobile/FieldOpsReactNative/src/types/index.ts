import type { BackendInspectionStatus } from '../services/api';
import type { SyncState } from '../offline/syncEngine';

export type Page =
  | 'Dashboard'
  | 'Inspeções e relatórios'
  | 'Calendário'
  | 'Modelos de inspeção'
  | 'Clientes'
  | 'Locais'
  | 'Equipamentos'
  | 'Não conformidades'
  | 'Auditoria'
  | 'Sincronização'
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
  | 'Concluída'
  | 'Aguardando revisão'
  | 'Aprovada'
  | 'Reprovada'
  | 'Cancelada';

export type Priority =
  | 'Baixa'
  | 'Normal'
  | 'Alta'
  | 'Crítica';

export type Inspection = {
  id: string;
  title: string;

  // Identificador da versão do modelo escolhido pelo supervisor
  templateVersionId: number;

  // Identificadores do backend
  clientId: number;
  siteId: number;
  equipmentId: number;
  technicianId: number;

  client: string;
  location: string;
  equipment: string;
  technician: string;

  // Data e hora exibidas (ex.: 2026-08-11 08:30)
  date: string;

  // Data (YYYY-MM-DD) e hora (HH:mm) agendadas
  scheduledDate: string;
  scheduledTime: string;

  status: Status;

  // Status efetivo (local, se houver mudança ainda não confirmada; senão o do servidor)
  backendStatus: BackendInspectionStatus;

  // QR Code do equipamento previsto e instruções do supervisor
  equipmentQrCode: string | null;
  instructions: string | null;

  // Estado de sincronização (independente do status operacional)
  syncState: SyncState;
  pendingCount: number;

  priority: Priority;
  progress?: number | null;
};

/*
|--------------------------------------------------------------------------
| NÃO CONFORMIDADES
|--------------------------------------------------------------------------
*/

export type NonConformitySeverity =
  | 'Baixa'
  | 'Média'
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
