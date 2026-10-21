import type { Theme } from '../types/theme';
import { relativeLuminance } from '../utils/color';
import { ensureContrast } from '../utils/contrast';

/**
 * Apply high-contrast boosts to both light and dark palettes.
 * Pushes text / borders toward black or white for AAA-ish separation.
 */
export function applyHighContrast(theme: Theme, minContrast = 7): Theme {
  const boost = (
    tokens: Theme['light'],
    ink: string,
    inkSecondary: string,
    inkMuted: string,
    border: string,
    borderSubtle: string
  ) => ({
    ...tokens,
    text: ensureContrast(ink, tokens.background, minContrast),
    textSecondary: ensureContrast(inkSecondary, tokens.background, 4.5),
    textMuted: ensureContrast(inkMuted, tokens.background, 3),
    border,
    borderSubtle,
    focus: ensureContrast(
      tokens.primary,
      tokens.background,
      3
    ),
    // Ensure on-* stay readable on solid roles
    onPrimary: ensureContrast(
      relativeLuminance(tokens.primary) > 0.179 ? '#000000' : '#FFFFFF',
      tokens.primary,
      minContrast
    ),
  });

  return {
    ...theme,
    light: boost(
      theme.light,
      '#000000',
      '#1A1A1A',
      '#333333',
      '#000000',
      '#333333'
    ),
    dark: boost(
      theme.dark,
      '#FFFFFF',
      '#F0F0F0',
      '#DDDDDD',
      '#FFFFFF',
      '#CCCCCC'
    ),
  };
}
