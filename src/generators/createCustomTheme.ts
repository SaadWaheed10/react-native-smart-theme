import type {
  ColorTokens,
  CreateThemeOptions,
  HexColor,
  Theme,
  ThemeMetrics,
} from '../types/theme';
import { normalizeHex } from '../utils/color';
import { ensureAccessiblePalette } from '../smart/adaptPalette';
import { createTheme } from './createTheme';

export interface CreateCustomThemeOptions {
  /**
   * Brand seed used to fill any tokens you omit.
   * Falls back to `light.primary` → `dark.primary` if omitted.
   */
  primary?: HexColor;
  /** Optional secondary seed for generated gaps */
  secondary?: HexColor;
  /** Your light-mode colors (any subset of tokens) */
  light?: Partial<ColorTokens>;
  /** Your dark-mode colors (any subset of tokens) */
  dark?: Partial<ColorTokens>;
  metrics?: Partial<ThemeMetrics>;
  name?: string;
  minContrast?: number;
  /**
   * After merging, repair text/border contrast on both palettes.
   * @default false — keeps your exact colors unless you opt in
   */
  ensureContrast?: boolean;
}

function resolveSeed(options: CreateCustomThemeOptions): HexColor {
  if (options.primary) return normalizeHex(options.primary);
  if (options.light?.primary) return normalizeHex(options.light.primary);
  if (options.dark?.primary) return normalizeHex(options.dark.primary);
  throw new Error(
    'createCustomTheme: provide `primary`, or `light.primary`, or `dark.primary`'
  );
}

/**
 * Build a theme where **you** pick light and dark colors.
 * Missing tokens are filled from a one-seed generator so the palette stays complete.
 *
 * @example
 * ```ts
 * const theme = createCustomTheme({
 *   primary: '#6750A4',
 *   light: {
 *     background: '#FFF8F0',
 *     text: '#1A1A1A',
 *     primary: '#7C3AED',
 *   },
 *   dark: {
 *     background: '#0D0D12',
 *     text: '#F5F5F7',
 *     primary: '#C4B5FD',
 *   },
 * });
 * ```
 */
export function createCustomTheme(options: CreateCustomThemeOptions): Theme {
  const seed = resolveSeed(options);
  const baseOpts: CreateThemeOptions = {
    primary: seed,
    secondary: options.secondary,
    metrics: options.metrics,
    name: options.name ?? `custom-${seed.slice(1).toLowerCase()}`,
    minContrast: options.minContrast,
  };

  // Generate a full base, then apply your colors on top so they win
  // (createTheme's finalize would otherwise re-touch text/on* pairs).
  let theme = createTheme(baseOpts);
  theme = patchThemePalettes(theme, {
    light: options.light,
    dark: options.dark,
  });

  if (!options.ensureContrast) {
    return theme;
  }

  const min = options.minContrast ?? 4.5;
  return {
    ...theme,
    light: ensureAccessiblePalette(theme.light, {
      minContrast: min,
      logFixes: false,
    }),
    dark: ensureAccessiblePalette(theme.dark, {
      minContrast: min,
      logFixes: false,
    }),
  };
}

/**
 * Merge partial token patches into an existing theme (immutable).
 */
export function patchThemePalettes(
  theme: Theme,
  patch: { light?: Partial<ColorTokens>; dark?: Partial<ColorTokens> }
): Theme {
  return {
    ...theme,
    light: patch.light ? { ...theme.light, ...patch.light } : theme.light,
    dark: patch.dark ? { ...theme.dark, ...patch.dark } : theme.dark,
  };
}
