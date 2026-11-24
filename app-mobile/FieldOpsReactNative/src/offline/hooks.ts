import { useEffect, useState } from 'react';

import { syncEngine, type SyncSnapshot } from './syncEngine';

/** Estado global da sincronização (atualiza a tela a cada mudança). */
export function useSyncStatus(): SyncSnapshot {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>(syncEngine.getSnapshot());

  useEffect(() => syncEngine.subscribe(setSnapshot), []);

  return snapshot;
}

/**
 * Carrega dados locais e recarrega sempre que o SQLite mudar.
 */
export function useLocalQuery<T>(
  loader: () => Promise<T>,
  fallback: T,
  deps: unknown[],
): { data: T; loading: boolean; reload: () => void } {
  const { dataVersion } = useSyncStatus();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(0);

  useEffect(() => {
    let active = true;

    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => console.error('Erro ao ler dados locais:', error))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, manual, ...deps]);

  return { data, loading, reload: () => setManual((value) => value + 1) };
}
