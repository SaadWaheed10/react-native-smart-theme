import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import {
  applyHighContrast,
  shouldAnimateTransitions,
  useReduceMotion,
  withColorBlindSafe,
} from '../accessibility';
import { createDefaultStorage } from '../storage/createStorage';
import type {
  ColorBlindVariant,
  ResolvedMode,
  Theme,
  ThemeMode,
  ThemeProviderProps,
} from '../types/theme';
import { ThemeContext } from './ThemeContext';
import { ThemeTransition } from './ThemeTransition';

const DEFAULT_STORAGE_KEY = '@rn-smart-theme/mode';

function resolveMode(
  mode: ThemeMode,
  system: 'light' | 'dark' | null | undefined,
  forced: ResolvedMode | null
): ResolvedMode {
  if (forced) return forced;
  if (mode === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({
  theme: themeProp,
  defaultMode = 'system',
  forcedMode = null,
  persist = true,
  storageKey = DEFAULT_STORAGE_KEY,
  storage: storageProp,
  highContrast: highContrastProp = false,
  colorBlindVariant: colorBlindProp = 'none',
  animateTransitions = false,
  transitionDuration = 300,
  respectReduceMotion = true,
  children,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const reduceMotion = useReduceMotion(respectReduceMotion);
  const storage = useMemo(
    () => storageProp ?? createDefaultStorage(),
    [storageProp]
  );

  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [forced, setForced] = useState<ResolvedMode | null>(forcedMode);
  const [highContrast, setHighContrast] = useState(highContrastProp);
  const [colorBlindVariant, setColorBlindVariant] =
    useState<ColorBlindVariant>(colorBlindProp);
  const [theme, setTheme] = useState<Theme>(themeProp);
  const hydrated = useRef(false);

  useEffect(() => {
    setTheme(themeProp);
  }, [themeProp]);

  useEffect(() => {
    setForced(forcedMode);
  }, [forcedMode]);

  useEffect(() => {
    setHighContrast(highContrastProp);
  }, [highContrastProp]);

  useEffect(() => {
    setColorBlindVariant(colorBlindProp);
  }, [colorBlindProp]);

  // Hydrate persisted mode
  useEffect(() => {
    if (!persist) {
      hydrated.current = true;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stored = await Promise.resolve(storage.getItem(storageKey));
        if (!cancelled && stored && isThemeMode(stored)) {
          setModeState(stored);
        }
      } catch {
        // ignore storage errors
      } finally {
        hydrated.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persist, storage, storageKey]);

  // Persist mode changes (after hydrate)
  useEffect(() => {
    if (!persist || !hydrated.current) return;
    Promise.resolve(storage.setItem(storageKey, mode)).catch(() => {
      // ignore
    });
  }, [mode, persist, storage, storageKey]);

  // Keep system mode reactive
  useEffect(() => {
    if (mode !== 'system') return;
    const sub = Appearance.addChangeListener(() => {
      setModeState((m) => m);
    });
    return () => sub.remove();
  }, [mode]);

  const resolvedMode = resolveMode(mode, systemScheme, forced);

  const activeTheme = useMemo(() => {
    let t = theme;
    if (highContrast) {
      t = applyHighContrast(t);
    }
    if (colorBlindVariant !== 'none') {
      t = withColorBlindSafe(t, colorBlindVariant);
    }
    return t;
  }, [theme, highContrast, colorBlindVariant]);

  const colors = resolvedMode === 'dark' ? activeTheme.dark : activeTheme.light;

  const animationsEnabled = shouldAnimateTransitions({
    animateTransitions,
    respectReduceMotion,
    reduceMotion,
  });

  const setMode = useCallback((next: ThemeMode) => {
    setForced(null);
    setModeState(next);
  }, []);

  const forceMode = useCallback((next: ResolvedMode | null) => {
    setForced(next);
  }, []);

  const toggleMode = useCallback(() => {
    setForced(null);
    setModeState((prev) => {
      const current = resolveMode(prev, Appearance.getColorScheme(), null);
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const exportThemeFn = useCallback(
    () => JSON.stringify(theme, null, 2),
    [theme]
  );

  const importThemeFn = useCallback((jsonOrTheme: string | Theme) => {
    const next =
      typeof jsonOrTheme === 'string'
        ? (JSON.parse(jsonOrTheme) as Theme)
        : jsonOrTheme;
    if (!next?.light || !next?.dark || !next?.seed) {
      throw new Error('Invalid theme payload');
    }
    setTheme(next);
  }, []);

  const value = useMemo(
    () => ({
      theme: activeTheme,
      colors,
      mode,
      resolvedMode,
      isDark: resolvedMode === 'dark',
      setMode,
      forceMode,
      toggleMode,
      highContrast,
      setHighContrast,
      colorBlindVariant,
      setColorBlindVariant,
      reduceMotion,
      animateTransitions: animationsEnabled,
      transitionDuration,
      metrics: activeTheme.metrics,
      exportTheme: exportThemeFn,
      importTheme: importThemeFn,
    }),
    [
      activeTheme,
      colors,
      mode,
      resolvedMode,
      setMode,
      forceMode,
      toggleMode,
      highContrast,
      colorBlindVariant,
      reduceMotion,
      animationsEnabled,
      transitionDuration,
      exportThemeFn,
      importThemeFn,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {animationsEnabled ? (
        <ThemeTransition>{children}</ThemeTransition>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}
