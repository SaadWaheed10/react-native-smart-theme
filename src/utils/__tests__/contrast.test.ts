import {
  checkContrast,
  contrastWarning,
  ensureContrast,
  getAdaptiveColor,
  getApcaMagnitude,
  getContrastRatio,
  meetsWcag,
} from '../contrast';

describe('contrast utils', () => {
  it('computes WCAG contrast for black on white', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(meetsWcag('#000000', '#FFFFFF', 'AAA')).toBe(true);
  });

  it('picks adaptive color for dark vs light backgrounds', () => {
    expect(getAdaptiveColor('#000000')).toBe('#FFFFFF');
    expect(getAdaptiveColor('#FFFFFF')).toBe('#000000');
  });

  it('ensures contrast by mixing toward black/white', () => {
    const fixed = ensureContrast('#888888', '#FFFFFF', 4.5);
    expect(getContrastRatio(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('returns APCA magnitude for typical pairs', () => {
    expect(getApcaMagnitude('#000000', '#FFFFFF')).toBeGreaterThan(90);
  });

  it('warns when contrast fails', () => {
    const warn = contrastWarning('#777777', '#888888');
    expect(warn).toEqual(expect.stringContaining('WCAG'));
    expect(contrastWarning('#000000', '#FFFFFF')).toBeNull();
  });

  it('checkContrast honors algorithm', () => {
    const wcag = checkContrast('#000000', '#FFFFFF', 'WCAG');
    expect(wcag.passes).toBe(true);
    const apca = checkContrast('#000000', '#FFFFFF', 'APCA');
    expect(apca.passes).toBe(true);
  });
});
