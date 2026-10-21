import { createCustomTheme, patchThemePalettes } from '../createCustomTheme';
import { createTheme } from '../createTheme';

describe('createCustomTheme', () => {
  it('merges custom light and dark colors onto a generated base', () => {
    const theme = createCustomTheme({
      primary: '#6750A4',
      light: { background: '#FFF8F0', text: '#111111' },
      dark: { background: '#0D0D12', text: '#F5F5F7' },
    });

    expect(theme.light.background).toBe('#FFF8F0');
    expect(theme.light.text).toBe('#111111');
    expect(theme.dark.background).toBe('#0D0D12');
    expect(theme.dark.text).toBe('#F5F5F7');
    // Gaps still filled
    expect(theme.light.primary).toBeTruthy();
    expect(theme.dark.primary).toBeTruthy();
  });

  it('resolves seed from light.primary when primary omitted', () => {
    const theme = createCustomTheme({
      light: { primary: '#E91E63', background: '#FFFFFF' },
      dark: { background: '#000000' },
    });
    expect(theme.seed).toBe('#E91E63');
  });

  it('patchThemePalettes merges immutably', () => {
    const base = createTheme({ primary: '#006A6A' });
    const next = patchThemePalettes(base, {
      light: { primary: '#FF0000' },
    });
    expect(next.light.primary).toBe('#FF0000');
    expect(base.light.primary).not.toBe('#FF0000');
  });
});
