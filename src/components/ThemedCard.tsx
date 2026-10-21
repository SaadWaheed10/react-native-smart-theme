import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ThemedCardProps extends ViewProps {
  /** Use elevated surface token */
  elevated?: boolean;
  /** Draw a subtle border */
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Surface card using theme surface / elevation tokens.
 */
export function ThemedCard({
  elevated = false,
  outlined = true,
  style,
  children,
  ...rest
}: ThemedCardProps) {
  const { colors, metrics } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: metrics.radius.lg,
          padding: metrics.spacing.md,
          borderWidth: outlined ? 1 : 0,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
