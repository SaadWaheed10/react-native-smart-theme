import type {
  ColorTokens,
  CreateThemeOptions,
  HexColor,
  Theme,
  ThemeMetrics,
} from '../types/theme';
import {
  hexToHsl,
  hslToHex,
  normalizeHex,
  setLightness,
  withAlpha,
} from '../utils/color';
import { ensureContrast, getAdaptiveColor } from '../utils/contrast';
import { createTheme } from './createTheme';

const DEFAULT_METRICS: ThemeMetrics = {
  radius: { sm: 8, md: 12, lg: 16, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
};

/**
 * Material Design 3–style tonal step from a seed.
 * Tone 0 = black, 100 = white (approximate via HSL lightness).
 */
export function materialTone(seed: HexColor, tone: number): HexColor {
  const t = Math.max(0, Math.min(100, tone)) / 100;
  const hsl = hexToHsl(seed);
  // Preserve hue; ease saturation toward extremes
  const s =
    t < 0.08 || t > 0.94
      ? hsl.s * 0.15
      : hsl.s * (0.55 + 0.45 * (1 - Math.abs(t - 0.5) * 2));
  return hslToHex({ h: hsl.h, s, l: t });
}

function md3Palette(seed: HexColor, mode: 'light' | 'dark', minContrast: number): ColorTokens {
  const forDark = mode === 'dark';
  const primary = materialTone(seed, forDark ? 80 : 40);
  const secondarySeed = hslToHex({
    ...hexToHsl(seed),
    h: hexToHsl(seed).h + 60,
  });
  const secondary = materialTone(secondarySeed, forDark ? 80 : 40);
  const background = materialTone(seed, forDark ? 6 : 99);
  const surface = materialTone(seed, forDark ? 10 : 98);
  const surfaceElevated = materialTone(seed, forDark ? 14 : 96);

  const primaryContainer = materialTone(seed, forDark ? 30 : 90);
  const secondaryContainer = materialTone(secondarySeed, forDark ? 30 : 90);

  const errorSeed = '#B3261E';
  const error = materialTone(errorSeed, forDark ? 80 : 40);
  const success = materialTone('#2E7D32', forDark ? 80 : 40);
  const warning = materialTone('#E65100', forDark ? 80 : 40);
  const info = materialTone('#0277BD', forDark ? 80 : 40);

  const on = (bg: HexColor) =>
    getAdaptiveColor(bg, { minRatio: minContrast });

  const text = ensureContrast(
    materialTone(seed, forDark ? 90 : 10),
    background,
    minContrast
  );

  return {
    background,
    surface,
    surfaceElevated,
    primary,
    onPrimary: on(primary),
    primaryContainer,
    onPrimaryContainer: on(primaryContainer),
    secondary,
    onSecondary: on(secondary),
    secondaryContainer,
    onSecondaryContainer: on(secondaryContainer),
    text,
    textSecondary: ensureContrast(
      materialTone(seed, forDark ? 70 : 30),
      background,
      3
    ),
    textMuted: ensureContrast(
      materialTone(seed, forDark ? 55 : 45),
      background,
      3
    ),
    textInverse: materialTone(seed, forDark ? 10 : 90),
    border: materialTone(seed, forDark ? 30 : 80),
    borderSubtle: materialTone(seed, forDark ? 20 : 90),
    error,
    onError: on(error),
    errorContainer: materialTone(errorSeed, forDark ? 30 : 90),
    success,
    onSuccess: on(success),
    successContainer: materialTone('#2E7D32', forDark ? 30 : 90),
    warning,
    onWarning: on(warning),
    warningContainer: materialTone('#E65100', forDark ? 30 : 90),
    info,
    onInfo: on(info),
    infoContainer: materialTone('#0277BD', forDark ? 30 : 90),
    overlay: withAlpha('#000000', forDark ? 0.6 : 0.45),
    focus: primary,
    ripple: withAlpha(primary, forDark ? 0.24 : 0.16),
  };
}

export interface MaterialYouOptions
  extends Omit<CreateThemeOptions, 'primary' | 'secondary'> {
  /** Seed / brand / wallpaper color */
  primary: HexColor;
  /**
   * When true, use full MD3 tonal role mapping.
   * When false, fall back to standard `createTheme`.
   * @default true
   */
  tonal?: boolean;
}

/**
 * Material You–style theme: MD3 tonal palettes from one seed.
 * Pure JS — works on iOS, Android, and Expo (no native module required).
 *
 * On Android 12+ you can pass the system accent from
 * `getAndroidDynamicSeed()` when available.
 *
 * @example
 * ```ts
 * const theme = createMaterialYouTheme({ primary: '#6750A4' });
 * ```
 */
export function createMaterialYouTheme(options: MaterialYouOptions): Theme {
  const {
    primary: primaryInput,
    tonal = true,
    lightOverrides,
    darkOverrides,
    metrics,
    name,
    minContrast = 4.5,
  } = options;

  const primary = normalizeHex(primaryInput);

  if (!tonal) {
    return createTheme({
      ...options,
      primary,
      name: name ?? `material-you-${primary.slice(1).toLowerCase()}`,
    });
  }

  const light = {
    ...md3Palette(primary, 'light', minContrast),
    ...lightOverrides,
  };
  const dark = {
    ...md3Palette(primary, 'dark', minContrast),
    ...darkOverrides,
  };

  return {
    seed: primary,
    light,
    dark,
    metrics: {
      radius: { ...DEFAULT_METRICS.radius, ...metrics?.radius },
      spacing: { ...DEFAULT_METRICS.spacing, ...metrics?.spacing },
    },
    meta: {
      name: name ?? `material-you-${primary.slice(1).toLowerCase()}`,
      version: 1,
    },
  };
}

/**
 * Attempt to read an Android 12+ dynamic / Material You seed color
 * from an optional native module.
 *
 * Supported bridges (first match wins):
 * - `react-native-material-you-colors`
 * - `NativeModules.RNMaterialYou` / `MaterialYou`
 *
 * Returns `null` on iOS / older Android / when no bridge is installed.
 */
export async function getAndroidDynamicSeed(): Promise<HexColor | null> {
  try {
    // Lazy require so createMaterialYouTheme stays pure-JS / Node-safe
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform, NativeModules } = require('react-native');
    if (Platform.OS !== 'android') return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-material-you-colors');
      const getColors =
        mod.getMaterialYouColors ??
        mod.default?.getMaterialYouColors ??
        mod.getColors;
      if (typeof getColors === 'function') {
        const result = await getColors();
        const seed =
          result?.system_accent1?.[8] ??
          result?.accent1?.[8] ??
          result?.primary ??
          result?.accent;
        if (typeof seed === 'string') return normalizeHex(seed);
      }
    } catch {
      // optional peer missing
    }

    const bridge =
      NativeModules?.RNMaterialYou ?? NativeModules?.MaterialYou ?? null;
    if (bridge?.getAccentColor) {
      const accent = await bridge.getAccentColor();
      if (typeof accent === 'string') return normalizeHex(accent);
    }
    if (bridge?.getPrimaryColor) {
      const primary = await bridge.getPrimaryColor();
      if (typeof primary === 'string') return normalizeHex(primary);
    }
  } catch {
    // react-native unavailable (e.g. unit tests in Node)
  }

  return null;
}

/**
 * Build a Material You theme from the Android system accent when possible,
 * otherwise from the provided fallback seed.
 */
export async function createSystemMaterialYouTheme(
  fallbackPrimary: HexColor,
  options: Omit<MaterialYouOptions, 'primary'> = {}
): Promise<{ theme: Theme; fromSystem: boolean; seed: HexColor }> {
  const system = await getAndroidDynamicSeed();
  const seed = system ?? normalizeHex(fallbackPrimary);
  return {
    theme: createMaterialYouTheme({ ...options, primary: seed }),
    fromSystem: system != null,
    seed,
  };
}

/** @deprecated internal alias */
export function toneColor(seed: HexColor, lightness: number): HexColor {
  return setLightness(seed, lightness);
}
