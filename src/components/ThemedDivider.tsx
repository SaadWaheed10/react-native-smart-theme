import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { ColorTokens } from '../types/theme';

export interface ThemedDividerProps extends ViewProps {
  /** Color token for the line @default borderSubtle */
  colorToken?: keyof ColorTokens;
  /** Vertical divider */
  vertical?: boolean;
  /** Thickness in px @default StyleSheet.hairlineWidth equivalent (1) */
  thickness?: number;
  /** Inset from start/end */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Horizontal or vertical hairline using theme border tokens.
 */
export function ThemedDivider({
  colorToken = 'borderSubtle',
  vertical = false,
  thickness = 1,
  inset = 0,
  style,
  ...rest
}: ThemedDividerProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="none"
      {...rest}
      style={[
        vertical
          ? {
              width: thickness,
              alignSelf: 'stretch',
              marginVertical: inset,
              backgroundColor: colors[colorToken],
            }
          : {
              height: thickness,
              alignSelf: 'stretch',
              marginHorizontal: inset,
              backgroundColor: colors[colorToken],
            },
        style,
      ]}
    />
  );
}
