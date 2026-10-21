import type { HexColor } from '../types/theme';
import { clamp, hexToRgb, normalizeHex, rgbToHex } from './color';

/**
 * Linearly interpolate between two hex colors.
 * `t` is clamped to [0, 1]. Alpha channels (if present) are ignored.
 */
export function interpolateHex(
  from: HexColor,
  to: HexColor,
  t: number
): HexColor {
  const amount = clamp(t, 0, 1);
  if (amount <= 0) return normalizeHex(from);
  if (amount >= 1) return normalizeHex(to);

  const A = hexToRgb(from);
  const B = hexToRgb(to);

  return rgbToHex({
    r: A.r + (B.r - A.r) * amount,
    g: A.g + (B.g - A.g) * amount,
    b: A.b + (B.b - A.b) * amount,
  });
}

/**
 * Interpolate every hex token in a color palette object.
 * Non-hex / missing keys fall through to `to`.
 */
export function interpolateColorTokens<T extends object>(
  from: T,
  to: T,
  t: number
): T {
  const amount = clamp(t, 0, 1);
  if (amount <= 0) return from;
  if (amount >= 1) return to;

  const out = { ...to } as T;
  for (const key of Object.keys(to) as (keyof T)[]) {
    const a = from[key];
    const b = to[key];
    if (
      typeof a === 'string' &&
      typeof b === 'string' &&
      a.startsWith('#') &&
      b.startsWith('#')
    ) {
      try {
        (out as Record<string, string>)[key as string] = interpolateHex(a, b, amount);
      } catch {
        (out as Record<string, unknown>)[key as string] = b;
      }
    }
  }
  return out;
}
