import { createTheme } from '../../generators/createTheme';
import { getContrastRatio } from '../../utils/contrast';
import {
  adaptStyleColors,
  ensureAccessiblePalette,
  scanPaletteContrast,
  smartForeground,
  withSmartAdapt,
} from '../adaptPalette';

describe('smartAdapt', () => {
  it('repairs a deliberately broken palette', () => {
    const theme = createTheme({ primary: '#6750A4' });
    const broken = {
      ...theme.light,
      text: '#CCCCCC', // fails on near-white background
      onPrimary: theme.light.primary, // same as bg — fails hard
    };

    const scan = scanPaletteContrast(broken);
    expect(scan.ok).toBe(false);
    expect(scan.issues.length).toBeGreaterThan(0);

    const fixed = ensureAccessiblePalette(broken, { logFixes: false });
    expect(getContrastRatio(fixed.text, fixed.background)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(getContrastRatio(fixed.onPrimary, fixed.primary)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it('withSmartAdapt fixes both modes', () => {
    const theme = createTheme({ primary: '#006A6A' });
    const broken = {
      ...theme,
      light: { ...theme.light, text: '#EEEEEE' },
      dark: { ...theme.dark, text: '#111111' },
    };
    const adapted = withSmartAdapt(broken);
    expect(
      getContrastRatio(adapted.light.text, adapted.light.background)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(adapted.dark.text, adapted.dark.background)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('smartForeground picks readable ink', () => {
    expect(smartForeground('#000000')).toBe('#FFFFFF');
    expect(smartForeground('#FFFFFF')).toBe('#000000');
  });

  it('adaptStyleColors fixes failing inline styles', () => {
    const fixed = adaptStyleColors({
      color: '#888888',
      backgroundColor: '#999999',
    });
    expect(
      getContrastRatio(fixed.color!, fixed.backgroundColor!)
    ).toBeGreaterThanOrEqual(4.5);
  });
});
