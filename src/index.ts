// Core
export { ThemeProvider } from './core/ThemeProvider';
export { ThemeContext } from './core/ThemeContext';
export { ThemeTransition } from './core/ThemeTransition';

// Generators
export {
  createTheme,
  withHighContrast,
  exportTheme,
  importTheme,
} from './generators/createTheme';

export {
  extractDominantColors,
  pickVibrantSeed,
} from './generators/extractColors';
export type {
  PixelBuffer,
  ExtractColorsOptions,
  DominantColor,
} from './generators/extractColors';

export {
  createThemeFromColors,
  createThemeFromPixels,
  createThemeFromImage,
  themeFromImageUri,
} from './generators/createThemeFromImage';
export type {
  CreateThemeFromColorsOptions,
  CreateThemeFromPixelsOptions,
  CreateThemeFromImageOptions,
  ImageColorSource,
  ImageThemeResult,
} from './generators/createThemeFromImage';

export {
  materialTone,
  createMaterialYouTheme,
  getAndroidDynamicSeed,
  createSystemMaterialYouTheme,
} from './generators/materialYou';
export type { MaterialYouOptions } from './generators/materialYou';

// Accessibility
export {
  simulateColorBlind,
  withColorBlindSafe,
  applyHighContrast,
  useReduceMotion,
  shouldAnimateTransitions,
} from './accessibility';

// Hooks
export { useTheme, useThemeOptional } from './hooks/useTheme';
export { useAdaptiveColor } from './hooks/useAdaptiveColor';
export type {
  UseAdaptiveColorOptions,
  UseAdaptiveColorResult,
} from './hooks/useAdaptiveColor';
export {
  useAnimatedThemeColor,
  useAnimatedColors,
} from './hooks/useAnimatedThemeColor';
export { useImageTheme } from './hooks/useImageTheme';
export type { UseImageThemeResult } from './hooks/useImageTheme';

// Components
export {
  AdaptiveText,
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedInput,
  ThemedSwitch,
  ThemedDivider,
} from './components';
export type {
  AdaptiveTextProps,
  ThemedViewProps,
  ThemedTextProps,
  ThemedTextVariant,
  ThemedButtonProps,
  ThemedButtonVariant,
  ThemedCardProps,
  ThemedInputProps,
  ThemedSwitchProps,
  ThemedDividerProps,
} from './components';

// Storage
export {
  createDefaultStorage,
  memoryStorage,
} from './storage/createStorage';

// Utils
export {
  // color
  clamp,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  relativeLuminance,
  mix,
  lighten,
  darken,
  saturate,
  rotateHue,
  setLightness,
  setSaturation,
  withAlpha,
  perceivedBrightness,
  // contrast
  getContrastRatio,
  meetsWcag,
  getApcaContrast,
  getApcaMagnitude,
  meetsApca,
  checkContrast,
  getAdaptiveColor,
  ensureContrast,
  contrastWarning,
  // interpolate
  interpolateHex,
  interpolateColorTokens,
} from './utils';

export type { RGB, HSL, ContrastResult, AdaptiveColorOptions } from './utils';

// Types
export type {
  ThemeMode,
  ResolvedMode,
  ContrastAlgorithm,
  ColorBlindVariant,
  HexColor,
  ColorTokens,
  ThemeMetrics,
  Theme,
  CreateThemeOptions,
  ThemeStorage,
  ThemeProviderProps,
  ThemeContextValue,
} from './types';
