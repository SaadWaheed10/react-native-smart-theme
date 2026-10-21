import React, { useMemo } from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useThemeOptional } from '../hooks/useTheme';
import type { ContrastAlgorithm, HexColor } from '../types/theme';
import {
  checkContrast,
  contrastWarning,
  getAdaptiveColor,
} from '../utils/contrast';

export interface AdaptiveTextProps extends TextProps {
  /**
   * Background color behind this text.
   * Falls back to theme `colors.background` when inside ThemeProvider.
   */
  backgroundColor?: HexColor;
  /** Preferred light foreground when bg is dark */
  lightColor?: HexColor;
  /** Preferred dark foreground when bg is light */
  darkColor?: HexColor;
  /** Contrast algorithm */
  algorithm?: ContrastAlgorithm;
  /** Minimum WCAG ratio (default 4.5) */
  minRatio?: number;
  /** Minimum |APCA Lc| (default 60) */
  minLc?: number;
  /**
   * In __DEV__, log a console warning when contrast fails.
   * @default true
   */
  warnOnFail?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Text that automatically picks an accessible color for its background.
 *
 * @example
 * ```tsx
 * <AdaptiveText backgroundColor="#6750A4">Hello</AdaptiveText>
 * <AdaptiveText backgroundColor={colors.primary} algorithm="APCA">
 *   On brand
 * </AdaptiveText>
 * ```
 */
export function AdaptiveText({
  backgroundColor,
  lightColor,
  darkColor,
  algorithm = 'WCAG',
  minRatio = 4.5,
  minLc = 60,
  warnOnFail = true,
  style,
  children,
  ...rest
}: AdaptiveTextProps) {
  const theme = useThemeOptional();
  const bg =
    backgroundColor ?? theme?.colors.background ?? '#FFFFFF';

  const color = useMemo(
    () =>
      getAdaptiveColor(bg, {
        algorithm,
        lightColor,
        darkColor,
        minRatio,
        minLc,
      }),
    [bg, algorithm, lightColor, darkColor, minRatio, minLc]
  );

  if (__DEV__ && warnOnFail) {
    const result = checkContrast(color, bg, algorithm, { minRatio, minLc });
    if (!result.passes) {
      const msg = contrastWarning(color, bg, { algorithm });
      if (msg) {
        // Soft warn — never throw in UI
        // eslint-disable-next-line no-console
        console.warn(`[AdaptiveText] ${msg}`);
      }
    }
  }

  return (
    <Text {...rest} style={[{ color }, style]}>
      {children}
    </Text>
  );
}
