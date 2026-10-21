# react-native-smart-theme

Advanced dark / light theming for **Expo** and **React Native CLI**.

One-seed palettes · Image → theme · Material You · Adaptive text (WCAG + APCA) · Animated transitions · Accessibility

## Install

```bash
npm install react-native-smart-theme
# or
yarn add react-native-smart-theme
```

Optional peers:

```bash
npx expo install react-native-reanimated          # animated transitions
npx expo install react-native-mmkv                 # fast persistence
# or
npx expo install @react-native-async-storage/async-storage

npx expo install react-native-image-colors         # image URI → colors
# Android 12+ system accent (optional):
yarn add react-native-material-you-colors
```

## Quick start

```tsx
import {
  ThemeProvider,
  useTheme,
  AdaptiveText,
  createTheme,
  ThemedView,
  ThemedText,
  ThemedButton,
} from 'react-native-smart-theme';

const theme = createTheme({ primary: '#6750A4' });

export default function App() {
  return (
    <ThemeProvider theme={theme} defaultMode="system" persist animateTransitions>
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const { colors, isDark, toggleMode } = useTheme();

  return (
    <ThemedView style={{ flex: 1, padding: 24, gap: 12 }}>
      <ThemedText>Smart Theme</ThemedText>
      <AdaptiveText backgroundColor={colors.primary}>On brand</AdaptiveText>
      <ThemedButton title={isDark ? 'Light' : 'Dark'} onPress={toggleMode} />
    </ThemedView>
  );
}
```

## API reference

### `createTheme({ primary })`

One-seed generator → full light + dark `ColorTokens` (WCAG AA by default).

```ts
const theme = createTheme({
  primary: '#6750A4',
  secondary: '#625B71', // optional
  minContrast: 4.5,
  name: 'brand',
});
```

### `ThemeProvider` / `useTheme`

| Prop | Default | Notes |
|------|---------|--------|
| `theme` | required | From `createTheme` / image / Material You |
| `defaultMode` | `'system'` | `'light' \| 'dark' \| 'system'` |
| `forcedMode` | `null` | Force light/dark until cleared |
| `persist` | `true` | Save mode preference |
| `highContrast` | `false` | Boost text/borders |
| `colorBlindVariant` | `'none'` | `protanopia` / `deuteranopia` / `tritanopia` |
| `animateTransitions` | `false` | Needs Reanimated |
| `respectReduceMotion` | `true` | Skip animations when OS asks |

`useTheme()` returns `colors`, `mode`, `resolvedMode`, `isDark`, `setMode`, `forceMode`, `toggleMode`, a11y setters, `exportTheme` / `importTheme`, metrics.

Nested providers work — wrap a screen to force a local theme.

### Adaptive text & contrast

```ts
import {
  AdaptiveText,
  useAdaptiveColor,
  getContrastRatio,
  getApcaContrast,
  contrastWarning,
} from 'react-native-smart-theme';

<AdaptiveText backgroundColor="#6750A4" algorithm="APCA">Label</AdaptiveText>

const { color, passes } = useAdaptiveColor(bg, { algorithm: 'WCAG' });
```

### Image → theme

```ts
import {
  createThemeFromColors,
  createThemeFromPixels,
  createThemeFromImage,
  useImageTheme,
  extractDominantColors,
} from 'react-native-smart-theme';

// Known palette
const { theme } = createThemeFromColors({ colors: ['#6750A4', '#E8DEF8'] });

// RGBA buffer (pure JS median-cut)
const { theme: t2 } = createThemeFromPixels({ pixels: { data, width, height } });

// URI / asset (optional peer: react-native-image-colors)
const { theme: t3 } = await createThemeFromImage({ source: { uri } });

// Hook
const { theme, loading, error } = useImageTheme({ source: { uri } });
```

### Material You

```ts
import {
  createMaterialYouTheme,
  createSystemMaterialYouTheme,
} from 'react-native-smart-theme';

const theme = createMaterialYouTheme({ primary: '#6750A4' });

const { theme: sys, fromSystem } = await createSystemMaterialYouTheme('#6750A4');
```

### Themed primitives

`ThemedView` · `ThemedText` · `ThemedButton` · `ThemedCard` · `ThemedInput` · `ThemedSwitch` · `ThemedDivider` · `AdaptiveText`

### Theme JSON

```ts
import { exportTheme, importTheme } from 'react-native-smart-theme';

const json = exportTheme(theme);
const restored = importTheme(json);
```

## Example app

```bash
# from repo root
npm install
cd example && npm install
npm start
```

Demo covers mode toggle, seed switching, classic / Material You / image generators, high contrast, and color-blind variants.

## Feature checklist

| Feature | Status |
|--------|--------|
| One-seed `createTheme` (WCAG AA) | ✅ |
| Light / Dark / System + persistence | ✅ |
| WCAG + APCA, AdaptiveText | ✅ |
| High contrast + color-blind + Reduce Motion | ✅ |
| Animated transitions | ✅ |
| Themed primitives | ✅ |
| Theme export / import | ✅ |
| Image → theme | ✅ |
| Material You tonal + Android dynamic seed | ✅ |
| Expo example | ✅ |
| Unit tests | ✅ |

## Publish

```bash
npm test
npm run build
npm publish --access public
```

## License

MIT
