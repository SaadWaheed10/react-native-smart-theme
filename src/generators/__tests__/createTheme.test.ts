import { getContrastRatio } from '../../utils/contrast';
import {
  createTheme,
  exportTheme,
  importTheme,
  withHighContrast,
} from '../createTheme';
import { createThemeFromColors } from '../createThemeFromImage';
import { extractDominantColors, pickVibrantSeed } from '../extractColors';
import { createMaterialYouTheme, materialTone } from '../materialYou';
import { withColorBlindSafe } from '../../accessibility/colorBlind';

describe('createTheme', () => {
  it('builds light + dark palettes from one seed', () => {
    const theme = createTheme({ primary: '#6750A4', name: 'test' });
    expect(theme.seed).toBe('#6750A4');
    expect(theme.light.primary).toBeTruthy();
    expect(theme.dark.primary).toBeTruthy();
    expect(theme.meta?.name).toBe('test');
  });

  it('keeps text WCAG AA on background', () => {
    const theme = createTheme({ primary: '#6750A4' });
    expect(
      getContrastRatio(theme.light.text, theme.light.background)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(theme.dark.text, theme.dark.background)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('exports and imports JSON', () => {
    const theme = createTheme({ primary: '#FF5722' });
    const json = exportTheme(theme);
    const restored = importTheme(json);
    expect(restored.seed).toBe(theme.seed);
    expect(restored.light.primary).toBe(theme.light.primary);
  });

  it('boosts contrast in high-contrast mode', () => {
    const theme = createTheme({ primary: '#6750A4' });
    const hc = withHighContrast(theme);
    expect(hc.light.border).toBe('#000000');
    expect(hc.dark.border).toBe('#FFFFFF');
  });
});

describe('image → theme', () => {
  it('extracts dominant colors from pixels', () => {
    const data = new Uint8Array([
      103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164, 255,
      230, 120, 40, 255, 230, 120, 40, 255, 230, 120, 40, 255, 230, 120, 40, 255,
    ]);
    const swatches = extractDominantColors(
      { data, width: 4, height: 2 },
      { count: 2, ignoreNeutrals: false, quality: 1 }
    );
    expect(swatches.length).toBeGreaterThanOrEqual(1);
    expect(pickVibrantSeed(swatches)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('creates a theme from a color list', () => {
    const { theme, primary } = createThemeFromColors({
      colors: ['#6750A4', '#E8DEF8', '#21005D'],
    });
    expect(theme.seed).toBe(primary);
    expect(theme.light.background).toBeTruthy();
  });
});

describe('material you + a11y', () => {
  it('creates MD3 tonal theme', () => {
    const theme = createMaterialYouTheme({ primary: '#6750A4' });
    expect(theme.meta?.name).toContain('material-you');
    expect(materialTone('#6750A4', 40)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('applies color-blind safe remapping', () => {
    const theme = createTheme({ primary: '#E53935' });
    const safe = withColorBlindSafe(theme, 'protanopia');
    expect(safe.light.primary).not.toBe(theme.light.primary);
  });
});
