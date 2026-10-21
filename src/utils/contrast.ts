import type { ContrastAlgorithm, HexColor } from '../types/theme';
import { clamp, hexToRgb, normalizeHex, relativeLuminance } from './color';

/** WCAG 2.x contrast ratio between two colors (1–21) */
export function getContrastRatio(foreground: HexColor, background: HexColor): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = 'AA' | 'AAA';
export type WcagSize = 'normal' | 'large';

/**
 * Check WCAG contrast compliance.
 * Large text = ≥18pt regular or ≥14pt bold (approx).
 */
export function meetsWcag(
  foreground: HexColor,
  background: HexColor,
  level: WcagLevel = 'AA',
  size: WcagSize = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
}

/**
 * APCA (Accessible Perceptual Contrast Algorithm) Lc value.
 * Simplified SAPC-APCA implementation suitable for UI theming.
 * Positive Lc ≈ dark text on light bg; negative ≈ light text on dark bg.
 * @see https://git.myndex.com / W3C APCA
 */
export function getApcaContrast(foreground: HexColor, background: HexColor): number {
  const Ys = softClampY(srgbToY(hexToRgb(foreground)));
  const Yb = softClampY(srgbToY(hexToRgb(background)));

  let Lc: number;

  if (Math.abs(Yb - Ys) < 0.0005) {
    return 0;
  }

  if (Yb > Ys) {
    // Dark text on light background
    const SAPC = Math.pow(Yb, 0.56) - Math.pow(Ys, 0.57);
    Lc = SAPC * 1.14;
  } else {
    // Light text on dark background
    const SAPC = Math.pow(Yb, 0.65) - Math.pow(Ys, 0.62);
    Lc = SAPC * 1.14;
  }

  // Scale / clamp tiny values toward zero (APCA soft clamp)
  if (Math.abs(Lc) < 0.1) return 0;
  if (Lc > 0) Lc -= 0.027;
  else Lc += 0.027;

  return Lc * 100;
}

function srgbToY({ r, g, b }: { r: number; g: number; b: number }): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  // APCA coefficients (slightly different from WCAG)
  return 0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.072175 * lin(b);
}

function softClampY(Y: number): number {
  const blackClamp = 0.022;
  if (Y >= blackClamp) return Y;
  return Y + Math.pow(blackClamp - Y, 1.414);
}

/** Absolute APCA contrast magnitude */
export function getApcaMagnitude(foreground: HexColor, background: HexColor): number {
  return Math.abs(getApcaContrast(foreground, background));
}

/**
 * Minimum recommended |Lc| for body text ~ Lc 75; UI icons ~ 45; large text ~ 60.
 * We treat "passes" as |Lc| >= threshold.
 */
export function meetsApca(
  foreground: HexColor,
  background: HexColor,
  minLc = 60
): boolean {
  return getApcaMagnitude(foreground, background) >= minLc;
}

export interface ContrastResult {
  algorithm: ContrastAlgorithm;
  /** WCAG ratio or |APCA Lc| depending on algorithm */
  score: number;
  /** Signed APCA Lc when algorithm is APCA; else same as score */
  raw: number;
  passes: boolean;
  foreground: HexColor;
  background: HexColor;
}

export function checkContrast(
  foreground: HexColor,
  background: HexColor,
  algorithm: ContrastAlgorithm = 'WCAG',
  options?: { minRatio?: number; minLc?: number; level?: WcagLevel; size?: WcagSize }
): ContrastResult {
  const fg = normalizeHex(foreground);
  const bg = normalizeHex(background);

  if (algorithm === 'APCA') {
    const raw = getApcaContrast(fg, bg);
    const score = Math.abs(raw);
    const minLc = options?.minLc ?? 60;
    return {
      algorithm,
      score,
      raw,
      passes: score >= minLc,
      foreground: fg,
      background: bg,
    };
  }

  const score = getContrastRatio(fg, bg);
  const passes =
    options?.minRatio != null
      ? score >= options.minRatio
      : meetsWcag(fg, bg, options?.level ?? 'AA', options?.size ?? 'normal');

  return {
    algorithm: 'WCAG',
    score,
    raw: score,
    passes,
    foreground: fg,
    background: bg,
  };
}

const WHITE = '#FFFFFF';
const BLACK = '#000000';

export interface AdaptiveColorOptions {
  algorithm?: ContrastAlgorithm;
  /** Preferred light color when background is dark */
  lightColor?: HexColor;
  /** Preferred dark color when background is light */
  darkColor?: HexColor;
  /** Minimum WCAG ratio (default 4.5) */
  minRatio?: number;
  /** Minimum |APCA Lc| (default 60) */
  minLc?: number;
}

/**
 * Pick the best contrasting text/icon color for a background.
 * Tries lightColor vs darkColor (defaults white/black) and returns the winner.
 */
export function getAdaptiveColor(
  background: HexColor,
  options: AdaptiveColorOptions = {}
): HexColor {
  const {
    algorithm = 'WCAG',
    lightColor = WHITE,
    darkColor = BLACK,
    minRatio = 4.5,
    minLc = 60,
  } = options;

  const bg = normalizeHex(background);
  const light = normalizeHex(lightColor);
  const dark = normalizeHex(darkColor);

  if (algorithm === 'APCA') {
    const lightScore = getApcaMagnitude(light, bg);
    const darkScore = getApcaMagnitude(dark, bg);
    // Prefer the higher magnitude; if neither meets minLc, still pick best
    if (lightScore >= darkScore && lightScore >= minLc) return light;
    if (darkScore > lightScore && darkScore >= minLc) return dark;
    return lightScore >= darkScore ? light : dark;
  }

  const lightRatio = getContrastRatio(light, bg);
  const darkRatio = getContrastRatio(dark, bg);

  if (lightRatio >= darkRatio && lightRatio >= minRatio) return light;
  if (darkRatio > lightRatio && darkRatio >= minRatio) return dark;
  return lightRatio >= darkRatio ? light : dark;
}

/**
 * Ensure `foreground` meets min contrast on `background` by mixing
 * toward black or white until the target is reached (or exhausted).
 */
export function ensureContrast(
  foreground: HexColor,
  background: HexColor,
  minRatio = 4.5
): HexColor {
  let fg = normalizeHex(foreground);
  const bg = normalizeHex(background);

  if (getContrastRatio(fg, bg) >= minRatio) return fg;

  const bgLum = relativeLuminance(bg);
  const target = bgLum > 0.179 ? BLACK : WHITE;

  // Binary-search mix amount toward target
  let lo = 0;
  let hi = 1;
  let best = target;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const candidate = mixHex(fg, target, mid);
    if (getContrastRatio(candidate, bg) >= minRatio) {
      best = candidate;
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // If still failing, snap to pure black/white
  if (getContrastRatio(best, bg) < minRatio) {
    return target;
  }

  return best;
}

function mixHex(a: HexColor, b: HexColor, t: number): HexColor {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = clamp(t, 0, 1);
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(A.r + (B.r - A.r) * m)}${toHex(A.g + (B.g - A.g) * m)}${toHex(
    A.b + (B.b - A.b) * m
  )}`;
}

/**
 * Live contrast checker — returns a warning string when the pair fails AA,
 * or `null` when it passes. Useful in dev / design tools.
 */
export function contrastWarning(
  foreground: HexColor,
  background: HexColor,
  options?: { level?: WcagLevel; size?: WcagSize; algorithm?: ContrastAlgorithm }
): string | null {
  const result = checkContrast(foreground, background, options?.algorithm ?? 'WCAG', {
    level: options?.level,
    size: options?.size,
  });

  if (result.passes) return null;

  if (result.algorithm === 'APCA') {
    return `APCA contrast |Lc|=${result.score.toFixed(1)} is below recommended threshold for text on ${result.background}`;
  }

  return `WCAG contrast ${result.score.toFixed(2)}:1 fails ${options?.level ?? 'AA'} for text on ${result.background}`;
}
