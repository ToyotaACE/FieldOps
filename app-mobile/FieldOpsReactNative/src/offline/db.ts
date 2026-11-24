import * as SQLite from 'expo-sqlite';

/*
|--------------------------------------------------------------------------
| BANCO LOCAL (SQLite)
|--------------------------------------------------------------------------
| Fonte local dos dados do técnico. Nada aqui é apagado antes de o servidor
| confirmar a persistência (RN-066 / RN-070).
|
| inspections     inspeções baixadas (JSON do backend) + status local
| checklists      seções e itens da versão exata do modelo da inspeção
| server_records  evidências e não conformidades já gravadas no servidor
| answers         respostas locais (fonte da tela) e id da resposta no servidor
| evidences       fotos locais (arquivo no dispositivo) e estado de envio
| nonconformities não conformidades criadas no aparelho
| outbox          fila de operações pendentes (UUID idempotente por operação)
| meta            chave/valor (última sincronização, caches de cadastros)
*/

const DB_NAME = 'fieldops.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open();
  }

  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );

  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY NOT NULL,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        server_status TEXT NOT NULL,
        local_status TEXT,
        server_updated_at TEXT,
        qr_validated INTEGER NOT NULL DEFAULT 0,
        downloaded_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checklists (
        inspection_id INTEGER PRIMARY KEY NOT NULL,
        sections TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS server_records (
        inspection_id INTEGER PRIMARY KEY NOT NULL,
        evidences TEXT NOT NULL,
        nonconformities TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS answers (
        inspection_id INTEGER NOT NULL,
        template_item_id INTEGER NOT NULL,
        value TEXT,
        observation TEXT,
        server_answer_id INTEGER,
        sync_state TEXT NOT NULL,
        last_error TEXT,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (inspection_id, template_item_id)
      );

      CREATE TABLE IF NOT EXISTS evidences (
        local_id TEXT PRIMARY KEY NOT NULL,
        inspection_id INTEGER NOT NULL,
        template_item_id INTEGER,
        nc_local_id TEXT,
        file_uri TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        server_id INTEGER,
        state TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nonconformities (
        local_id TEXT PRIMARY KEY NOT NULL,
        inspection_id INTEGER NOT NULL,
        payload TEXT NOT NULL,
        server_id INTEGER,
        state TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outbox (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        inspection_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        item_key TEXT,
        payload TEXT NOT NULL,
        state TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_state ON outbox (state, seq);
      CREATE INDEX IF NOT EXISTS idx_evidences_state ON evidences (state);
      CREATE INDEX IF NOT EXISTS idx_inspections_user ON inspections (user_id);
    `);
  }

  if (current < SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  // Recuperação de operações interrompidas: o envio é idempotente no
  // servidor, então operações que ficaram "enviando" voltam para a fila.
  await db.runAsync(
    "UPDATE outbox SET state = 'PENDING' WHERE state = 'SENDING'",
  );
  await db.runAsync(
    "UPDATE evidences SET state = 'PENDING' WHERE state = 'UPLOADING'",
  );

  return db;
}

/* ------------------------------------------------------------------ */
/* META (chave/valor)                                                 */
/* ------------------------------------------------------------------ */

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM meta WHERE key = ?',
    key,
  );

  return row?.value ?? null;
}

export async function setMeta(key: string, value: string | null): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function getCached<T>(key: string, fallback: T): Promise<T> {
  const raw = await getMeta(`cache:${key}`);

  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setCached(key: string, value: unknown): Promise<void> {
  await setMeta(`cache:${key}`, JSON.stringify(value));
}
