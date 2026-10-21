import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { HexColor } from '../types/theme';

export type ThemedButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export interface ThemedButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ThemedButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

function resolveColors(
  variant: ThemedButtonVariant,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: HexColor | 'transparent'; fg: HexColor; border?: HexColor } {
  switch (variant) {
    case 'secondary':
      return { bg: colors.secondary, fg: colors.onSecondary };
    case 'outline':
      return {
        bg: 'transparent',
        fg: colors.primary,
        border: colors.border,
      };
    case 'ghost':
      return { bg: 'transparent', fg: colors.primary };
    case 'destructive':
      return { bg: colors.error, fg: colors.onError };
    case 'primary':
    default:
      return { bg: colors.primary, fg: colors.onPrimary };
  }
}

/**
 * Pressable button styled from theme tokens.
 */
export function ThemedButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ThemedButtonProps) {
  const { colors, metrics } = useTheme();
  const { bg, fg, border } = resolveColors(variant, colors);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: metrics.radius.md,
          paddingVertical: metrics.spacing.sm + 4,
          paddingHorizontal: metrics.spacing.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          borderWidth: border ? 1 : 0,
          borderColor: border,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
