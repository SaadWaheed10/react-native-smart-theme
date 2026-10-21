import React from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ThemedInputProps extends TextInputProps {
  /** Show error border + tint */
  error?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * TextInput styled with theme surface, border, and text tokens.
 */
export function ThemedInput({
  error = false,
  style,
  placeholderTextColor,
  ...rest
}: ThemedInputProps) {
  const { colors, metrics } = useTheme();

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      selectionColor={colors.primary}
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          color: colors.text,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: metrics.radius.md,
          paddingHorizontal: metrics.spacing.md,
          paddingVertical: metrics.spacing.sm + 2,
          fontSize: 16,
          minHeight: 44,
        },
        style,
      ]}
    />
  );
}
