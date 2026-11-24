import type { NonConformity, NonConformitySeverity, NonConformityStatus } from '../types';
import type { BackendInspection, NonConformitySeverityApi } from '../services/api';
import { formatDateTimeBR } from '../services/mappers';
import * as repo from './repository';

/*
|--------------------------------------------------------------------------
| LISTA DE NÃO CONFORMIDADES (dados do banco local)
|--------------------------------------------------------------------------
| Junta as não conformidades registradas (no aparelho e no servidor) e os
| itens do checklist respondidos como "Não conforme".
*/

const SEVERITY: Record<NonConformitySeverityApi, NonConformitySeverity> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

function statusFor(inspection: BackendInspection): NonConformityStatus {
  if (inspection.status === 'UNDER_REVIEW' || inspection.status === 'COMPLETED') return 'Em análise';
  if (inspection.status === 'APPROVED') return 'Resolvida';
  return 'Aberta';
}

export async function loadNonConformities(userId: number): Promise<NonConformity[]> {
  const groups = await repo.listAllNonConformities(userId);
  const result: NonConformity[] = [];

  for (const group of groups) {
    const inspection = group.inspection;

    const base = {
      equipmentId: String(inspection.equipmentId),
      equipmentName: inspection.equipmentName,
      tag: inspection.equipmentQrCode || '—',
      client: inspection.clientName,
      factory: inspection.siteName,
      videos: [] as string[],
      status: statusFor(inspection),
    };

    group.local.forEach((nc) => {
      result.push({
        ...base,
        id: `local-${nc.localId}`,
        sector: nc.state === 'SYNCED' ? 'Sincronizada' : nc.state === 'ERROR' ? 'Erro no envio' : 'Aguardando envio',
        type: nc.payload.type || 'Não conformidade',
        severity: SEVERITY[nc.payload.severity],
        problemDescription: nc.payload.description,
        probableCause: nc.payload.probableCause ?? '',
        recommendedAction: nc.payload.recommendedAction ?? '',
        technicalNotes: nc.payload.technicalNotes ?? '',
        photos: group.localPhotos[nc.localId] ?? [],
        createdAt: formatDateTimeBR(new Date(nc.createdAt).toISOString()),
      });
    });

    group.server.forEach((nc) => {
      result.push({
        ...base,
        id: `server-${nc.id}`,
        sector: 'Sincronizada',
        type: nc.type || 'Não conformidade',
        severity: SEVERITY[nc.severity],
        problemDescription: nc.description,
        probableCause: nc.probableCause ?? '',
        recommendedAction: nc.recommendedAction ?? '',
        technicalNotes: nc.technicalNotes ?? '',
        photos: [],
        createdAt: formatDateTimeBR(nc.createdAt),
      });
    });

    group.checklistNonConform.forEach((entry) => {
      result.push({
        ...base,
        id: `item-${inspection.id}-${entry.item.id}`,
        sector: entry.sectionTitle,
        type: 'Item do checklist',
        severity: entry.item.criticalOnNonconformity ? 'Crítica' : 'Média',
        problemDescription: entry.item.label,
        probableCause: '',
        recommendedAction: '',
        technicalNotes: entry.observation ?? '',
        photos: [],
        createdAt: entry.updatedAt ? formatDateTimeBR(new Date(entry.updatedAt).toISOString()) : '',
      });
    });
  }

  return result;
}
