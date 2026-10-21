import React from 'react';
import { Switch, type SwitchProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ThemedSwitchProps extends SwitchProps {}

/**
 * Switch tinted with theme primary / border tokens.
 */
export function ThemedSwitch({
  trackColor,
  thumbColor,
  ios_backgroundColor,
  ...rest
}: ThemedSwitchProps) {
  const { colors } = useTheme();

  return (
    <Switch
      trackColor={
        trackColor ?? {
          false: colors.border,
          true: colors.primary,
        }
      }
      thumbColor={thumbColor ?? colors.surface}
      ios_backgroundColor={ios_backgroundColor ?? colors.border}
      {...rest}
    />
  );
}
