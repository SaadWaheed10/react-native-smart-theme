import { useContext } from 'react';
import { ThemeContext } from '../core/ThemeContext';
import type { ThemeContextValue } from '../types/theme';

/**
 * Access the current theme, colors, and mode controls.
 *
 * @throws if used outside of `ThemeProvider`
 *
 * @example
 * ```tsx
 * const { colors, isDark, toggleMode } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      'useTheme() must be used within a <ThemeProvider>. ' +
        'Wrap your app with ThemeProvider from react-native-smart-theme.'
    );
  }
  return ctx;
}

/**
 * Safe variant that returns `null` outside a provider (useful for optional theming).
 */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
