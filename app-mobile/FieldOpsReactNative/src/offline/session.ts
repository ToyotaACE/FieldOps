import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { AuthUser } from '../services/api';

/*
|--------------------------------------------------------------------------
| SESSÃO
|--------------------------------------------------------------------------
| O token fica no armazenamento seguro do sistema (Keychain / Keystore).
| Na Web (sem armazenamento seguro) usa-se o AsyncStorage.
| Credenciais nunca são gravadas; somente o token emitido pela API.
*/

const TOKEN_KEY = 'fieldops_token';
const USER_KEY = 'fieldops_user';
const ISSUED_KEY = 'fieldops_token_issued_at';

const useSecureStore = Platform.OS !== 'web';

async function secureGet(key: string): Promise<string | null> {
  if (useSecureStore) {
    const value = await SecureStore.getItemAsync(key);

    if (value !== null) return value;

    // Migração de versões antigas do aplicativo (AsyncStorage).
    const legacy = await AsyncStorage.getItem(key);

    if (legacy !== null) {
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
    }

    return legacy;
  }

  return AsyncStorage.getItem(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  }

  await AsyncStorage.removeItem(key);
}

export type StoredSession = {
  token: string;
  user: AuthUser;
  issuedAt: number;
};

export async function loadSession(): Promise<StoredSession | null> {
  const [token, rawUser, issued] = await Promise.all([
    secureGet(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
    AsyncStorage.getItem(ISSUED_KEY),
  ]);

  if (!token || !rawUser) return null;

  try {
    return {
      token,
      user: JSON.parse(rawUser) as AuthUser,
      issuedAt: issued ? Number(issued) : 0,
    };
  } catch {
    return null;
  }
}

export async function saveSession(token: string, user: AuthUser): Promise<void> {
  await secureSet(TOKEN_KEY, token);
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(user)],
    [ISSUED_KEY, String(Date.now())],
  ]);
}

export async function saveUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await secureDelete(TOKEN_KEY);
  await AsyncStorage.multiRemove([USER_KEY, ISSUED_KEY]);
}
