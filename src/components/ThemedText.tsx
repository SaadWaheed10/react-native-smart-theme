import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { ColorTokens } from '../types/theme';

export type ThemedTextVariant =
  | 'body'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'primary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

const VARIANT_TOKEN: Record<ThemedTextVariant, keyof ColorTokens> = {
  body: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  inverse: 'textInverse',
  primary: 'primary',
  error: 'error',
  success: 'success',
  warning: 'warning',
  info: 'info',
};

export interface ThemedTextProps extends TextProps {
  /** Semantic text variant */
  variant?: ThemedTextVariant;
  /** Override with any color token */
  colorToken?: keyof ColorTokens;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * Text that uses theme color tokens by default.
 */
export function ThemedText({
  variant = 'body',
  colorToken,
  style,
  children,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const token = colorToken ?? VARIANT_TOKEN[variant];

  return (
    <Text {...rest} style={[{ color: colors[token] }, style]}>
      {children}
    </Text>
  );
}
