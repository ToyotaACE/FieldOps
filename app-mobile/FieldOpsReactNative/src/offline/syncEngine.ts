import { AppState, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import {
  SESSION_INVALID,
  getInspectionPackage,
  getInspections,
  isNetworkError,
  refreshToken,
  sendSyncOperations,
  uploadAnswerEvidence,
  uploadNonConformityEvidence,
  type AuthUser,
} from '../services/api';

import { getMeta, setMeta } from './db';
import { emitLocalChange, onLocalChange } from './events';
import { fileExists } from './files';
import * as repo from './repository';

/*
|--------------------------------------------------------------------------
| MOTOR DE SINCRONIZAÇÃO
|--------------------------------------------------------------------------
| 1. Detecta a conexão (NetInfo) e sincroniza sozinho quando ela volta.
| 2. Envia a outbox em lotes, na ordem em que as ações aconteceram.
| 3. Envia as fotos separadamente, depois que a resposta/não conformidade
|    correspondente existe no servidor.
| 4. Só remove uma pendência depois da confirmação do servidor.
| 5. Baixa as inspeções atribuídas e as alterações feitas no servidor.
| 6. Repete com intervalo progressivo em caso de falha.
*/

export type SyncState =
  | 'SINCRONIZADO'
  | 'PENDENTE'
  | 'SINCRONIZANDO'
  | 'ERRO'
  | 'AGUARDANDO_CONEXAO';

export const SYNC_STATE_LABELS: Record<SyncState, string> = {
  SINCRONIZADO: 'Sincronizado',
  PENDENTE: 'Pendente',
  SINCRONIZANDO: 'Sincronizando',
  ERRO: 'Erro de sincronização',
  AGUARDANDO_CONEXAO: 'Aguardando conexão',
};

export type SyncSnapshot = {
  online: boolean;
  syncing: boolean;
  state: SyncState;
  pendingOperations: number;
  pendingEvidences: number;
  errors: number;
  lastSyncAt: string | null;
  lastAttemptAt: string | null;
  lastResult: 'OK' | 'PARCIAL' | 'FALHA' | 'SEM_CONEXAO' | null;
  lastMessage: string | null;
  dataVersion: number;
};

export function deriveSyncState(
  counts: repo.PendingCounts,
  online: boolean,
  syncing: boolean,
): SyncState {
  if (counts.errors > 0) return 'ERRO';

  const pending = counts.operations + counts.evidences;

  if (pending === 0) return 'SINCRONIZADO';
  if (!online) return 'AGUARDANDO_CONEXAO';
  if (syncing) return 'SINCRONIZANDO';

  return 'PENDENTE';
}

type Session = {
  token: string;
  user: AuthUser;
  issuedAt: number;
};

type Callbacks = {
  onSessionExpired: () => void;
  onTokenRefreshed: (token: string) => void;
};

const BATCH_SIZE = 50;
const MAX_ROUNDS = 10;
const PERIODIC_SYNC_MS = 60 * 1000;
const TOKEN_REFRESH_AFTER_MS = 60 * 60 * 1000;
const LOCAL_CHANGE_DEBOUNCE_MS = 1500;

class SyncEngine {
  private session: Session | null = null;
  private callbacks: Callbacks | null = null;
  private listeners = new Set<(snapshot: SyncSnapshot) => void>();
  private running: Promise<void> | null = null;
  private rerun = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: (() => void)[] = [];

  private snapshot: SyncSnapshot = {
    online: true,
    syncing: false,
    state: 'SINCRONIZADO',
    pendingOperations: 0,
    pendingEvidences: 0,
    errors: 0,
    lastSyncAt: null,
    lastAttemptAt: null,
    lastResult: null,
    lastMessage: null,
    dataVersion: 0,
  };

  /* ---------------------------- ciclo de vida ---------------------------- */

  async start(session: Session, callbacks: Callbacks): Promise<void> {
    this.stop();

    this.session = session;
    this.callbacks = callbacks;

    const [lastSyncAt, lastMessage] = await Promise.all([
      getMeta(`lastSyncAt:${session.user.id}`),
      getMeta(`lastSyncMessage:${session.user.id}`),
    ]);

    this.snapshot = { ...this.snapshot, lastSyncAt, lastMessage };

    const netState = await NetInfo.fetch();
    this.snapshot.online = isOnline(netState);

    this.unsubscribers.push(
      NetInfo.addEventListener((state) => this.handleNetwork(state)),
    );

    this.unsubscribers.push(
      onLocalChange((source) => {
        this.snapshot.dataVersion += 1;
        void this.refreshCounts();

        // Ações do técnico disparam o envio; gravações da própria
        // sincronização apenas atualizam as telas.
        if (source === 'user') this.schedule(LOCAL_CHANGE_DEBOUNCE_MS);
      }),
    );

    const appStateSubscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (status === 'active') this.schedule(0);
      },
    );

    this.unsubscribers.push(() => appStateSubscription.remove());

    this.interval = setInterval(() => {
      if (this.snapshot.pendingOperations + this.snapshot.pendingEvidences > 0) {
        void this.syncNow();
      }
    }, PERIODIC_SYNC_MS);

    await this.refreshCounts();

    void this.syncNow();
  }

  stop(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];

    if (this.timer) clearTimeout(this.timer);
    if (this.interval) clearInterval(this.interval);

    this.timer = null;
    this.interval = null;
    this.session = null;
  }

  updateToken(token: string): void {
    if (this.session) {
      this.session = { ...this.session, token, issuedAt: Date.now() };
    }
  }

  updateUser(user: AuthUser): void {
    if (this.session) {
      this.session = { ...this.session, user };
    }
  }

  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): SyncSnapshot {
    return this.snapshot;
  }

  /* ------------------------------- eventos ------------------------------- */

  private emit(): void {
    const counts = {
      operations: this.snapshot.pendingOperations,
      evidences: this.snapshot.pendingEvidences,
      errors: this.snapshot.errors,
    };

    this.snapshot = {
      ...this.snapshot,
      state: deriveSyncState(counts, this.snapshot.online, this.snapshot.syncing),
    };

    this.listeners.forEach((listener) => listener(this.snapshot));
  }

  private async refreshCounts(): Promise<void> {
    if (!this.session) return;

    try {
      const counts = await repo.getPendingSummary(this.session.user.id);

      this.snapshot = {
        ...this.snapshot,
        pendingOperations: counts.operations,
        pendingEvidences: counts.evidences,
        errors: counts.errors,
      };
    } catch (error) {
      console.error('Erro ao contar pendências:', error);
    }

    this.emit();
  }

  private handleNetwork(state: NetInfoState): void {
    const wasOnline = this.snapshot.online;
    const online = isOnline(state);

    this.snapshot = { ...this.snapshot, online };
    this.emit();

    // A conexão voltou: sincroniza imediatamente, sem esperar a próxima
    // tentativa programada.
    if (online && !wasOnline && this.session) {
      void repo.resetBackoff(this.session.user.id).then(() => this.syncNow());
    }
  }

  private schedule(delayMs: number): void {
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.syncNow();
    }, delayMs);
  }

  /* ---------------------------- sincronização ---------------------------- */

  syncNow(): Promise<void> {
    if (this.running) {
      this.rerun = true;
      return this.running;
    }

    this.running = this.run().finally(() => {
      this.running = null;

      if (this.rerun) {
        this.rerun = false;
        void this.syncNow();
      }
    });

    return this.running;
  }

  private async run(): Promise<void> {
    const session = this.session;

    if (!session) return;

    if (!this.snapshot.online) {
      this.snapshot = {
        ...this.snapshot,
        lastResult: 'SEM_CONEXAO',
        lastMessage: 'Sem conexão. As informações estão salvas no aparelho.',
      };
      await this.refreshCounts();
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      syncing: true,
      lastAttemptAt: new Date().toISOString(),
    };
    this.emit();

    try {
      await this.push(session);
      await this.pull(session);
      await this.maybeRefreshToken(session);

      const counts = await repo.getPendingSummary(session.user.id);
      const now = new Date().toISOString();

      const result = counts.errors > 0 ? 'PARCIAL' : 'OK';
      const message =
        counts.errors > 0
          ? `${counts.errors} item(ns) com erro. Veja a tela de sincronização.`
          : counts.operations + counts.evidences > 0
            ? 'Algumas pendências aguardam a próxima tentativa.'
            : 'Todas as informações foram confirmadas pelo servidor.';

      this.snapshot = {
        ...this.snapshot,
        lastSyncAt: now,
        lastResult: result,
        lastMessage: message,
      };

      await setMeta(`lastSyncAt:${session.user.id}`, now);
      await setMeta(`lastSyncMessage:${session.user.id}`, message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na sincronização.';

      if (message === SESSION_INVALID) {
        this.snapshot = {
          ...this.snapshot,
          lastResult: 'FALHA',
          lastMessage: 'Sessão expirada. Entre novamente; os dados locais foram preservados.',
        };

        this.callbacks?.onSessionExpired();
      } else if (isNetworkError(error)) {
        this.snapshot = {
          ...this.snapshot,
          lastResult: 'SEM_CONEXAO',
          lastMessage: 'Conexão perdida durante a sincronização. Será retomada automaticamente.',
        };
      } else {
        this.snapshot = { ...this.snapshot, lastResult: 'FALHA', lastMessage: message };
      }

      // Agenda nova tentativa (intervalo progressivo controlado pela fila).
      this.schedule(15000);
    } finally {
      this.snapshot = { ...this.snapshot, syncing: false };
      await this.refreshCounts();
      this.snapshot.dataVersion += 1;
      this.emit();
    }
  }

  /** Envia a outbox e as fotos, respeitando as dependências. */
  private async push(session: Session): Promise<void> {
    const userId = session.user.id;

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      let progressed = false;

      const ready = await repo.getReadyOperations(userId, Date.now());
      const batch: repo.OutboxEntry[] = [];
      const blocked = new Set<number>();

      for (const entry of ready) {
        if (batch.length >= BATCH_SIZE) break;

        if (blocked.has(entry.inspectionId)) continue;

        // A conclusão só segue depois que respostas, não conformidades e
        // fotos anteriores foram confirmadas (o servidor valida a conclusão).
        if (entry.type === 'COMPLETE') {
          const inBatch = batch.some((candidate) => candidate.inspectionId === entry.inspectionId);

          if (inBatch || (await repo.hasUnsyncedDependencies(entry.inspectionId, entry.seq))) {
            blocked.add(entry.inspectionId);
            continue;
          }
        }

        batch.push(entry);
      }

      if (batch.length > 0) {
        await repo.markSending(batch);

        let results;

        try {
          results = await sendSyncOperations(
            session.token,
            batch.map((entry) => ({ ...entry.payload, operationId: entry.operationId })),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha no envio.';
          const transient = message === SESSION_INVALID ? false : true;

          await repo.markRetry(batch, message, transient);
          throw error;
        }

        const byId = new Map(results.map((result) => [result.operationId, result]));

        for (const entry of batch) {
          const result = byId.get(entry.operationId);

          if (!result) {
            await repo.markRetry([entry], 'Sem confirmação do servidor.', true);
            continue;
          }

          await repo.applyOperationResult(entry, result);
        }

        progressed = true;
      }

      const uploaded = await this.uploadEvidences(session);

      if (uploaded > 0) progressed = true;

      if (!progressed) break;
    }
  }

  private async uploadEvidences(session: Session): Promise<number> {
    const evidences = await repo.getUploadableEvidences(session.user.id, Date.now());
    let uploaded = 0;

    for (const evidence of evidences) {
      if (!fileExists(evidence.fileUri)) {
        await repo.markEvidence(evidence.localId, 'ERROR', {
          error: 'O arquivo da foto não foi encontrado no aparelho.',
        });
        continue;
      }

      await repo.markEvidence(evidence.localId, 'UPLOADING');

      try {
        const file = {
          uri: evidence.fileUri,
          name: evidence.fileName,
          type: evidence.mimeType,
        };

        // operationId = id local da foto: reenviar não duplica (RN-068).
        const saved = evidence.serverAnswerId !== null
          ? await uploadAnswerEvidence(session.token, evidence.serverAnswerId, file, evidence.localId)
          : await uploadNonConformityEvidence(
              session.token,
              evidence.serverNonConformityId as number,
              file,
              evidence.localId,
            );

        await repo.markEvidence(evidence.localId, 'SYNCED', { serverId: saved.id, error: null });
        uploaded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha no envio da foto.';
        const status = (error as Error & { httpStatus?: number }).httpStatus;
        const attempts = evidence.attempts + 1;

        if (message === SESSION_INVALID || isNetworkError(error)) {
          await repo.markEvidence(evidence.localId, 'PENDING', {
            error: message === SESSION_INVALID ? 'Sessão expirada.' : message,
            attempts,
            nextAttemptAt: Date.now() + repo.backoff(attempts),
          });
          throw error;
        }

        if (status !== undefined && status >= 500) {
          await repo.markEvidence(evidence.localId, 'PENDING', {
            error: message,
            attempts,
            nextAttemptAt: Date.now() + repo.backoff(attempts),
          });
          continue;
        }

        // Rejeição definitiva (formato, tamanho, estado da inspeção...).
        await repo.markEvidence(evidence.localId, 'ERROR', { error: message, attempts });
      }
    }

    return uploaded;
  }

  /** Baixa as inspeções atribuídas e as alterações do servidor. */
  private async pull(session: Session): Promise<void> {
    const inspections = await getInspections(session.token);
    const needPackage = await repo.applyServerInspections(session.user.id, inspections);

    for (const inspectionId of needPackage) {
      const pkg = await getInspectionPackage(session.token, inspectionId);
      await repo.applyPackage(session.user.id, pkg);
    }
  }

  /** Atualiza um pacote específico (ex.: ao abrir a inspeção online). */
  async refreshInspection(inspectionId: number): Promise<void> {
    const session = this.session;

    if (!session || !this.snapshot.online) return;

    try {
      const pkg = await getInspectionPackage(session.token, inspectionId);
      await repo.applyPackage(session.user.id, pkg);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_INVALID) {
        this.callbacks?.onSessionExpired();
      }
    }
  }

  private async maybeRefreshToken(session: Session): Promise<void> {
    if (Date.now() - session.issuedAt < TOKEN_REFRESH_AFTER_MS) return;

    try {
      const token = await refreshToken(session.token);
      this.updateToken(token);
      this.callbacks?.onTokenRefreshed(token);
    } catch (error) {
      console.warn('Não foi possível renovar o token:', error);
    }
  }

  getToken(): string | null {
    return this.session?.token ?? null;
  }
}

function isOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

export const syncEngine = new SyncEngine();

/** Força a releitura das telas (ex.: depois de descartar uma pendência). */
export function notifyDataChanged(): void {
  emitLocalChange('sync');
}
