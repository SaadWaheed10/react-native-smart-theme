import React, { useMemo } from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { smartForeground } from '../smart/adaptPalette';
import type { ColorTokens, HexColor } from '../types/theme';

export interface SmartTextProps extends TextProps {
  /**
   * Background behind this text.
   * Defaults to theme background (auto-updates on light/dark switch).
   */
  backgroundColor?: HexColor;
  /** Prefer a semantic token when it already passes contrast */
  preferToken?: keyof ColorTokens;
  /** Force a minimum WCAG ratio @default 4.5 */
  minContrast?: number;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * Text that always stays readable when the theme mode changes.
 *
 * Prefer this over plain `<Text>` for body copy. For colored chips/buttons,
 * pass the same `backgroundColor` you painted behind it.
 *
 * @example
 * ```tsx
 * <SmartText>Always readable body</SmartText>
 * <SmartText backgroundColor={colors.primary}>On brand</SmartText>
 * ```
 */
export function SmartText({
  backgroundColor,
  preferToken = 'text',
  minContrast = 4.5,
  style,
  children,
  ...rest
}: SmartTextProps) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.background;

  const color = useMemo(
    () =>
      smartForeground(bg, {
        prefer: colors[preferToken],
        preferLight: colors.textInverse,
        preferDark: colors.text,
        minContrast,
      }),
    [bg, colors, preferToken, minContrast]
  );

  return (
    <Text {...rest} style={[{ color }, style]}>
      {children}
    </Text>
  );
}
