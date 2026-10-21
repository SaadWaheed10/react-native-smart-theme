import { useMemo } from 'react';
import { smartForeground } from '../smart/adaptPalette';
import type { ColorTokens, HexColor } from '../types/theme';
import { useTheme } from './useTheme';

export interface UseSmartColorOptions {
  /**
   * Background to contrast against.
   * Defaults to theme `colors.background`.
   */
  backgroundColor?: HexColor;
  /**
   * Preferred semantic token (e.g. `'text'`, `'onPrimary'`).
   * Used when it already passes contrast; otherwise falls back to adaptive.
   */
  preferToken?: keyof ColorTokens;
  /** Absolute preferred hex (wins over preferToken when it passes) */
  prefer?: HexColor;
  minContrast?: number;
}

/**
 * Returns a foreground color that is guaranteed readable on the given
 * (or theme) background — updates automatically when light/dark switches.
 *
 * @example
 * ```tsx
 * const color = useSmartColor();
 * const onBrand = useSmartColor({ backgroundColor: colors.primary });
 * ```
 */
export function useSmartColor(options: UseSmartColorOptions = {}): HexColor {
  const { colors } = useTheme();
  const {
    backgroundColor = colors.background,
    preferToken,
    prefer,
    minContrast = 4.5,
  } = options;

  return useMemo(() => {
    const preferred =
      prefer ?? (preferToken ? colors[preferToken] : colors.text);

    return smartForeground(backgroundColor, {
      prefer: preferred,
      preferLight: colors.textInverse,
      preferDark: colors.text,
      minContrast,
    });
  }, [colors, backgroundColor, preferToken, prefer, minContrast]);
}
