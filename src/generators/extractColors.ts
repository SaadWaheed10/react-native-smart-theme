import type { HexColor } from '../types/theme';
import { rgbToHex } from '../utils/color';

export interface PixelBuffer {
  /** RGBA byte array (length = width * height * 4) */
  data: ArrayLike<number> | Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ExtractColorsOptions {
  /** How many dominant colors to return @default 5 */
  count?: number;
  /** Skip near-white / near-black / near-gray pixels @default true */
  ignoreNeutrals?: boolean;
  /** Minimum alpha (0–255) to include a pixel @default 128 */
  minAlpha?: number;
  /** Sample every Nth pixel for speed @default auto */
  quality?: number;
}

export interface DominantColor {
  hex: HexColor;
  /** Population weight (pixel count in cluster) */
  population: number;
  /** Share of sampled pixels 0–1 */
  ratio: number;
}

interface Bucket {
  colors: Array<[number, number, number]>;
}

function isNeutral(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Near gray, near white, or near black
  return sat < 0.12 || lum > 0.95 || lum < 0.08;
}

function channelRange(colors: Array<[number, number, number]>, channel: 0 | 1 | 2) {
  let min = 255;
  let max = 0;
  for (const c of colors) {
    const v = c[channel];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function splitBucket(bucket: Bucket): [Bucket, Bucket] {
  const { colors } = bucket;
  const ranges: [number, number, number] = [
    channelRange(colors, 0),
    channelRange(colors, 1),
    channelRange(colors, 2),
  ];
  const channel = (ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2);

  colors.sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(colors.length / 2);
  return [
    { colors: colors.slice(0, mid) },
    { colors: colors.slice(mid) },
  ];
}

function averageColor(colors: Array<[number, number, number]>): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = colors.length || 1;
  for (const c of colors) {
    r += c[0];
    g += c[1];
    b += c[2];
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Median-cut dominant color extraction from an RGBA pixel buffer.
 * Pure JS — works anywhere you can supply pixels (no native code).
 *
 * @example
 * ```ts
 * const colors = extractDominantColors({ data, width, height }, { count: 5 });
 * ```
 */
export function extractDominantColors(
  pixels: PixelBuffer,
  options: ExtractColorsOptions = {}
): DominantColor[] {
  const {
    count = 5,
    ignoreNeutrals = true,
    minAlpha = 128,
    quality,
  } = options;

  const { data, width, height } = pixels;
  const total = width * height;
  if (total <= 0) return [];

  // Auto quality: aim for ~10k samples
  const step = quality ?? Math.max(1, Math.floor(Math.sqrt(total / 10000)));
  const samples: Array<[number, number, number]> = [];

  for (let i = 0; i < total; i += step) {
    const idx = i * 4;
    const a = data[idx + 3] ?? 255;
    if (a < minAlpha) continue;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    if (ignoreNeutrals && isNeutral(r, g, b)) continue;
    samples.push([r, g, b]);
  }

  if (samples.length === 0) {
    // Fallback: average all opaque pixels including neutrals
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < total; i += step) {
      const idx = i * 4;
      if ((data[idx + 3] ?? 255) < minAlpha) continue;
      r += data[idx] ?? 0;
      g += data[idx + 1] ?? 0;
      b += data[idx + 2] ?? 0;
      n++;
    }
    if (n === 0) return [];
    const hex = rgbToHex({
      r: Math.round(r / n),
      g: Math.round(g / n),
      b: Math.round(b / n),
    });
    return [{ hex, population: n, ratio: 1 }];
  }

  let buckets: Bucket[] = [{ colors: samples }];

  while (buckets.length < count) {
    // Split the bucket with the largest population / range
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (b.colors.length < 2) continue;
      const score =
        b.colors.length *
        Math.max(
          channelRange(b.colors, 0),
          channelRange(b.colors, 1),
          channelRange(b.colors, 2)
        );
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestScore < 0) break;

    const [left, right] = splitBucket(buckets[bestIdx]);
    buckets.splice(bestIdx, 1, left, right);
  }

  const sampled = samples.length;
  const results: DominantColor[] = buckets
    .filter((b) => b.colors.length > 0)
    .map((b) => {
      const [r, g, bb] = averageColor(b.colors);
      return {
        hex: rgbToHex({ r, g, b: bb }),
        population: b.colors.length,
        ratio: b.colors.length / sampled,
      };
    })
    .sort((a, b) => b.population - a.population);

  return results.slice(0, count);
}

/**
 * Pick the best "brand" color from a dominant-color list:
 * prefers saturated mid-lightness swatches over dull ones.
 */
export function pickVibrantSeed(colors: DominantColor[]): HexColor | null {
  if (colors.length === 0) return null;

  let best = colors[0];
  let bestScore = -1;

  for (const c of colors) {
    const hex = c.hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
    // Prefer saturated colors in a usable lightness band, weighted by population
    const lightnessPenalty = l < 0.15 || l > 0.85 ? 0.25 : 1;
    const score = s * lightnessPenalty * (0.5 + c.ratio);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best.hex;
}
