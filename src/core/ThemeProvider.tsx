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
import { ensureAccessiblePalette } from '../smart/adaptPalette';
import { askSmartAdaptDefault } from '../smart/askSmartAdapt';
import { createDefaultStorage } from '../storage/createStorage';
import type {
  ColorBlindVariant,
  ModeChangeOptions,
  ResolvedMode,
  SmartAdaptChoice,
  SmartAdaptPolicy,
  Theme,
  ThemeMode,
  ThemeProviderProps,
} from '../types/theme';
import { normalizeModeOptions } from '../utils/modeOptions';
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

function smartAdaptStorageKey(modeKey: string): string {
  return `${modeKey}:smartAdapt`;
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
  smartAdapt: smartAdaptPolicy = false,
  smartAdaptDefault = false,
  persistSmartAdapt = true,
  smartAdaptMinContrast = 4.5,
  onSmartAdaptAsk,
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
  const [smartAdaptActive, setSmartAdaptActive] = useState(
    smartAdaptPolicy === true ? true : smartAdaptDefault
  );
  const [isHydrated, setIsHydrated] = useState(!persist);

  const hydrated = useRef(!persist);
  const userTouchedMode = useRef(false);
  const askInFlight = useRef(false);

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

  useEffect(() => {
    if (smartAdaptPolicy === true) setSmartAdaptActive(true);
    if (smartAdaptPolicy === false) setSmartAdaptActive(false);
  }, [smartAdaptPolicy]);

  // Hydrate persisted mode + smartAdapt choice (never clobber user taps)
  useEffect(() => {
    if (!persist) {
      hydrated.current = true;
      setIsHydrated(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stored = await Promise.resolve(storage.getItem(storageKey));
        if (
          !cancelled &&
          !userTouchedMode.current &&
          stored &&
          isThemeMode(stored)
        ) {
          setModeState(stored);
        }

        if (persistSmartAdapt && smartAdaptPolicy === 'ask') {
          const sa = await Promise.resolve(
            storage.getItem(smartAdaptStorageKey(storageKey))
          );
          if (!cancelled && !userTouchedMode.current) {
            if (sa === '1') setSmartAdaptActive(true);
            if (sa === '0') setSmartAdaptActive(false);
          }
        }
      } catch {
        // ignore storage errors — stay on defaults
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persist, persistSmartAdapt, smartAdaptPolicy, storage, storageKey]);

  // Persist mode (after hydrate)
  useEffect(() => {
    if (!persist || !hydrated.current) return;
    Promise.resolve(storage.setItem(storageKey, mode)).catch(() => {
      // ignore
    });
  }, [mode, persist, storage, storageKey]);

  // Persist smartAdapt only when the user can choose / force it on
  useEffect(() => {
    if (!persist || !persistSmartAdapt || !hydrated.current) return;
    if (smartAdaptPolicy !== 'ask' && smartAdaptPolicy !== true) return;

    Promise.resolve(
      storage.setItem(
        smartAdaptStorageKey(storageKey),
        smartAdaptActive ? '1' : '0'
      )
    ).catch(() => {
      // ignore
    });
  }, [
    smartAdaptActive,
    persist,
    persistSmartAdapt,
    smartAdaptPolicy,
    storage,
    storageKey,
  ]);

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

  const rawColors =
    resolvedMode === 'dark' ? activeTheme.dark : activeTheme.light;

  const colors = useMemo(() => {
    if (!smartAdaptActive) return rawColors;
    return ensureAccessiblePalette(rawColors, {
      minContrast: smartAdaptMinContrast,
      logFixes: false,
    });
  }, [rawColors, smartAdaptActive, smartAdaptMinContrast]);

  const animationsEnabled = shouldAnimateTransitions({
    animateTransitions,
    respectReduceMotion,
    reduceMotion,
  });

  const resolveAsk = useCallback(async (): Promise<SmartAdaptChoice> => {
    if (askInFlight.current) return 'cancel';
    askInFlight.current = true;
    try {
      const result = onSmartAdaptAsk
        ? await Promise.resolve(onSmartAdaptAsk())
        : await askSmartAdaptDefault();
      if (
        result === 'overall' ||
        result === 'theme-only' ||
        result === 'cancel'
      ) {
        return result;
      }
      return 'cancel';
    } catch {
      return 'cancel';
    } finally {
      askInFlight.current = false;
    }
  }, [onSmartAdaptAsk]);

  const resolveSmartAdaptForChange = useCallback(
    async (options?: ModeChangeOptions): Promise<boolean | null> => {
      const override = options?.smartAdapt;
      const shouldAsk =
        override === 'ask' ||
        (override === undefined && smartAdaptPolicy === 'ask');

      if (shouldAsk) {
        const choice = await resolveAsk();
        if (choice === 'cancel') return null;
        return choice === 'overall';
      }

      if (typeof override === 'boolean') return override;
      if (smartAdaptPolicy === true) return true;
      if (smartAdaptPolicy === false) return false;
      return smartAdaptActive;
    },
    [resolveAsk, smartAdaptActive, smartAdaptPolicy]
  );

  const applyModeChange = useCallback(
    (nextMode: ThemeMode, nextSmartAdapt: boolean) => {
      userTouchedMode.current = true;
      setForced(null);
      setSmartAdaptActive(nextSmartAdapt);
      setModeState(nextMode);
    },
    []
  );

  const setMode = useCallback(
    async (next: ThemeMode, options?: ModeChangeOptions | unknown) => {
      if (!isThemeMode(next)) return;
      const opts = normalizeModeOptions(options);
      const sa = await resolveSmartAdaptForChange(opts);
      if (sa === null) return;
      applyModeChange(next, sa);
    },
    [applyModeChange, resolveSmartAdaptForChange]
  );

  const forceMode = useCallback((next: ResolvedMode | null) => {
    userTouchedMode.current = true;
    setForced(next);
  }, []);

  const toggleMode = useCallback(
    async (options?: ModeChangeOptions | unknown) => {
      const opts = normalizeModeOptions(options);
      const sa = await resolveSmartAdaptForChange(opts);
      if (sa === null) return;

      const current = resolveMode(mode, Appearance.getColorScheme(), forced);
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      applyModeChange(next, sa);
    },
    [applyModeChange, forced, mode, resolveSmartAdaptForChange]
  );

  const setSmartAdapt = useCallback((enabled: boolean) => {
    userTouchedMode.current = true;
    setSmartAdaptActive(Boolean(enabled));
  }, []);

  const exportThemeFn = useCallback(
    () => JSON.stringify(theme, null, 2),
    [theme]
  );

  const importThemeFn = useCallback((jsonOrTheme: string | Theme) => {
    try {
      const next =
        typeof jsonOrTheme === 'string'
          ? (JSON.parse(jsonOrTheme) as Theme)
          : jsonOrTheme;
      if (!next?.light || !next?.dark || !next?.seed) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(
            '[ThemeProvider] importTheme: invalid theme (need seed, light, dark)'
          );
        }
        return;
      }
      setTheme(next);
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[ThemeProvider] importTheme failed:', err);
      }
    }
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
      smartAdapt: smartAdaptActive,
      smartAdaptPolicy: smartAdaptPolicy as SmartAdaptPolicy,
      setSmartAdapt,
      isHydrated,
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
      smartAdaptActive,
      smartAdaptPolicy,
      setSmartAdapt,
      isHydrated,
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
