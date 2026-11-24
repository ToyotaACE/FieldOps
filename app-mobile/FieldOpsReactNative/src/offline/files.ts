import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

/*
|--------------------------------------------------------------------------
| ARQUIVOS DE EVIDÊNCIA
|--------------------------------------------------------------------------
| As fotos são copiadas para o diretório de documentos do aplicativo, que
| não é limpo pelo sistema como o cache (RN-047). O SQLite guarda somente a
| referência (URI) ao arquivo.
*/

export function newId(): string {
  return Crypto.randomUUID();
}

function evidenceDirectory(): Directory {
  const directory = new Directory(Paths.document, 'evidences');

  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  return directory;
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export function normalizeMime(mimeType?: string | null): string {
  const value = (mimeType || '').toLowerCase();

  return ['image/jpeg', 'image/png', 'image/webp'].includes(value)
    ? value
    : 'image/jpeg';
}

/**
 * Copia a foto capturada para o armazenamento permanente do aplicativo e
 * devolve a nova URI. Na Web a URI original é mantida.
 */
export async function persistPhoto(
  sourceUri: string,
  mimeType?: string | null,
): Promise<{ uri: string; mimeType: string; fileName: string }> {
  const mime = normalizeMime(mimeType);
  const fileName = `evidencia-${newId()}.${extensionFor(mime)}`;

  if (Platform.OS === 'web') {
    return { uri: sourceUri, mimeType: mime, fileName };
  }

  const source = new File(sourceUri);
  const destination = new File(evidenceDirectory(), fileName);

  await source.copy(destination);

  return { uri: destination.uri, mimeType: mime, fileName };
}

export function fileExists(uri: string): boolean {
  if (Platform.OS === 'web') return true;

  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
