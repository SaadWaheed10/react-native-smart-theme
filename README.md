# react-native-smart-theme

Advanced dark / light theming for **Expo** and **React Native CLI**.

One-seed palettes · Image → theme · Material You · Adaptive text (WCAG + APCA) · Optional smart contrast · Accessibility

Works with **any React Native version** (`peerDependency: "*"`). Optional peers are never required to install or start your app.

---

## Install

```bash
npm install react-native-smart-theme
# or
yarn add react-native-smart-theme
```

That’s enough for core theming (generator, provider, themed components, contrast utils).

### Optional peers (install only what you use)

| Peer | When you need it |
|------|------------------|
| `react-native-reanimated` | `animateTransitions` |
| `react-native-mmkv` or `@react-native-async-storage/async-storage` | Persist mode across restarts (otherwise in-memory) |
| `react-native-image-colors` | `createThemeFromImage({ source: { uri } })` |
| `react-native-material-you-colors` | Real Android 12+ system accent |

```bash
npx expo install react-native-reanimated
npx expo install react-native-mmkv
# or: npx expo install @react-native-async-storage/async-storage
npx expo install react-native-image-colors
```

Missing peers **do not crash** the app — features quietly fall back (no animation, memory storage, etc.).

---

## Quick start

```tsx
import {
  ThemeProvider,
  useTheme,
  SmartText,
  createTheme,
  ThemedView,
  ThemedButton,
} from 'react-native-smart-theme';

const theme = createTheme({ primary: '#6750A4' });

export default function App() {
  return (
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      persist
      smartAdapt="ask" // false (default) | true | 'ask'
    >
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const { isDark, toggleMode } = useTheme();

  return (
    <ThemedView style={{ flex: 1, padding: 24, gap: 12 }}>
      <SmartText>Readable body text</SmartText>
      {/* Always wrap — never pass toggleMode directly to onPress */}
      <ThemedButton
        title={isDark ? 'Light' : 'Dark'}
        onPress={() => {
          void toggleMode();
        }}
      />
    </ThemedView>
  );
}
```

---

## Smart adapt (optional — never forced)

Some apps already hand-tune light/dark styles. Others don’t. Smart adapt is **opt-in**.

| `smartAdapt` | Behavior |
|--------------|----------|
| `false` (**default**) | Switch theme palette only — your styles stay as authored |
| `true` | Always repair contrast on theme tokens (text, on-primary, borders, …) |
| `'ask'` | On each `setMode` / `toggleMode`, ask the user |

**What “Apply overall” does:** repairs **theme color tokens** so text/borders stay WCAG-readable.  
**It does not** rewrite random hardcoded `#fff` in your own components — use `SmartText` / `colors.*` / `adaptStyleColors` for those.

```tsx
<ThemeProvider theme={theme} smartAdapt="ask">
  <App />
</ThemeProvider>

const { toggleMode, setSmartAdapt, smartAdapt, isHydrated } = useTheme();

void toggleMode();                      // may show dialog
void toggleMode({ smartAdapt: false }); // theme only, no dialog
void toggleMode({ smartAdapt: true });  // overall, no dialog
setSmartAdapt(true);                    // turn overall on without changing mode
```

Custom dialog:

```tsx
<ThemeProvider
  smartAdapt="ask"
  onSmartAdaptAsk={async () => {
    // return 'overall' | 'theme-only' | 'cancel'
    return 'theme-only';
  }}
>
```

`SmartText` / `useSmartColor` always pick a readable foreground for a background — independent of the provider flag (safe helpers, not a global force).

---

## ThemeProvider props

| Prop | Default | Notes |
|------|---------|--------|
| `theme` | required | From `createTheme` / image / Material You |
| `defaultMode` | `'system'` | `'light' \| 'dark' \| 'system'` |
| `forcedMode` | `null` | Force light/dark until cleared |
| `persist` | `true` | Save mode (needs MMKV/AsyncStorage for restarts) |
| `storageKey` | `@rn-smart-theme/mode` | Persistence key |
| `storage` | auto | Custom `{ getItem, setItem }` |
| `highContrast` | `false` | Stronger text/borders |
| `colorBlindVariant` | `'none'` | `protanopia` / `deuteranopia` / `tritanopia` |
| `animateTransitions` | `false` | Needs Reanimated; safe no-op if missing |
| `transitionDuration` | `300` | ms |
| `respectReduceMotion` | `true` | Skip animations when OS asks |
| `smartAdapt` | `false` | `false` \| `true` \| `'ask'` |
| `smartAdaptDefault` | `false` | Initial overall flag when using `'ask'` |
| `persistSmartAdapt` | `true` | Remember overall vs theme-only |
| `smartAdaptMinContrast` | `4.5` | WCAG ratio when overall is on |
| `onSmartAdaptAsk` | system Alert | Custom prompt |

### `useTheme()` returns

`colors`, `theme`, `mode`, `resolvedMode`, `isDark`, `setMode`, `forceMode`, `toggleMode`, `highContrast`, `setHighContrast`, `colorBlindVariant`, `setColorBlindVariant`, `reduceMotion`, `animateTransitions`, `transitionDuration`, `metrics`, `smartAdapt`, `smartAdaptPolicy`, `setSmartAdapt`, `isHydrated`, `exportTheme`, `importTheme`.

**Tip:** wait for `isHydrated` before treating `mode` as final if `persist` is on (avoids a brief flash of `defaultMode`).

**Tip:** always call `onPress={() => { void toggleMode(); }}` — do not pass `toggleMode` bare to `onPress`.

Nested `<ThemeProvider>` works for per-screen themes. Prefer different `storageKey`s if both persist.

---

## Generators

### One-seed

```ts
const theme = createTheme({
  primary: '#6750A4',
  secondary: '#625B71', // optional
  minContrast: 4.5,
  name: 'brand',
});
```

### Image → theme

```ts
// 1) Known colors (safest, no native deps)
const { theme } = createThemeFromColors({ colors: ['#6750A4', '#E8DEF8'] });

// 2) RGBA pixels (pure JS)
const { theme: t2 } = createThemeFromPixels({ pixels: { data, width, height } });

// 3) URI — needs react-native-image-colors; prefer the hook (handles errors)
const { theme, loading, error } = useImageTheme({ source: { uri } });
```

`createThemeFromImage` throws a clear error if it cannot extract colors — wrap in try/catch or use `useImageTheme`.

### Material You

```ts
const theme = createMaterialYouTheme({ primary: '#6750A4' }); // pure JS, all platforms
const { theme: sys, fromSystem } = await createSystemMaterialYouTheme('#6750A4');
```

---

## Components

`ThemedView` · `ThemedText` · `ThemedButton` · `ThemedCard` · `ThemedInput` · `ThemedSwitch` · `ThemedDivider` · `AdaptiveText` · `SmartText`

---

## Contrast helpers

```ts
import {
  getContrastRatio,
  getAdaptiveColor,
  contrastWarning,
  ensureAccessiblePalette,
  adaptStyleColors,
} from 'react-native-smart-theme';
```

---

## Theme JSON

```ts
import { exportTheme, importTheme } from 'react-native-smart-theme';

const json = exportTheme(theme);
const restored = importTheme(json); // module helper — throws if invalid

// Inside provider — never throws; invalid payloads are ignored in production
const { importTheme: applyTheme, exportTheme: dump } = useTheme();
```

---

## Example app

```bash
npm install
cd example && npm install
npm start
```

Demo: mode toggle with **ask** dialog, seed colors, classic / Material You / image generators, high contrast, color-blind variants.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Mode resets on reload | Install MMKV or AsyncStorage; `persist` alone uses memory fallback |
| No animation on toggle | Install Reanimated + its Babel plugin; or leave `animateTransitions={false}` |
| Image theme fails | Install `react-native-image-colors`, or pass a hex array / `getPixels` |
| Dialog every toggle | Set `smartAdapt={false}` or pass `toggleMode({ smartAdapt: false })` |
| Text still wrong on custom views | Use `SmartText` / `colors.text` — overall adapt only fixes theme tokens |

---

## License

MIT · [GitHub](https://github.com/SaadWaheed10/react-native-smart-theme)
