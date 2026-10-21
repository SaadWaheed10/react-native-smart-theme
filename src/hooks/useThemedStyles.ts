import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import type {
  ColorTokens,
  ResolvedMode,
  Theme,
  ThemeMetrics,
} from '../types/theme';
import { useTheme } from './useTheme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export interface ThemedStyleContext {
  isDark: boolean;
  resolvedMode: ResolvedMode;
  theme: Theme;
  /** Whether overall smart-adapt repairs are active */
  smartAdapt: boolean;
}

/**
 * Build a style map from the active theme.
 * Prefer defining this once outside the component via `createThemedStyles`
 * so the factory identity stays stable across renders.
 */
export type ThemedStyleFactory<T extends NamedStyles<T> | NamedStyles<any>> = (
  colors: ColorTokens,
  metrics: ThemeMetrics,
  ctx: ThemedStyleContext
) => T | NamedStyles<T>;

/**
 * Create a reusable themed-styles hook (best performance).
 *
 * @example
 * ```tsx
 * const useStyles = createThemedStyles((colors, metrics) => ({
 *   screen: {
 *     flex: 1,
 *     backgroundColor: colors.background,
 *     padding: metrics.spacing.md,
 *   },
 *   title: { color: colors.text, fontSize: 22 },
 * }));
 *
 * function Home() {
 *   const styles = useStyles();
 *   return <View style={styles.screen} />;
 * }
 * ```
 */
export function createThemedStyles<
  T extends NamedStyles<T> | NamedStyles<any>,
>(factory: ThemedStyleFactory<T>): () => T {
  return function useCreatedThemedStyles(): T {
    const { colors, metrics, isDark, resolvedMode, theme, smartAdapt } =
      useTheme();

    return useMemo(
      () =>
        StyleSheet.create(
          factory(colors, metrics, {
            isDark,
            resolvedMode,
            theme,
            smartAdapt,
          })
        ) as T,
      [colors, metrics, isDark, resolvedMode, theme, smartAdapt]
    );
  };
}

/**
 * Inline themed styles (convenient). Styles refresh when light/dark changes.
 *
 * For hot lists / many instances, prefer `createThemedStyles` defined
 * outside the component so the factory is not recreated every render.
 *
 * @example
 * ```tsx
 * const styles = useThemedStyles((colors, metrics) => ({
 *   card: {
 *     backgroundColor: colors.surface,
 *     borderRadius: metrics.radius.lg,
 *     padding: metrics.spacing.md,
 *   },
 * }));
 * ```
 */
export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: ThemedStyleFactory<T>
): T {
  const { colors, metrics, isDark, resolvedMode, theme, smartAdapt } =
    useTheme();

  return useMemo(
    () =>
      StyleSheet.create(
        factory(colors, metrics, {
          isDark,
          resolvedMode,
          theme,
          smartAdapt,
        })
      ) as T,
    [colors, metrics, isDark, resolvedMode, theme, smartAdapt, factory]
  );
}
