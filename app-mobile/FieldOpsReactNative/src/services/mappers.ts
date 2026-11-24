import type { Inspection, Priority, Status } from '../types';
import type { BackendInspection } from './api';
import type { LocalInspection } from '../offline/repository';
import { deriveSyncState } from '../offline/syncEngine';

/*
|--------------------------------------------------------------------------
| CONVERSÃO DOS DADOS PARA OS TIPOS DO APLICATIVO
|--------------------------------------------------------------------------
*/

export function mapBackendStatus(
  status: BackendInspection['status'],
): Status {
  switch (status) {
    case 'SCHEDULED':
      return 'Agendada';

    case 'IN_PROGRESS':
      return 'Em andamento';

    case 'COMPLETED':
      return 'Concluída';

    case 'UNDER_REVIEW':
      return 'Aguardando revisão';

    case 'APPROVED':
      return 'Aprovada';

    case 'REJECTED':
      return 'Reprovada';

    case 'CANCELLED':
      return 'Cancelada';

    default:
      return 'Agendada';
  }
}

export function mapBackendPriority(
  priority: BackendInspection['priority'],
): Priority {
  switch (priority) {
    case 'LOW':
      return 'Baixa';

    case 'NORMAL':
      return 'Normal';

    case 'HIGH':
      return 'Alta';

    case 'CRITICAL':
      return 'Crítica';

    default:
      return 'Normal';
  }
}

/**
 * Código de exibição da inspeção (ex.: INS-000124).
 */
export function formatInspectionCode(id: string | number): string {
  return `INS-${String(id).padStart(6, '0')}`;
}

/**
 * Converte "2026-08-11" em "11/08/2026".
 */
export function formatDateBR(value?: string | null): string {
  if (!value) return '';

  const datePart = value.split('T')[0] ?? value;
  const parts = datePart.split('-');

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Converte "2026-08-11T10:30:00" em "11/08/2026 10:30".
 */
export function formatDateTimeBR(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function progressFor(local: LocalInspection): number | null {
  if (local.itemCount > 0) {
    return Math.round((local.answeredCount / local.itemCount) * 100);
  }

  switch (local.status) {
    case 'SCHEDULED':
      return 0;

    case 'COMPLETED':
    case 'UNDER_REVIEW':
    case 'APPROVED':
    case 'REJECTED':
      return 100;

    default:
      return null;
  }
}

/**
 * Converte a inspeção do banco local para o tipo usado nas telas.
 */
export function mapLocalInspection(
  local: LocalInspection,
  online: boolean,
  syncing: boolean,
): Inspection {
  const data = local.data;
  const scheduledDate = (data.scheduledDate || '').slice(0, 10);
  const scheduledTime = (data.scheduledTime || '').slice(0, 5);

  return {
    id: String(data.id),
    title: data.title,
    templateVersionId: data.templateVersionId,

    clientId: data.clientId,
    siteId: data.siteId,
    equipmentId: data.equipmentId,
    technicianId: data.technicianId,

    client: data.clientName,
    location: data.siteName,
    equipment: data.equipmentName,
    technician: data.technicianName,

    date: [formatDateBR(scheduledDate), scheduledTime]
      .filter(Boolean)
      .join(' '),

    scheduledDate,
    scheduledTime,

    status: mapBackendStatus(local.status),
    backendStatus: local.status,
    priority: mapBackendPriority(data.priority),

    equipmentQrCode: data.equipmentQrCode ?? null,
    instructions: data.instructions ?? null,

    syncState: deriveSyncState(local.pending, online, syncing),
    pendingCount: local.pending.operations + local.pending.evidences + local.pending.errors,

    progress: progressFor(local),
  };
}
