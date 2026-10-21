import type { HexColor } from '../types/theme';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Expand #RGB → #RRGGBB; strip alpha from #RRGGBBAA */
export function normalizeHex(hex: HexColor): string {
  let h = hex.trim().replace(/^#/, '').toUpperCase();

  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (h.length === 8) {
    h = h.slice(0, 6);
  }

  if (h.length !== 6 || !/^[0-9A-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  return `#${h}`;
}

export function hexToRgb(hex: HexColor): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): HexColor {
  const to = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) {
    return { h: 0, s: 0, l };
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      break;
    case gn:
      h = ((bn - rn) / d + 2) / 6;
      break;
    default:
      h = ((rn - gn) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
  let T = t;
  if (T < 0) T += 1;
  if (T > 1) T -= 1;
  if (T < 1 / 6) return p + (q - p) * 6 * T;
  if (T < 1 / 2) return q;
  if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
  return p;
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const H = ((h % 360) + 360) % 360;
  const S = clamp(s, 0, 1);
  const L = clamp(l, 0, 1);

  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }

  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hk = H / 360;

  return {
    r: Math.round(hue2rgb(p, q, hk + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hk) * 255),
    b: Math.round(hue2rgb(p, q, hk - 1 / 3) * 255),
  };
}

export function hexToHsl(hex: HexColor): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): HexColor {
  return rgbToHex(hslToRgb(hsl));
}

/** Relative luminance (WCAG 2.x), sRGB 0–1 → linear */
export function relativeLuminance(hex: HexColor): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Mix two hex colors; amount = weight of `b` (0–1) */
export function mix(a: HexColor, b: HexColor, amount: number): HexColor {
  const t = clamp(amount, 0, 1);
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t,
  });
}

/** Lighten by increasing HSL lightness */
export function lighten(hex: HexColor, amount: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp(hsl.l + amount, 0, 1) });
}

/** Darken by decreasing HSL lightness */
export function darken(hex: HexColor, amount: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp(hsl.l - amount, 0, 1) });
}

/** Adjust saturation */
export function saturate(hex: HexColor, amount: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, s: clamp(hsl.s + amount, 0, 1) });
}

/** Rotate hue by degrees */
export function rotateHue(hex: HexColor, degrees: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, h: hsl.h + degrees });
}

/** Set absolute HSL lightness while keeping hue/sat */
export function setLightness(hex: HexColor, l: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp(l, 0, 1) });
}

/** Set absolute saturation */
export function setSaturation(hex: HexColor, s: number): HexColor {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, s: clamp(s, 0, 1) });
}

/** Alpha as #RRGGBBAA (React Native supports this in many places) */
export function withAlpha(hex: HexColor, alpha: number): string {
  const base = normalizeHex(hex);
  const a = clamp(Math.round(alpha * 255), 0, 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${base}${a}`;
}

/** Perceived brightness 0–1 (simple Rec. 601) */
export function perceivedBrightness(hex: HexColor): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
