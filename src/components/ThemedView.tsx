import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { ColorTokens } from '../types/theme';

export interface ThemedViewProps extends ViewProps {
  /** Semantic background token (default: `background`) */
  background?: keyof ColorTokens;
  /** Optional border color token */
  borderColor?: keyof ColorTokens;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * View that pulls background (and optional border) from theme tokens.
 */
export function ThemedView({
  background = 'background',
  borderColor,
  style,
  children,
  ...rest
}: ThemedViewProps) {
  const { colors } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors[background],
          ...(borderColor
            ? { borderColor: colors[borderColor], borderWidth: 1 }
            : null),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
