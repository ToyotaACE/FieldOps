import * as Location from 'expo-location';

import type { ExecutionInfo } from './repository';

/*
|--------------------------------------------------------------------------
| LOCALIZAÇÃO NO INÍCIO E NA CONCLUSÃO (RN-058 a RN-062)
|--------------------------------------------------------------------------
| Coleta pontual, somente com permissão. Sem permissão, ou sem sinal de
| GPS, a inspeção continua normalmente sem localização.
*/

const LOCATION_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export type CapturedExecution = {
  execution: ExecutionInfo;
  locationStatus: 'OK' | 'NEGADA' | 'INDISPONIVEL';
};

export async function captureExecution(): Promise<CapturedExecution> {
  const execution: ExecutionInfo = {
    deviceTime: new Date().toISOString(),
  };

  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return { execution, locationStatus: 'NEGADA' };
    }

    const position =
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATION_TIMEOUT_MS,
      )) ?? (await Location.getLastKnownPositionAsync());

    if (!position) {
      return { execution, locationStatus: 'INDISPONIVEL' };
    }

    return {
      execution: {
        ...execution,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        locationTime: new Date(position.timestamp).toISOString(),
      },
      locationStatus: 'OK',
    };
  } catch {
    return { execution, locationStatus: 'INDISPONIVEL' };
  }
}
