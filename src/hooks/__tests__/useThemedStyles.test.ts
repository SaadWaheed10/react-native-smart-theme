import { createTheme } from '../../generators/createTheme';
import type { ThemedStyleFactory } from '../useThemedStyles';

/**
 * Factory contract tests (no React Native runtime — Jest runs in Node).
 */
describe('themed styles factory', () => {
  it('maps theme tokens into style objects', () => {
    const theme = createTheme({ primary: '#6750A4' });
    const factory: ThemedStyleFactory<{
      box: { backgroundColor: string; padding: number };
      label: { color: string };
    }> = (colors, metrics) => ({
      box: {
        backgroundColor: colors.background,
        padding: metrics.spacing.md,
      },
      label: { color: colors.text },
    });

    const styles = factory(theme.light, theme.metrics, {
      isDark: false,
      resolvedMode: 'light',
      theme,
      smartAdapt: false,
    });

    expect(styles.box.backgroundColor).toBe(theme.light.background);
    expect(styles.label.color).toBe(theme.light.text);
    expect(styles.box.padding).toBe(16);
  });

  it('can branch on isDark', () => {
    const theme = createTheme({ primary: '#006A6A' });
    const factory: ThemedStyleFactory<{
      screen: { backgroundColor: string };
    }> = (colors, _m, ctx) => ({
      screen: {
        backgroundColor: ctx.isDark ? colors.background : colors.surface,
      },
    });

    const light = factory(theme.light, theme.metrics, {
      isDark: false,
      resolvedMode: 'light',
      theme,
      smartAdapt: false,
    });
    const dark = factory(theme.dark, theme.metrics, {
      isDark: true,
      resolvedMode: 'dark',
      theme,
      smartAdapt: false,
    });

    expect(light.screen.backgroundColor).toBe(theme.light.surface);
    expect(dark.screen.backgroundColor).toBe(theme.dark.background);
  });
});
