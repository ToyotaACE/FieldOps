import { getDb } from './db';
import { emitLocalChange } from './events';
import { newId } from './files';

import type {
  ApiNonConformity,
  BackendInspection,
  BackendInspectionStatus,
  ChecklistSection,
  InspectionEvidence,
  InspectionPackage,
  NonConformityPayload,
  SyncOperationRequest,
  SyncOperationResult,
  TemplateItem,
} from '../services/api';

/*
|--------------------------------------------------------------------------
| REPOSITÓRIO LOCAL
|--------------------------------------------------------------------------
| Toda alteração feita pelo técnico é gravada aqui primeiro (respostas,
| fotos, não conformidades e mudanças de estado) e registrada na outbox.
| O motor de sincronização envia a outbox e só marca algo como
| sincronizado depois da confirmação do servidor.
*/

export type OperationType = SyncOperationRequest['type'];

export type LocalOperationState = 'PENDING' | 'SENDING' | 'ERROR';

export type ExecutionInfo = {
  deviceTime: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  locationTime?: string | null;
};

export type LocalAnswer = {
  inspectionId: number;
  templateItemId: number;
  value: string | null;
  observation: string | null;
  serverAnswerId: number | null;
  syncState: 'PENDING' | 'SYNCED' | 'ERROR';
  lastError: string | null;
  updatedAt: number;
};

export type LocalEvidence = {
  localId: string;
  inspectionId: number;
  templateItemId: number | null;
  ncLocalId: string | null;
  fileUri: string;
  mimeType: string;
  fileName: string;
  serverId: number | null;
  state: 'PENDING' | 'UPLOADING' | 'SYNCED' | 'ERROR';
  attempts: number;
  lastError: string | null;
  createdAt: number;
};

export type LocalNonConformity = {
  localId: string;
  inspectionId: number;
  payload: NonConformityPayload;
  serverId: number | null;
  state: 'PENDING' | 'SYNCED' | 'ERROR';
  createdAt: number;
};

export type PendingCounts = {
  operations: number;
  evidences: number;
  errors: number;
};

export type LocalInspection = {
  data: BackendInspection;
  serverStatus: BackendInspectionStatus;
  localStatus: BackendInspectionStatus | null;
  status: BackendInspectionStatus;
  qrValidated: boolean;
  pending: PendingCounts;
  answeredCount: number;
  itemCount: number;
};

export type InspectionDetail = {
  inspection: LocalInspection;
  sections: ChecklistSection[];
  answers: Record<number, LocalAnswer>;
  localEvidences: LocalEvidence[];
  serverEvidences: InspectionEvidence[];
  localNonConformities: LocalNonConformity[];
  serverNonConformities: ApiNonConformity[];
};

export type OutboxEntry = {
  seq: number;
  operationId: string;
  inspectionId: number;
  type: OperationType;
  itemKey: string | null;
  payload: SyncOperationRequest;
  state: LocalOperationState;
  attempts: number;
  lastError: string | null;
  createdAt: number;
};

/* ------------------------------------------------------------------ */
/* Conversões                                                          */
/* ------------------------------------------------------------------ */

type InspectionRow = {
  id: number;
  user_id: number;
  data: string;
  server_status: string;
  local_status: string | null;
  server_updated_at: string | null;
  qr_validated: number;
};

type AnswerRow = {
  inspection_id: number;
  template_item_id: number;
  value: string | null;
  observation: string | null;
  server_answer_id: number | null;
  sync_state: string;
  last_error: string | null;
  updated_at: number;
};

type EvidenceRow = {
  local_id: string;
  inspection_id: number;
  template_item_id: number | null;
  nc_local_id: string | null;
  file_uri: string;
  mime_type: string;
  file_name: string;
  server_id: number | null;
  state: string;
  attempts: number;
  last_error: string | null;
  created_at: number;
};

type OutboxRow = {
  seq: number;
  operation_id: string;
  inspection_id: number;
  type: string;
  item_key: string | null;
  payload: string;
  state: string;
  attempts: number;
  last_error: string | null;
  created_at: number;
};

function toAnswer(row: AnswerRow): LocalAnswer {
  return {
    inspectionId: row.inspection_id,
    templateItemId: row.template_item_id,
    value: row.value,
    observation: row.observation,
    serverAnswerId: row.server_answer_id,
    syncState: row.sync_state as LocalAnswer['syncState'],
    lastError: row.last_error,
    updatedAt: row.updated_at,
  };
}

function toEvidence(row: EvidenceRow): LocalEvidence {
  return {
    localId: row.local_id,
    inspectionId: row.inspection_id,
    templateItemId: row.template_item_id,
    ncLocalId: row.nc_local_id,
    fileUri: row.file_uri,
    mimeType: row.mime_type,
    fileName: row.file_name,
    serverId: row.server_id,
    state: row.state as LocalEvidence['state'],
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

function toOutbox(row: OutboxRow): OutboxEntry {
  return {
    seq: row.seq,
    operationId: row.operation_id,
    inspectionId: row.inspection_id,
    type: row.type as OperationType,
    itemKey: row.item_key,
    payload: JSON.parse(row.payload) as SyncOperationRequest,
    state: row.state as LocalOperationState,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Contagens de pendências                                             */
/* ------------------------------------------------------------------ */

async function pendingByInspection(
  userId: number,
): Promise<Map<number, PendingCounts>> {
  const db = await getDb();
  const map = new Map<number, PendingCounts>();

  const ensure = (id: number) => {
    let counts = map.get(id);

    if (!counts) {
      counts = { operations: 0, evidences: 0, errors: 0 };
      map.set(id, counts);
    }

    return counts;
  };

  const ops = await db.getAllAsync<{ inspection_id: number; state: string; total: number }>(
    'SELECT inspection_id, state, COUNT(*) AS total FROM outbox WHERE user_id = ? GROUP BY inspection_id, state',
    userId,
  );

  ops.forEach((row) => {
    const counts = ensure(row.inspection_id);

    if (row.state === 'ERROR') counts.errors += row.total;
    else counts.operations += row.total;
  });

  const evidences = await db.getAllAsync<{ inspection_id: number; state: string; total: number }>(
    `SELECT e.inspection_id, e.state, COUNT(*) AS total
       FROM evidences e
       JOIN inspections i ON i.id = e.inspection_id
      WHERE i.user_id = ? AND e.state <> 'SYNCED'
      GROUP BY e.inspection_id, e.state`,
    userId,
  );

  evidences.forEach((row) => {
    const counts = ensure(row.inspection_id);

    if (row.state === 'ERROR') counts.errors += row.total;
    else counts.evidences += row.total;
  });

  return map;
}

export async function getPendingSummary(userId: number): Promise<PendingCounts> {
  const map = await pendingByInspection(userId);
  const total: PendingCounts = { operations: 0, evidences: 0, errors: 0 };

  map.forEach((counts) => {
    total.operations += counts.operations;
    total.evidences += counts.evidences;
    total.errors += counts.errors;
  });

  return total;
}

/* ------------------------------------------------------------------ */
/* Inspeções                                                           */
/* ------------------------------------------------------------------ */

function buildLocalInspection(
  row: InspectionRow,
  pending: PendingCounts | undefined,
  answeredCount: number,
  itemCount: number,
): LocalInspection {
  const serverStatus = row.server_status as BackendInspectionStatus;
  const localStatus = (row.local_status as BackendInspectionStatus | null) ?? null;

  return {
    data: JSON.parse(row.data) as BackendInspection,
    serverStatus,
    localStatus,
    status: localStatus ?? serverStatus,
    qrValidated: row.qr_validated === 1,
    pending: pending ?? { operations: 0, evidences: 0, errors: 0 },
    answeredCount,
    itemCount,
  };
}

async function progressCounts(
  inspectionIds: number[],
): Promise<Map<number, { answered: number; items: number }>> {
  const db = await getDb();
  const map = new Map<number, { answered: number; items: number }>();

  if (inspectionIds.length === 0) return map;

  const placeholders = inspectionIds.map(() => '?').join(',');

  const checklists = await db.getAllAsync<{ inspection_id: number; sections: string }>(
    `SELECT inspection_id, sections FROM checklists WHERE inspection_id IN (${placeholders})`,
    ...inspectionIds,
  );

  const answers = await db.getAllAsync<{ inspection_id: number; template_item_id: number }>(
    `SELECT inspection_id, template_item_id FROM answers
      WHERE inspection_id IN (${placeholders}) AND value IS NOT NULL AND value <> ''`,
    ...inspectionIds,
  );

  checklists.forEach((row) => {
    const sections = parseJson<ChecklistSection[]>(row.sections, []);
    const itemIds = new Set(sections.flatMap((group) => group.items.map((item) => item.id)));

    const answered = new Set(
      answers
        .filter((answer) => answer.inspection_id === row.inspection_id && itemIds.has(answer.template_item_id))
        .map((answer) => answer.template_item_id),
    ).size;

    map.set(row.inspection_id, { answered, items: itemIds.size });
  });

  return map;
}

export async function listInspections(userId: number): Promise<LocalInspection[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<InspectionRow>(
    'SELECT * FROM inspections WHERE user_id = ?',
    userId,
  );

  const pending = await pendingByInspection(userId);
  const progress = await progressCounts(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const counts = progress.get(row.id);

      return buildLocalInspection(
        row,
        pending.get(row.id),
        counts?.answered ?? 0,
        counts?.items ?? 0,
      );
    })
    .sort((a, b) =>
      `${b.data.scheduledDate} ${b.data.scheduledTime}`.localeCompare(
        `${a.data.scheduledDate} ${a.data.scheduledTime}`,
      ),
    );
}

export async function getInspectionDetail(
  userId: number,
  inspectionId: number,
): Promise<InspectionDetail | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<InspectionRow>(
    'SELECT * FROM inspections WHERE id = ? AND user_id = ?',
    inspectionId,
    userId,
  );

  if (!row) return null;

  const checklist = await db.getFirstAsync<{ sections: string }>(
    'SELECT sections FROM checklists WHERE inspection_id = ?',
    inspectionId,
  );

  const serverRecords = await db.getFirstAsync<{ evidences: string; nonconformities: string }>(
    'SELECT evidences, nonconformities FROM server_records WHERE inspection_id = ?',
    inspectionId,
  );

  const answerRows = await db.getAllAsync<AnswerRow>(
    'SELECT * FROM answers WHERE inspection_id = ?',
    inspectionId,
  );

  const evidenceRows = await db.getAllAsync<EvidenceRow>(
    'SELECT * FROM evidences WHERE inspection_id = ? ORDER BY created_at',
    inspectionId,
  );

  const ncRows = await db.getAllAsync<{
    local_id: string;
    inspection_id: number;
    payload: string;
    server_id: number | null;
    state: string;
    created_at: number;
  }>('SELECT * FROM nonconformities WHERE inspection_id = ? ORDER BY created_at', inspectionId);

  const sections = parseJson<ChecklistSection[]>(checklist?.sections, []);
  const answers: Record<number, LocalAnswer> = {};

  answerRows.forEach((answer) => {
    answers[answer.template_item_id] = toAnswer(answer);
  });

  const pending = await pendingByInspection(userId);
  const itemIds = new Set(sections.flatMap((group) => group.items.map((item) => item.id)));
  const answered = Object.values(answers).filter(
    (answer) => answer.value && itemIds.has(answer.templateItemId),
  ).length;

  const localEvidences = evidenceRows.map(toEvidence);
  const localNonConformities: LocalNonConformity[] = ncRows.map((nc) => ({
    localId: nc.local_id,
    inspectionId: nc.inspection_id,
    payload: JSON.parse(nc.payload) as NonConformityPayload,
    serverId: nc.server_id,
    state: nc.state as LocalNonConformity['state'],
    createdAt: nc.created_at,
  }));

  // Evita duplicar o que já foi enviado e voltou no download do servidor.
  const syncedEvidenceIds = new Set(
    localEvidences.map((evidence) => evidence.serverId).filter((id) => id !== null),
  );
  const localNcIds = new Set(localNonConformities.map((nc) => nc.localId));

  return {
    inspection: buildLocalInspection(row, pending.get(inspectionId), answered, itemIds.size),
    sections,
    answers,
    localEvidences,
    serverEvidences: parseJson<InspectionEvidence[]>(serverRecords?.evidences, []).filter(
      (evidence) => !syncedEvidenceIds.has(evidence.id),
    ),
    localNonConformities,
    serverNonConformities: parseJson<ApiNonConformity[]>(serverRecords?.nonconformities, []).filter(
      (nc) => !nc.clientOperationId || !localNcIds.has(nc.clientOperationId),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Download (servidor → aparelho)                                      */
/* ------------------------------------------------------------------ */

async function hasPendingWork(inspectionId: number): Promise<boolean> {
  const db = await getDb();

  const ops = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM outbox WHERE inspection_id = ?',
    inspectionId,
  );

  const evidences = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM evidences WHERE inspection_id = ? AND state <> 'SYNCED'",
    inspectionId,
  );

  return (ops?.total ?? 0) > 0 || (evidences?.total ?? 0) > 0;
}

/**
 * Grava a lista de inspeções atribuídas recebida do servidor e devolve os
 * ids cujo pacote (checklist e respostas) precisa ser baixado.
 */
export async function applyServerInspections(
  userId: number,
  inspections: BackendInspection[],
): Promise<number[]> {
  const db = await getDb();
  const needPackage: number[] = [];
  const now = Date.now();

  const existing = await db.getAllAsync<InspectionRow>(
    'SELECT * FROM inspections WHERE user_id = ?',
    userId,
  );

  const existingById = new Map(existing.map((row) => [row.id, row]));
  const serverIds = new Set(inspections.map((inspection) => inspection.id));

  for (const inspection of inspections) {
    const current = existingById.get(inspection.id);

    const checklist = await db.getFirstAsync<{ inspection_id: number }>(
      'SELECT inspection_id FROM checklists WHERE inspection_id = ?',
      inspection.id,
    );

    if (
      !current ||
      !checklist ||
      current.server_updated_at !== inspection.updatedAt ||
      current.server_status !== inspection.status
    ) {
      needPackage.push(inspection.id);
    }

    await db.runAsync(
      `INSERT INTO inspections (id, user_id, data, server_status, local_status, server_updated_at, qr_validated, downloaded_at)
       VALUES (?, ?, ?, ?, NULL, ?, 0, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         data = excluded.data,
         server_status = excluded.server_status,
         server_updated_at = excluded.server_updated_at,
         downloaded_at = excluded.downloaded_at`,
      inspection.id,
      userId,
      JSON.stringify(inspection),
      inspection.status,
      inspection.updatedAt ?? null,
      now,
    );

    await refreshLocalStatus(inspection.id);
  }

  // Inspeções que não pertencem mais ao técnico: só são removidas se não
  // houver nada pendente de envio (RN-077).
  for (const row of existing) {
    if (!serverIds.has(row.id) && !(await hasPendingWork(row.id))) {
      await deleteInspectionData(row.id);
    }
  }

  emitLocalChange('sync');

  return needPackage;
}

async function deleteInspectionData(inspectionId: number): Promise<void> {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM answers WHERE inspection_id = ?', inspectionId);
    await db.runAsync('DELETE FROM evidences WHERE inspection_id = ?', inspectionId);
    await db.runAsync('DELETE FROM nonconformities WHERE inspection_id = ?', inspectionId);
    await db.runAsync('DELETE FROM checklists WHERE inspection_id = ?', inspectionId);
    await db.runAsync('DELETE FROM server_records WHERE inspection_id = ?', inspectionId);
    await db.runAsync('DELETE FROM inspections WHERE id = ?', inspectionId);
  });
}

/**
 * Grava o pacote completo (checklist da versão exata, respostas,
 * evidências e não conformidades) baixado do servidor. Respostas locais
 * ainda não confirmadas prevalecem sobre as do servidor.
 */
export async function applyPackage(userId: number, pkg: InspectionPackage): Promise<void> {
  const db = await getDb();
  const inspectionId = pkg.inspection.id;

  const sections: ChecklistSection[] = [...pkg.sections]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((section) => ({
      section: {
        id: section.id,
        title: section.title,
        description: section.description,
        displayOrder: section.displayOrder,
      },
      items: [...section.items].sort((a, b) => a.displayOrder - b.displayOrder),
    }));

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO inspections (id, user_id, data, server_status, local_status, server_updated_at, qr_validated, downloaded_at)
       VALUES (?, ?, ?, ?, NULL, ?, 0, ?)
       ON CONFLICT(id) DO UPDATE SET
         data = excluded.data,
         server_status = excluded.server_status,
         server_updated_at = excluded.server_updated_at,
         downloaded_at = excluded.downloaded_at`,
      inspectionId,
      userId,
      JSON.stringify(pkg.inspection),
      pkg.inspection.status,
      pkg.inspection.updatedAt ?? null,
      Date.now(),
    );

    await db.runAsync(
      'INSERT INTO checklists (inspection_id, sections) VALUES (?, ?) ON CONFLICT(inspection_id) DO UPDATE SET sections = excluded.sections',
      inspectionId,
      JSON.stringify(sections),
    );

    await db.runAsync(
      `INSERT INTO server_records (inspection_id, evidences, nonconformities) VALUES (?, ?, ?)
       ON CONFLICT(inspection_id) DO UPDATE SET evidences = excluded.evidences, nonconformities = excluded.nonconformities`,
      inspectionId,
      JSON.stringify(pkg.evidences),
      JSON.stringify(pkg.nonConformities),
    );

    for (const answer of pkg.answers) {
      const local = await db.getFirstAsync<AnswerRow>(
        'SELECT * FROM answers WHERE inspection_id = ? AND template_item_id = ?',
        inspectionId,
        answer.templateItemId,
      );

      if (local && local.sync_state !== 'SYNCED') {
        if (local.server_answer_id === null) {
          await db.runAsync(
            'UPDATE answers SET server_answer_id = ? WHERE inspection_id = ? AND template_item_id = ?',
            answer.id,
            inspectionId,
            answer.templateItemId,
          );
        }

        continue;
      }

      await db.runAsync(
        `INSERT INTO answers (inspection_id, template_item_id, value, observation, server_answer_id, sync_state, last_error, updated_at)
         VALUES (?, ?, ?, ?, ?, 'SYNCED', NULL, ?)
         ON CONFLICT(inspection_id, template_item_id) DO UPDATE SET
           value = excluded.value,
           observation = excluded.observation,
           server_answer_id = excluded.server_answer_id,
           sync_state = 'SYNCED',
           last_error = NULL`,
        inspectionId,
        answer.templateItemId,
        answer.value,
        answer.observation,
        answer.id,
        Date.now(),
      );
    }
  });

  await refreshLocalStatus(inspectionId);

  emitLocalChange('sync');
}

/* ------------------------------------------------------------------ */
/* Ações do técnico (gravadas localmente + outbox)                     */
/* ------------------------------------------------------------------ */

async function enqueue(
  userId: number,
  inspectionId: number,
  payload: Omit<SyncOperationRequest, 'operationId' | 'inspectionId'>,
  operationId = newId(),
  itemKey: string | null = null,
): Promise<string> {
  const db = await getDb();

  const request: SyncOperationRequest = {
    ...payload,
    operationId,
    inspectionId,
  } as SyncOperationRequest;

  await db.runAsync(
    `INSERT INTO outbox (operation_id, user_id, inspection_id, type, item_key, payload, state, attempts, next_attempt_at, last_error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, 0, NULL, ?)`,
    operationId,
    userId,
    inspectionId,
    request.type,
    itemKey,
    JSON.stringify(request),
    Date.now(),
  );

  return operationId;
}

async function setLocalStatus(
  inspectionId: number,
  status: BackendInspectionStatus | null,
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    'UPDATE inspections SET local_status = ? WHERE id = ?',
    status,
    inspectionId,
  );
}

/**
 * O status local só existe enquanto houver uma mudança de estado ainda
 * não confirmada pelo servidor.
 */
export async function refreshLocalStatus(inspectionId: number): Promise<void> {
  const db = await getDb();

  const last = await db.getFirstAsync<{ type: string }>(
    `SELECT type FROM outbox
      WHERE inspection_id = ? AND type IN ('START', 'COMPLETE', 'REOPEN')
      ORDER BY seq DESC LIMIT 1`,
    inspectionId,
  );

  if (!last) {
    await setLocalStatus(inspectionId, null);
    return;
  }

  await setLocalStatus(
    inspectionId,
    last.type === 'COMPLETE' ? 'COMPLETED' : 'IN_PROGRESS',
  );
}

export async function startInspection(
  userId: number,
  inspectionId: number,
  execution: ExecutionInfo,
): Promise<void> {
  await enqueue(userId, inspectionId, { type: 'START', ...execution });
  await setLocalStatus(inspectionId, 'IN_PROGRESS');
  emitLocalChange();
}

export async function completeInspection(
  userId: number,
  inspectionId: number,
  execution: ExecutionInfo,
): Promise<void> {
  await enqueue(userId, inspectionId, { type: 'COMPLETE', ...execution });
  await setLocalStatus(inspectionId, 'COMPLETED');
  emitLocalChange();
}

export async function reopenInspection(
  userId: number,
  inspectionId: number,
): Promise<void> {
  await enqueue(userId, inspectionId, { type: 'REOPEN' });
  await setLocalStatus(inspectionId, 'IN_PROGRESS');
  emitLocalChange();
}

export async function setQrValidated(inspectionId: number, validated: boolean): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    'UPDATE inspections SET qr_validated = ? WHERE id = ?',
    validated ? 1 : 0,
    inspectionId,
  );

  emitLocalChange();
}

/**
 * Salva a resposta localmente (salvamento automático) e agenda o envio.
 * Várias alterações do mesmo item viram uma única operação pendente.
 */
export async function saveAnswer(
  userId: number,
  inspectionId: number,
  item: TemplateItem,
  value: string,
  observation: string,
): Promise<void> {
  const db = await getDb();
  const cleanObservation = observation.trim() ? observation.trim() : null;
  const itemKey = `${inspectionId}:${item.id}`;

  await db.runAsync(
    `INSERT INTO answers (inspection_id, template_item_id, value, observation, server_answer_id, sync_state, last_error, updated_at)
     VALUES (?, ?, ?, ?, NULL, 'PENDING', NULL, ?)
     ON CONFLICT(inspection_id, template_item_id) DO UPDATE SET
       value = excluded.value,
       observation = excluded.observation,
       sync_state = 'PENDING',
       last_error = NULL,
       updated_at = excluded.updated_at`,
    inspectionId,
    item.id,
    value,
    cleanObservation,
    Date.now(),
  );

  const payload: SyncOperationRequest = {
    operationId: '',
    type: 'ANSWER',
    inspectionId,
    templateItemId: item.id,
    value,
    observation: cleanObservation,
  };

  // Reaproveita a operação ainda não enviada do mesmo item.
  const existing = await db.getFirstAsync<OutboxRow>(
    "SELECT * FROM outbox WHERE item_key = ? AND user_id = ? AND state IN ('PENDING', 'ERROR') ORDER BY seq DESC LIMIT 1",
    itemKey,
    userId,
  );

  if (existing) {
    await db.runAsync(
      "UPDATE outbox SET payload = ?, state = 'PENDING', attempts = 0, next_attempt_at = 0, last_error = NULL WHERE seq = ?",
      JSON.stringify({ ...payload, operationId: existing.operation_id }),
      existing.seq,
    );
  } else {
    const { operationId: _ignored, inspectionId: _id, ...rest } = payload;
    await enqueue(userId, inspectionId, rest, newId(), itemKey);
  }

  emitLocalChange();
}

export async function addAnswerEvidence(
  inspectionId: number,
  templateItemId: number,
  file: { uri: string; mimeType: string; fileName: string },
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `INSERT INTO evidences (local_id, inspection_id, template_item_id, nc_local_id, file_uri, mime_type, file_name, server_id, state, attempts, next_attempt_at, last_error, created_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, 'PENDING', 0, 0, NULL, ?)`,
    newId(),
    inspectionId,
    templateItemId,
    file.uri,
    file.mimeType,
    file.fileName,
    Date.now(),
  );

  emitLocalChange();
}

/**
 * Registra uma não conformidade (e suas fotos) vinculada à inspeção.
 */
export async function addNonConformity(
  userId: number,
  inspectionId: number,
  payload: NonConformityPayload,
  photos: { uri: string; mimeType: string; fileName: string }[],
): Promise<void> {
  const db = await getDb();
  const localId = newId();
  const now = Date.now();

  await db.runAsync(
    "INSERT INTO nonconformities (local_id, inspection_id, payload, server_id, state, created_at) VALUES (?, ?, ?, NULL, 'PENDING', ?)",
    localId,
    inspectionId,
    JSON.stringify(payload),
    now,
  );

  // O operationId da operação é o id local: o servidor grava-o como
  // clientOperationId, o que evita duplicidade e permite reconciliar.
  await enqueue(userId, inspectionId, { type: 'NONCONFORMITY', nonConformity: payload }, localId);

  for (const photo of photos) {
    await db.runAsync(
      `INSERT INTO evidences (local_id, inspection_id, template_item_id, nc_local_id, file_uri, mime_type, file_name, server_id, state, attempts, next_attempt_at, last_error, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, 'PENDING', 0, 0, NULL, ?)`,
      newId(),
      inspectionId,
      localId,
      photo.uri,
      photo.mimeType,
      photo.fileName,
      now,
    );
  }

  emitLocalChange();
}

/** Não conformidades de todas as inspeções do usuário (para a listagem). */
export async function listAllNonConformities(userId: number): Promise<{
  inspection: BackendInspection;
  local: LocalNonConformity[];
  server: ApiNonConformity[];
  localPhotos: Record<string, string[]>;
  checklistNonConform: { item: TemplateItem; sectionTitle: string; observation: string | null; updatedAt: number }[];
}[]> {
  const inspections = await listInspections(userId);
  const result = [];

  for (const local of inspections) {
    const detail = await getInspectionDetail(userId, local.data.id);

    if (!detail) continue;

    const localPhotos: Record<string, string[]> = {};

    detail.localEvidences.forEach((evidence) => {
      if (evidence.ncLocalId) {
        localPhotos[evidence.ncLocalId] = [
          ...(localPhotos[evidence.ncLocalId] ?? []),
          evidence.fileUri,
        ];
      }
    });

    const checklistNonConform = detail.sections.flatMap((group) =>
      group.items
        .filter((item) => detail.answers[item.id]?.value === 'NONCONFORM')
        .map((item) => ({
          item,
          sectionTitle: group.section.title,
          observation: detail.answers[item.id]?.observation ?? null,
          updatedAt: detail.answers[item.id]?.updatedAt ?? 0,
        })),
    );

    if (
      detail.localNonConformities.length === 0 &&
      detail.serverNonConformities.length === 0 &&
      checklistNonConform.length === 0
    ) {
      continue;
    }

    result.push({
      inspection: local.data,
      local: detail.localNonConformities,
      server: detail.serverNonConformities,
      localPhotos,
      checklistNonConform,
    });
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Outbox (usada pelo motor de sincronização)                          */
/* ------------------------------------------------------------------ */

export async function getReadyOperations(userId: number, now: number): Promise<OutboxEntry[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<OutboxRow>(
    "SELECT * FROM outbox WHERE user_id = ? AND state = 'PENDING' AND next_attempt_at <= ? ORDER BY seq",
    userId,
    now,
  );

  return rows.map(toOutbox);
}

export async function listOperations(userId: number): Promise<OutboxEntry[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<OutboxRow>(
    'SELECT * FROM outbox WHERE user_id = ? ORDER BY seq',
    userId,
  );

  return rows.map(toOutbox);
}

/** Há operações anteriores ou fotos ainda não confirmadas para a inspeção? */
export async function hasUnsyncedDependencies(
  inspectionId: number,
  beforeSeq: number,
): Promise<boolean> {
  const db = await getDb();

  const ops = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM outbox WHERE inspection_id = ? AND seq < ?',
    inspectionId,
    beforeSeq,
  );

  const evidences = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM evidences WHERE inspection_id = ? AND state <> 'SYNCED'",
    inspectionId,
  );

  return (ops?.total ?? 0) > 0 || (evidences?.total ?? 0) > 0;
}

export async function markSending(entries: OutboxEntry[]): Promise<void> {
  const db = await getDb();

  for (const entry of entries) {
    await db.runAsync("UPDATE outbox SET state = 'SENDING' WHERE seq = ?", entry.seq);
  }
}

/** Falha temporária (rede/servidor): volta para a fila com espera progressiva. */
export async function markRetry(
  entries: OutboxEntry[],
  error: string,
  countAttempt: boolean,
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  for (const entry of entries) {
    const attempts = entry.attempts + (countAttempt ? 1 : 0);

    await db.runAsync(
      "UPDATE outbox SET state = 'PENDING', attempts = ?, next_attempt_at = ?, last_error = ? WHERE seq = ?",
      attempts,
      countAttempt ? now + backoff(attempts) : 0,
      error,
      entry.seq,
    );
  }

  emitLocalChange('sync');
}

export function backoff(attempts: number): number {
  return Math.min(5000 * 2 ** Math.max(0, attempts - 1), 10 * 60 * 1000);
}

/** Aplica o resultado confirmado pelo servidor e remove a operação da fila. */
export async function applyOperationResult(
  entry: OutboxEntry,
  result: SyncOperationResult,
): Promise<void> {
  const db = await getDb();

  if (result.status === 'REJECTED') {
    await db.runAsync(
      "UPDATE outbox SET state = 'ERROR', attempts = attempts + 1, last_error = ? WHERE seq = ?",
      result.message ?? 'Operação rejeitada pelo servidor.',
      entry.seq,
    );

    if (entry.type === 'ANSWER' && entry.payload.templateItemId) {
      await db.runAsync(
        "UPDATE answers SET sync_state = 'ERROR', last_error = ? WHERE inspection_id = ? AND template_item_id = ?",
        result.message ?? null,
        entry.inspectionId,
        entry.payload.templateItemId,
      );
    }

    if (entry.type === 'NONCONFORMITY') {
      await db.runAsync(
        "UPDATE nonconformities SET state = 'ERROR' WHERE local_id = ?",
        entry.operationId,
      );
    }

    emitLocalChange('sync');
    return;
  }

  // APPLIED ou DUPLICATE: persistência confirmada pelo servidor.
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM outbox WHERE seq = ?', entry.seq);

    if (entry.type === 'ANSWER' && entry.payload.templateItemId) {
      const serverId = result.answer?.id ?? result.entityId ?? null;

      if (serverId !== null) {
        await db.runAsync(
          'UPDATE answers SET server_answer_id = ? WHERE inspection_id = ? AND template_item_id = ?',
          serverId,
          entry.inspectionId,
          entry.payload.templateItemId,
        );
      }

      const stillPending = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM outbox WHERE item_key = ?',
        entry.itemKey,
      );

      if ((stillPending?.total ?? 0) === 0) {
        await db.runAsync(
          "UPDATE answers SET sync_state = 'SYNCED', last_error = NULL WHERE inspection_id = ? AND template_item_id = ?",
          entry.inspectionId,
          entry.payload.templateItemId,
        );
      }
    }

    if (entry.type === 'NONCONFORMITY') {
      await db.runAsync(
        "UPDATE nonconformities SET server_id = ?, state = 'SYNCED' WHERE local_id = ?",
        result.nonConformity?.id ?? result.entityId ?? null,
        entry.operationId,
      );
    }

    if (result.inspection) {
      await db.runAsync(
        'UPDATE inspections SET data = ?, server_status = ?, server_updated_at = ? WHERE id = ?',
        JSON.stringify(result.inspection),
        result.inspection.status,
        result.inspection.updatedAt ?? null,
        entry.inspectionId,
      );
    }
  });

  await refreshLocalStatus(entry.inspectionId);

  emitLocalChange('sync');
}

/** Reenvia operações e fotos com erro (após o técnico corrigir a causa). */
export async function retryErrors(userId: number): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    "UPDATE outbox SET state = 'PENDING', next_attempt_at = 0 WHERE user_id = ? AND state = 'ERROR'",
    userId,
  );

  await db.runAsync(
    `UPDATE evidences SET state = 'PENDING', next_attempt_at = 0
      WHERE state = 'ERROR' AND inspection_id IN (SELECT id FROM inspections WHERE user_id = ?)`,
    userId,
  );

  emitLocalChange();
}

/** Ao recuperar a conexão, não espera o intervalo de nova tentativa. */
export async function resetBackoff(userId: number): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    "UPDATE outbox SET next_attempt_at = 0 WHERE user_id = ? AND state = 'PENDING'",
    userId,
  );

  await db.runAsync(
    `UPDATE evidences SET next_attempt_at = 0
      WHERE state = 'PENDING' AND inspection_id IN (SELECT id FROM inspections WHERE user_id = ?)`,
    userId,
  );
}

/**
 * Descarta uma operação rejeitada (decisão explícita do técnico na tela de
 * sincronização). A resposta local volta ao último valor confirmado.
 */
export async function discardOperation(userId: number, seq: number): Promise<void> {
  const db = await getDb();

  const row = await db.getFirstAsync<OutboxRow>(
    "SELECT * FROM outbox WHERE seq = ? AND user_id = ? AND state = 'ERROR'",
    seq,
    userId,
  );

  if (!row) return;

  const entry = toOutbox(row);

  await db.runAsync('DELETE FROM outbox WHERE seq = ?', seq);

  if (entry.type === 'ANSWER' && entry.payload.templateItemId) {
    await db.runAsync(
      "UPDATE answers SET sync_state = CASE WHEN server_answer_id IS NULL THEN 'ERROR' ELSE 'SYNCED' END WHERE inspection_id = ? AND template_item_id = ?",
      entry.inspectionId,
      entry.payload.templateItemId,
    );

    await db.runAsync(
      'DELETE FROM answers WHERE inspection_id = ? AND template_item_id = ? AND server_answer_id IS NULL',
      entry.inspectionId,
      entry.payload.templateItemId,
    );
  }

  if (entry.type === 'NONCONFORMITY') {
    await db.runAsync("UPDATE evidences SET state = 'ERROR', last_error = 'Não conformidade descartada.' WHERE nc_local_id = ?", entry.operationId);
    await db.runAsync('DELETE FROM nonconformities WHERE local_id = ? AND server_id IS NULL', entry.operationId);
  }

  await refreshLocalStatus(entry.inspectionId);

  emitLocalChange();
}

/* ------------------------------------------------------------------ */
/* Evidências (envio separado dos dados estruturados, RN-078)          */
/* ------------------------------------------------------------------ */

export type UploadableEvidence = LocalEvidence & {
  serverAnswerId: number | null;
  serverNonConformityId: number | null;
};

export async function getUploadableEvidences(
  userId: number,
  now: number,
): Promise<UploadableEvidence[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<EvidenceRow & {
    server_answer_id: number | null;
    nc_server_id: number | null;
  }>(
    `SELECT e.*, a.server_answer_id AS server_answer_id, n.server_id AS nc_server_id
       FROM evidences e
       JOIN inspections i ON i.id = e.inspection_id
       LEFT JOIN answers a ON a.inspection_id = e.inspection_id AND a.template_item_id = e.template_item_id
       LEFT JOIN nonconformities n ON n.local_id = e.nc_local_id
      WHERE i.user_id = ? AND e.state = 'PENDING' AND e.next_attempt_at <= ?
      ORDER BY e.created_at`,
    userId,
    now,
  );

  return rows
    .map((row) => ({
      ...toEvidence(row),
      serverAnswerId: row.template_item_id !== null ? row.server_answer_id : null,
      serverNonConformityId: row.nc_local_id !== null ? row.nc_server_id : null,
    }))
    // A foto só pode subir depois que a resposta / não conformidade existir
    // no servidor (dependência entre operações, RN-069).
    .filter((evidence) => evidence.serverAnswerId !== null || evidence.serverNonConformityId !== null);
}

export async function listProblemEvidences(userId: number): Promise<LocalEvidence[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<EvidenceRow>(
    `SELECT e.* FROM evidences e JOIN inspections i ON i.id = e.inspection_id
      WHERE i.user_id = ? AND e.state <> 'SYNCED' ORDER BY e.created_at`,
    userId,
  );

  return rows.map(toEvidence);
}

export async function markEvidence(
  localId: string,
  state: LocalEvidence['state'],
  options: { serverId?: number | null; error?: string | null; attempts?: number; nextAttemptAt?: number } = {},
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `UPDATE evidences SET
       state = ?,
       server_id = COALESCE(?, server_id),
       last_error = ?,
       attempts = COALESCE(?, attempts),
       next_attempt_at = COALESCE(?, next_attempt_at)
     WHERE local_id = ?`,
    state,
    options.serverId ?? null,
    options.error ?? null,
    options.attempts ?? null,
    options.nextAttemptAt ?? null,
    localId,
  );

  emitLocalChange('sync');
}

/** Remove uma foto que ainda não foi enviada (decisão explícita). */
export async function discardEvidence(localId: string): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    "DELETE FROM evidences WHERE local_id = ? AND state <> 'SYNCED'",
    localId,
  );

  emitLocalChange();
}
