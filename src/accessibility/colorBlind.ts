import type { ColorBlindVariant, ColorTokens, HexColor, Theme } from '../types/theme';
import {
  clamp,
  hexToRgb,
  hslToHex,
  normalizeHex,
  rgbToHex,
} from '../utils/color';
import { ensureContrast, getAdaptiveColor } from '../utils/contrast';

type Mat3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

type ChromaticRole =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

/**
 * Linear-RGB simulation matrices (approx. Brettel / Viénot style).
 * Used for preview / diagnostics — not the "safe palette" remapper.
 */
const SIM_MATRICES: Record<Exclude<ColorBlindVariant, 'none'>, Mat3> = {
  protanopia: [
    [0.56667, 0.43333, 0.0],
    [0.55833, 0.44167, 0.0],
    [0.0, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.43333, 0.56667],
    [0.0, 0.475, 0.525],
  ],
};

/** Hue targets chosen for pairwise separation under each CVD type */
const SAFE_HUES: Record<
  Exclude<ColorBlindVariant, 'none'>,
  Record<ChromaticRole, { h: number; s: number }>
> = {
  // Prot/deut: avoid red↔green — blue / orange / teal / amber
  protanopia: {
    primary: { h: 250, s: 0.55 },
    secondary: { h: 30, s: 0.65 },
    error: { h: 20, s: 0.75 },
    success: { h: 200, s: 0.55 },
    warning: { h: 45, s: 0.8 },
    info: { h: 220, s: 0.5 },
  },
  deuteranopia: {
    primary: { h: 255, s: 0.55 },
    secondary: { h: 35, s: 0.65 },
    error: { h: 15, s: 0.75 },
    success: { h: 195, s: 0.55 },
    warning: { h: 48, s: 0.8 },
    info: { h: 225, s: 0.5 },
  },
  // Tritanopia: avoid blue↔yellow — magenta / cyan / red
  tritanopia: {
    primary: { h: 330, s: 0.55 },
    secondary: { h: 170, s: 0.55 },
    error: { h: 0, s: 0.7 },
    success: { h: 160, s: 0.55 },
    warning: { h: 20, s: 0.75 },
    info: { h: 300, s: 0.5 },
  },
};

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = clamp(c, 0, 1);
  const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return clamp(Math.round(s * 255), 0, 255);
}

function mulMatVec(m: Mat3, r: number, g: number, b: number): [number, number, number] {
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ];
}

/**
 * Simulate how a color appears under a color-vision deficiency.
 * Useful for contrast checkers / design tools.
 */
export function simulateColorBlind(
  hex: HexColor,
  variant: ColorBlindVariant
): HexColor {
  if (variant === 'none') return normalizeHex(hex);

  const { r, g, b } = hexToRgb(hex);
  const [nr, ng, nb] = mulMatVec(
    SIM_MATRICES[variant],
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b)
  );

  return rgbToHex({
    r: linearToSrgb(nr),
    g: linearToSrgb(ng),
    b: linearToSrgb(nb),
  });
}

function toSafeHue(
  hex: HexColor,
  variant: Exclude<ColorBlindVariant, 'none'>,
  role: ChromaticRole
): HexColor {
  const { h, s } = SAFE_HUES[variant][role];
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return hslToHex({ h, s, l: clamp(lum, 0.25, 0.72) });
}

function remapPalette(
  tokens: ColorTokens,
  variant: Exclude<ColorBlindVariant, 'none'>,
  minContrast = 4.5
): ColorTokens {
  const primary = toSafeHue(tokens.primary, variant, 'primary');
  const secondary = toSafeHue(tokens.secondary, variant, 'secondary');
  const error = toSafeHue(tokens.error, variant, 'error');
  const success = toSafeHue(tokens.success, variant, 'success');
  const warning = toSafeHue(tokens.warning, variant, 'warning');
  const info = toSafeHue(tokens.info, variant, 'info');

  const on = (bg: HexColor) => getAdaptiveColor(bg, { minRatio: minContrast });

  return {
    ...tokens,
    primary,
    onPrimary: on(primary),
    secondary,
    onSecondary: on(secondary),
    error,
    onError: on(error),
    success,
    onSuccess: on(success),
    warning,
    onWarning: on(warning),
    info,
    onInfo: on(info),
    focus: primary,
    text: ensureContrast(tokens.text, tokens.background, minContrast),
    textSecondary: ensureContrast(tokens.textSecondary, tokens.background, 3),
  };
}

/**
 * Remap chromatic roles so they stay distinguishable for the given
 * color-vision deficiency (safe palette — not a simulation).
 */
export function withColorBlindSafe(
  theme: Theme,
  variant: ColorBlindVariant,
  minContrast = 4.5
): Theme {
  if (variant === 'none') return theme;

  return {
    ...theme,
    light: remapPalette(theme.light, variant, minContrast),
    dark: remapPalette(theme.dark, variant, minContrast),
    meta: {
      ...theme.meta,
      name: theme.meta?.name
        ? `${theme.meta.name}-${variant}`
        : `theme-${variant}`,
    },
  };
}
