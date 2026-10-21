import type { ThemeStorage } from '../types/theme';

const memory = new Map<string, string>();

/** In-memory fallback when MMKV / AsyncStorage are unavailable */
export const memoryStorage: ThemeStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

/**
 * Try to use react-native-mmkv, then AsyncStorage, then memory.
 * Pure optional requires — never crashes if natives are missing.
 */
export function createDefaultStorage(): ThemeStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV({ id: 'react-native-smart-theme' });
    return {
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, value) => {
        mmkv.set(key, value);
      },
      removeItem: (key) => {
        mmkv.delete(key);
      },
    };
  } catch {
    // MMKV not installed
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    return {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    };
  } catch {
    // AsyncStorage not installed
  }

  return memoryStorage;
}
