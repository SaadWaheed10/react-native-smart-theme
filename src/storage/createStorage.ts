import type { ThemeStorage } from '../types/theme';
import { optionalRequire } from '../utils/optionalRequire';

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
 * Try react-native-mmkv → AsyncStorage → memory.
 * Never throws if optional peers are missing.
 */
export function createDefaultStorage(): ThemeStorage {
  const mmkvMod = optionalRequire<{
    MMKV: new (opts: { id: string }) => {
      getString: (k: string) => string | undefined;
      set: (k: string, v: string) => void;
      delete: (k: string) => void;
    };
  }>('react-native-mmkv');

  if (mmkvMod?.MMKV) {
    try {
      const mmkv = new mmkvMod.MMKV({ id: 'react-native-smart-theme' });
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
      // MMKV native module not linked
    }
  }

  const asyncMod = optionalRequire<{
    default: {
      getItem: (k: string) => Promise<string | null>;
      setItem: (k: string, v: string) => Promise<void>;
      removeItem: (k: string) => Promise<void>;
    };
  }>('@react-native-async-storage/async-storage');

  const AsyncStorage = asyncMod?.default;
  if (AsyncStorage?.getItem) {
    return {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    };
  }

  return memoryStorage;
}
