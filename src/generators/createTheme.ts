import type {
  ColorTokens,
  CreateThemeOptions,
  HexColor,
  Theme,
  ThemeMetrics,
} from '../types/theme';
import {
  darken,
  hexToHsl,
  hslToHex,
  lighten,
  normalizeHex,
  rotateHue,
  setLightness,
  setSaturation,
  withAlpha,
} from '../utils/color';
import { ensureContrast, getAdaptiveColor, getContrastRatio } from '../utils/contrast';

const DEFAULT_METRICS: ThemeMetrics = {
  radius: { sm: 6, md: 12, lg: 16, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
};

const WHITE = '#FFFFFF';
const BLACK = '#000000';

function mergeMetrics(partial?: Partial<ThemeMetrics>): ThemeMetrics {
  if (!partial) return DEFAULT_METRICS;
  return {
    radius: { ...DEFAULT_METRICS.radius, ...partial.radius },
    spacing: { ...DEFAULT_METRICS.spacing, ...partial.spacing },
  };
}

/** Derive a harmonious secondary from primary (complementary-adjacent) */
function deriveSecondary(primary: HexColor): HexColor {
  const hsl = hexToHsl(primary);
  // Analogous-complement: +150° with moderated saturation
  return hslToHex({
    h: hsl.h + 150,
    s: Math.min(0.55, hsl.s * 0.85),
    l: Math.min(0.55, Math.max(0.35, hsl.l)),
  });
}

/**
 * Build a role color that keeps hue, hits a target lightness,
 * and guarantees contrast against `onRole` background pairing.
 */
function roleColor(
  seed: HexColor,
  lightness: number,
  saturation?: number
): HexColor {
  const hsl = hexToHsl(seed);
  return hslToHex({
    h: hsl.h,
    s: saturation ?? Math.min(0.75, Math.max(0.35, hsl.s)),
    l: lightness,
  });
}

function containerOf(seed: HexColor, forDark: boolean): HexColor {
  if (forDark) {
    return setLightness(setSaturation(seed, 0.4), 0.22);
  }
  return setLightness(setSaturation(seed, 0.5), 0.92);
}

function onContainer(container: HexColor, seed: HexColor, minContrast: number): HexColor {
  // Prefer a deepened seed hue; fall back to adaptive B/W
  const preferred = setLightness(seed, relativePrefersDark(container) ? 0.88 : 0.22);
  const ensured = ensureContrast(preferred, container, minContrast);
  if (getContrastRatio(ensured, container) >= minContrast) return ensured;
  return getAdaptiveColor(container, { minRatio: minContrast });
}

function relativePrefersDark(bg: HexColor): boolean {
  return hexToHsl(bg).l < 0.45;
}

function onSolid(solid: HexColor, minContrast: number): HexColor {
  return getAdaptiveColor(solid, {
    lightColor: WHITE,
    darkColor: BLACK,
    minRatio: minContrast,
  });
}

function statusHue(base: HexColor, targetHue: number, forDark: boolean): HexColor {
  const hsl = hexToHsl(base);
  return hslToHex({
    h: targetHue,
    s: Math.max(0.55, hsl.s * 0.7),
    l: forDark ? 0.62 : 0.42,
  });
}

function buildPalette(
  primarySeed: HexColor,
  secondarySeed: HexColor,
  mode: 'light' | 'dark',
  minContrast: number
): ColorTokens {
  const forDark = mode === 'dark';

  const background = forDark
    ? setLightness(setSaturation(primarySeed, 0.12), 0.08)
    : setLightness(setSaturation(primarySeed, 0.08), 0.98);

  const surface = forDark
    ? setLightness(setSaturation(primarySeed, 0.14), 0.12)
    : WHITE;

  const surfaceElevated = forDark
    ? setLightness(setSaturation(primarySeed, 0.16), 0.16)
    : lighten(setSaturation(primarySeed, 0.06), 0.02);

  // Primary: keep brand recognizable; nudge lightness per mode
  const primary = forDark
    ? setLightness(primarySeed, Math.max(0.55, hexToHsl(primarySeed).l))
    : setLightness(primarySeed, Math.min(0.48, hexToHsl(primarySeed).l));

  const onPrimary = onSolid(primary, minContrast);
  const primaryContainer = containerOf(primarySeed, forDark);
  const onPrimaryContainer = onContainer(primaryContainer, primarySeed, minContrast);

  const secondary = forDark
    ? setLightness(secondarySeed, 0.65)
    : setLightness(secondarySeed, 0.4);
  const onSecondary = onSolid(secondary, minContrast);
  const secondaryContainer = containerOf(secondarySeed, forDark);
  const onSecondaryContainer = onContainer(
    secondaryContainer,
    secondarySeed,
    minContrast
  );

  const text = ensureContrast(
    forDark ? '#F5F5F7' : '#121212',
    background,
    minContrast
  );
  const textSecondary = ensureContrast(
    forDark ? '#C4C4CC' : '#5C5C66',
    background,
    Math.min(minContrast, 4.5)
  );
  const textMuted = ensureContrast(
    forDark ? '#8E8E98' : '#8A8A96',
    background,
    3 // AA large / UI chrome
  );
  const textInverse = forDark ? '#121212' : '#F5F5F7';

  const border = forDark
    ? setLightness(setSaturation(primarySeed, 0.1), 0.28)
    : setLightness(setSaturation(primarySeed, 0.06), 0.86);
  const borderSubtle = forDark
    ? setLightness(setSaturation(primarySeed, 0.08), 0.2)
    : setLightness(setSaturation(primarySeed, 0.04), 0.92);

  const error = statusHue(primarySeed, 4, forDark);
  const success = statusHue(primarySeed, 145, forDark);
  const warning = statusHue(primarySeed, 38, forDark);
  const info = statusHue(rotateHue(primarySeed, 200), 210, forDark);

  const errorContainer = containerOf(error, forDark);
  const successContainer = containerOf(success, forDark);
  const warningContainer = containerOf(warning, forDark);
  const infoContainer = containerOf(info, forDark);

  return {
    background,
    surface,
    surfaceElevated,
    primary,
    onPrimary,
    primaryContainer,
    onPrimaryContainer,
    secondary,
    onSecondary,
    secondaryContainer,
    onSecondaryContainer,
    text,
    textSecondary,
    textMuted,
    textInverse,
    border,
    borderSubtle,
    error,
    onError: onSolid(error, minContrast),
    errorContainer,
    success,
    onSuccess: onSolid(success, minContrast),
    successContainer,
    warning,
    onWarning: onSolid(warning, minContrast),
    warningContainer,
    info,
    onInfo: onSolid(info, minContrast),
    infoContainer,
    overlay: withAlpha(BLACK, forDark ? 0.6 : 0.45),
    focus: primary,
    ripple: withAlpha(primary, forDark ? 0.24 : 0.16),
  };
}

/**
 * One-seed theme generator.
 *
 * Provide a single brand/primary color and get a complete, accessible
 * light + dark palette (WCAG AA by default).
 *
 * @example
 * ```ts
 * const theme = createTheme({ primary: '#6750A4' });
 * ```
 */
export function createTheme(options: CreateThemeOptions): Theme {
  const {
    primary: primaryInput,
    secondary: secondaryInput,
    lightOverrides,
    darkOverrides,
    metrics,
    name,
    minContrast = 4.5,
  } = options;

  const primary = normalizeHex(primaryInput);
  const secondary = secondaryInput
    ? normalizeHex(secondaryInput)
    : deriveSecondary(primary);

  const light = {
    ...buildPalette(primary, secondary, 'light', minContrast),
    ...lightOverrides,
  };

  const dark = {
    ...buildPalette(primary, secondary, 'dark', minContrast),
    ...darkOverrides,
  };

  // Re-assert critical pairs after overrides
  const finalize = (t: ColorTokens): ColorTokens => ({
    ...t,
    onPrimary: ensureContrast(t.onPrimary ?? onSolid(t.primary, minContrast), t.primary, minContrast),
    text: ensureContrast(t.text, t.background, minContrast),
    onError: ensureContrast(t.onError, t.error, minContrast),
    onSuccess: ensureContrast(t.onSuccess, t.success, minContrast),
  });

  return {
    seed: primary,
    light: finalize(light),
    dark: finalize(dark),
    metrics: mergeMetrics(metrics),
    meta: {
      name: name ?? `theme-${primary.slice(1).toLowerCase()}`,
      version: 1,
    },
  };
}

/**
 * Boost contrast of an existing theme (for high-contrast mode).
 */
export function withHighContrast(theme: Theme, minContrast = 7): Theme {
  return {
    ...theme,
    light: {
      ...theme.light,
      text: ensureContrast('#000000', theme.light.background, minContrast),
      textSecondary: ensureContrast('#1A1A1A', theme.light.background, 4.5),
      textMuted: ensureContrast('#333333', theme.light.background, 3),
      border: '#000000',
      borderSubtle: '#333333',
    },
    dark: {
      ...theme.dark,
      text: ensureContrast('#FFFFFF', theme.dark.background, minContrast),
      textSecondary: ensureContrast('#F0F0F0', theme.dark.background, 4.5),
      textMuted: ensureContrast('#DDDDDD', theme.dark.background, 3),
      border: '#FFFFFF',
      borderSubtle: '#CCCCCC',
    },
  };
}

/** Export theme to JSON string */
export function exportTheme(theme: Theme): string {
  return JSON.stringify(theme, null, 2);
}

/** Import theme from JSON string or object */
export function importTheme(jsonOrTheme: string | Theme): Theme {
  const theme = typeof jsonOrTheme === 'string' ? JSON.parse(jsonOrTheme) : jsonOrTheme;
  if (!theme?.light || !theme?.dark || !theme?.seed) {
    throw new Error('Invalid theme: missing seed, light, or dark palette');
  }
  return theme as Theme;
}

/** @internal helper re-export for generators */
export { roleColor, lighten, darken };
