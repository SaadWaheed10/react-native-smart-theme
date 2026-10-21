import type { CreateThemeOptions, HexColor, Theme } from '../types/theme';
import { normalizeHex, perceivedBrightness, rotateHue } from '../utils/color';
import { createTheme } from './createTheme';
import {
  extractDominantColors,
  pickVibrantSeed,
  type DominantColor,
  type ExtractColorsOptions,
  type PixelBuffer,
} from './extractColors';

export interface CreateThemeFromColorsOptions
  extends Omit<CreateThemeOptions, 'primary' | 'secondary'> {
  /** Ordered color swatches (dominant first). At least one required. */
  colors: HexColor[];
  /** Explicit primary override */
  primary?: HexColor;
  /** Explicit secondary override */
  secondary?: HexColor;
}

export interface CreateThemeFromPixelsOptions
  extends Omit<CreateThemeFromColorsOptions, 'colors'> {
  pixels: PixelBuffer;
  extract?: ExtractColorsOptions;
}

export type ImageColorSource =
  | string
  | number
  | { uri: string }
  | HexColor[];

export interface CreateThemeFromImageOptions
  extends Omit<CreateThemeFromColorsOptions, 'colors'> {
  /**
   * Image source:
   * - remote/local URI string
   * - require() asset number
   * - `{ uri }`
   * - or a precomputed hex palette
   */
  source: ImageColorSource;
  /** Forwarded to median-cut when pixels are available */
  extract?: ExtractColorsOptions;
  /**
   * Custom pixel provider. Return RGBA buffer for pure-JS extraction.
   * Useful with Skia / expo-gl / your own decoder.
   */
  getPixels?: (source: ImageColorSource) => Promise<PixelBuffer | null>;
}

export interface ImageThemeResult {
  theme: Theme;
  /** Extracted / resolved swatches */
  swatches: DominantColor[] | HexColor[];
  /** Seed chosen as primary */
  primary: HexColor;
  secondary?: HexColor;
}

function pickSecondary(colors: HexColor[], primary: HexColor): HexColor | undefined {
  const p = normalizeHex(primary);
  // Prefer a swatch far from primary in brightness or hue position
  let best: HexColor | undefined;
  let bestDist = -1;
  for (const raw of colors) {
    const c = normalizeHex(raw);
    if (c === p) continue;
    const dist = Math.abs(perceivedBrightness(c) - perceivedBrightness(p));
    if (dist > bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

/**
 * Build a full light + dark theme from an explicit color palette
 * (e.g. logo colors, design tokens, or pre-extracted image swatches).
 */
export function createThemeFromColors(
  options: CreateThemeFromColorsOptions
): ImageThemeResult {
  const { colors: inputColors, primary: primaryOpt, secondary: secondaryOpt, ...rest } =
    options;

  if (!inputColors?.length && !primaryOpt) {
    throw new Error('createThemeFromColors: provide at least one color or primary');
  }

  const colors = (inputColors ?? []).map((c) => normalizeHex(c));
  const asDominant: DominantColor[] = colors.map((hex, i) => ({
    hex,
    population: colors.length - i,
    ratio: (colors.length - i) / ((colors.length * (colors.length + 1)) / 2),
  }));

  const primary =
    primaryOpt != null
      ? normalizeHex(primaryOpt)
      : pickVibrantSeed(asDominant) ?? colors[0];

  const secondary =
    secondaryOpt != null
      ? normalizeHex(secondaryOpt)
      : pickSecondary(colors, primary);

  const theme = createTheme({
    ...rest,
    primary,
    secondary,
    name: rest.name ?? `image-${primary.slice(1).toLowerCase()}`,
  });

  return {
    theme,
    swatches: asDominant,
    primary,
    secondary,
  };
}

/**
 * Extract dominant colors from an RGBA pixel buffer, then build a theme.
 */
export function createThemeFromPixels(
  options: CreateThemeFromPixelsOptions
): ImageThemeResult {
  const { pixels, extract, primary, secondary, ...rest } = options;
  const swatches = extractDominantColors(pixels, extract);
  const hexes = swatches.map((s) => s.hex);

  if (hexes.length === 0 && !primary) {
    throw new Error('createThemeFromPixels: no colors could be extracted from pixels');
  }

  const result = createThemeFromColors({
    ...rest,
    colors: hexes.length ? hexes : [primary!],
    primary,
    secondary,
  });

  return {
    ...result,
    swatches,
  };
}

/**
 * Try `react-native-image-colors` (optional peer) to get platform swatches.
 */
async function extractViaImageColors(
  source: ImageColorSource
): Promise<HexColor[] | null> {
  if (Array.isArray(source)) return source.map((c) => normalizeHex(c));

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ImageColors = require('react-native-image-colors');
    const getColors = ImageColors.getColors ?? ImageColors.default?.getColors;
    if (typeof getColors !== 'function') return null;

    const result = await getColors(source, {
      fallback: '#6750A4',
      cache: true,
      key: typeof source === 'string' ? source : JSON.stringify(source),
    });

    const hexes: HexColor[] = [];
    const push = (v: unknown) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        try {
          hexes.push(normalizeHex(v));
        } catch {
          // ignore invalid
        }
      }
    };

    // Android
    push(result?.dominant);
    push(result?.vibrant);
    push(result?.darkVibrant);
    push(result?.lightVibrant);
    push(result?.muted);
    push(result?.darkMuted);
    push(result?.lightMuted);
    push(result?.average);

    // iOS
    push(result?.background);
    push(result?.primary);
    push(result?.secondary);
    push(result?.detail);

    // Dedupe
    return [...new Set(hexes)];
  } catch {
    return null;
  }
}

/**
 * Image → Theme.
 *
 * Resolution order:
 * 1. `source` is already a hex array → `createThemeFromColors`
 * 2. `getPixels` adapter returns a buffer → median-cut extraction
 * 3. Optional peer `react-native-image-colors` → platform swatches
 *
 * @example
 * ```ts
 * // From known colors
 * const { theme } = await createThemeFromImage({
 *   source: ['#6750A4', '#E8DEF8', '#21005D'],
 * });
 *
 * // From URI (install react-native-image-colors)
 * const { theme } = await createThemeFromImage({
 *   source: { uri: 'https://example.com/logo.png' },
 * });
 *
 * // From your own pixels (Skia, etc.)
 * const { theme } = await createThemeFromImage({
 *   source: require('./wallpaper.jpg'),
 *   getPixels: async () => ({ data, width, height }),
 * });
 * ```
 */
export async function createThemeFromImage(
  options: CreateThemeFromImageOptions
): Promise<ImageThemeResult> {
  const { source, getPixels, extract, primary, secondary, ...rest } = options;

  if (Array.isArray(source)) {
    return createThemeFromColors({
      ...rest,
      colors: source,
      primary,
      secondary,
    });
  }

  if (getPixels) {
    const pixels = await getPixels(source);
    if (pixels) {
      return createThemeFromPixels({
        ...rest,
        pixels,
        extract,
        primary,
        secondary,
      });
    }
  }

  const fromNative = await extractViaImageColors(source);
  if (fromNative && fromNative.length > 0) {
    return createThemeFromColors({
      ...rest,
      colors: fromNative,
      primary,
      secondary,
    });
  }

  throw new Error(
    'createThemeFromImage: could not extract colors. ' +
      'Pass a hex array, provide a getPixels adapter, or install the optional peer ' +
      '`react-native-image-colors`.'
  );
}

/**
 * Quick helper: theme from a single wallpaper/logo URI via image-colors peer.
 */
export async function themeFromImageUri(
  uri: string,
  options: Omit<CreateThemeFromImageOptions, 'source'> = {}
): Promise<Theme> {
  const { theme } = await createThemeFromImage({ ...options, source: { uri } });
  return theme;
}

/** @internal — used when secondary cannot be derived from swatches */
export function fallbackSecondary(primary: HexColor): HexColor {
  return rotateHue(primary, 150);
}
