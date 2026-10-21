import { useMemo } from 'react';
import type { ContrastAlgorithm, HexColor } from '../types/theme';
import {
  checkContrast,
  getAdaptiveColor,
  type AdaptiveColorOptions,
} from '../utils/contrast';

export interface UseAdaptiveColorOptions extends AdaptiveColorOptions {
  /** When true, also return contrast diagnostics */
  debug?: boolean;
}

export interface UseAdaptiveColorResult {
  /** Best foreground color for the background */
  color: HexColor;
  /** WCAG ratio or |APCA Lc| */
  score: number;
  /** Whether the chosen color meets the configured threshold */
  passes: boolean;
  algorithm: ContrastAlgorithm;
}

/**
 * Hook: pick an accessible text/icon color for any background.
 *
 * @example
 * ```tsx
 * const { color } = useAdaptiveColor(backgroundColor, { algorithm: 'APCA' });
 * ```
 */
export function useAdaptiveColor(
  background: HexColor,
  options: UseAdaptiveColorOptions = {}
): UseAdaptiveColorResult {
  const {
    algorithm = 'WCAG',
    lightColor,
    darkColor,
    minRatio,
    minLc,
  } = options;

  return useMemo(() => {
    const color = getAdaptiveColor(background, {
      algorithm,
      lightColor,
      darkColor,
      minRatio,
      minLc,
    });

    const result = checkContrast(color, background, algorithm, {
      minRatio,
      minLc,
    });

    return {
      color,
      score: result.score,
      passes: result.passes,
      algorithm,
    };
  }, [background, algorithm, lightColor, darkColor, minRatio, minLc]);
}
