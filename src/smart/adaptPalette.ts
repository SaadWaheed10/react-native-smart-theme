import type { ColorTokens, HexColor, Theme } from '../types/theme';
import { ensureContrast, getAdaptiveColor, getContrastRatio } from '../utils/contrast';

export interface SmartAdaptOptions {
  /** Minimum WCAG ratio for body text @default 4.5 */
  minContrast?: number;
  /** Minimum ratio for muted / secondary text @default 3 */
  minMutedContrast?: number;
  /** Minimum ratio for borders vs background @default 3 */
  minBorderContrast?: number;
  /**
   * In __DEV__, log which tokens were fixed.
   * @default true
   */
  logFixes?: boolean;
}

export interface ContrastIssue {
  token: keyof ColorTokens;
  against: keyof ColorTokens | 'background';
  foreground: HexColor;
  background: HexColor;
  ratio: number;
  minRequired: number;
}

export interface ScanPaletteResult {
  issues: ContrastIssue[];
  /** Palette with failing pairs repaired */
  fixed: ColorTokens;
  ok: boolean;
}

type Pair = {
  fg: keyof ColorTokens;
  bg: keyof ColorTokens;
  min: number;
};

function criticalPairs(minText: number, minMuted: number, minBorder: number): Pair[] {
  return [
    { fg: 'text', bg: 'background', min: minText },
    { fg: 'textSecondary', bg: 'background', min: Math.min(minText, 4.5) },
    { fg: 'textMuted', bg: 'background', min: minMuted },
    { fg: 'onPrimary', bg: 'primary', min: minText },
    { fg: 'onPrimaryContainer', bg: 'primaryContainer', min: minText },
    { fg: 'onSecondary', bg: 'secondary', min: minText },
    { fg: 'onSecondaryContainer', bg: 'secondaryContainer', min: minText },
    { fg: 'onError', bg: 'error', min: minText },
    { fg: 'onSuccess', bg: 'success', min: minText },
    { fg: 'onWarning', bg: 'warning', min: minText },
    { fg: 'onInfo', bg: 'info', min: minText },
    { fg: 'border', bg: 'background', min: minBorder },
    { fg: 'borderSubtle', bg: 'background', min: Math.max(1.5, minBorder - 1) },
    { fg: 'focus', bg: 'background', min: minBorder },
  ];
}

/**
 * Scan a palette for WCAG contrast failures on critical pairs.
 */
export function scanPaletteContrast(
  colors: ColorTokens,
  options: SmartAdaptOptions = {}
): ScanPaletteResult {
  const minContrast = options.minContrast ?? 4.5;
  const minMutedContrast = options.minMutedContrast ?? 3;
  const minBorderContrast = options.minBorderContrast ?? 3;

  const issues: ContrastIssue[] = [];
  const fixed: ColorTokens = { ...colors };

  for (const pair of criticalPairs(minContrast, minMutedContrast, minBorderContrast)) {
    const fg = colors[pair.fg];
    const bg = colors[pair.bg];
    if (typeof fg !== 'string' || typeof bg !== 'string') continue;
    if (!fg.startsWith('#') || !bg.startsWith('#')) continue;

    const ratio = getContrastRatio(fg, bg);
    if (ratio < pair.min) {
      issues.push({
        token: pair.fg,
        against: pair.bg,
        foreground: fg,
        background: bg,
        ratio,
        minRequired: pair.min,
      });
      fixed[pair.fg] = ensureContrast(fg, bg, pair.min);
    }
  }

  return {
    issues,
    fixed,
    ok: issues.length === 0,
  };
}

/**
 * Force every critical text/icon/border pair in a palette to meet contrast.
 * Safe to run on every light/dark switch — pure + synchronous.
 */
export function ensureAccessiblePalette(
  colors: ColorTokens,
  options: SmartAdaptOptions = {}
): ColorTokens {
  const { fixed, issues } = scanPaletteContrast(colors, options);

  if (
    options.logFixes !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    issues.length > 0
  ) {
    // eslint-disable-next-line no-console
    console.log(
      `[smartAdapt] fixed ${issues.length} contrast issue(s):`,
      issues.map(
        (i) =>
          `${String(i.token)} on ${String(i.against)} (${i.ratio.toFixed(2)} → ≥${i.minRequired})`
      )
    );
  }

  return fixed;
}

/**
 * Apply smart-adapt to both light and dark palettes of a theme.
 */
export function withSmartAdapt(
  theme: Theme,
  options: SmartAdaptOptions = {}
): Theme {
  return {
    ...theme,
    light: ensureAccessiblePalette(theme.light, { ...options, logFixes: false }),
    dark: ensureAccessiblePalette(theme.dark, { ...options, logFixes: false }),
  };
}

/**
 * Pick a guaranteed-readable foreground for any background.
 * Prefers theme text colors when they already pass; otherwise adapts.
 */
export function smartForeground(
  background: HexColor,
  options: {
    prefer?: HexColor;
    preferLight?: HexColor;
    preferDark?: HexColor;
    minContrast?: number;
  } = {}
): HexColor {
  const min = options.minContrast ?? 4.5;
  if (options.prefer && getContrastRatio(options.prefer, background) >= min) {
    return options.prefer;
  }
  return getAdaptiveColor(background, {
    lightColor: options.preferLight,
    darkColor: options.preferDark,
    minRatio: min,
  });
}

/**
 * Given a style-like object with `color` + `backgroundColor`, return a
 * corrected `color` when contrast fails. Useful for migrating hardcoded styles.
 */
export function adaptStyleColors<
  T extends { color?: string; backgroundColor?: string },
>(style: T, minContrast = 4.5): T {
  const { color, backgroundColor } = style;
  if (!color || !backgroundColor) return style;
  if (!color.startsWith('#') || !backgroundColor.startsWith('#')) return style;
  if (getContrastRatio(color, backgroundColor) >= minContrast) return style;
  return {
    ...style,
    color: ensureContrast(color, backgroundColor, minContrast),
  };
}
