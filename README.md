# react-native-smart-theme

**Give your React Native app a complete light & dark theme from a single brand color — and keep every screen readable when users switch.**

Drop in one seed (or pull colors from an image). Get accessible palettes, themed components, and StyleSheets that update instantly on light ↔ dark. Optional smart contrast can ask whether to repair readability overall or leave your hand-tuned styles alone. Works on **Expo** and **React Native CLI**, with **zero required native peers**.

> One seed in → full theme out. Toggle mode → text stays visible. Your design system, without the pain.

One-seed palettes · Image → theme · Material You · Themed styles · Adaptive text (WCAG + APCA) · Optional smart contrast · Accessibility

**Repo:** [github.com/SaadWaheed10/react-native-smart-theme](https://github.com/SaadWaheed10/react-native-smart-theme)

---

## Contents

1. [Install](#install)
2. [Quick start](#quick-start)
3. [Color tokens](#color-tokens)
4. [ThemeProvider & useTheme](#themeprovider--usetheme)
5. [Smart adapt](#smart-adapt-optional--never-forced)
6. [Themed styles](#themed-styles-recommended-dx)
7. [Components](#components)
8. [Generators](#generators)
9. [Accessibility](#accessibility)
10. [Contrast helpers](#contrast-helpers)
11. [Theme JSON](#theme-json)
12. [Example app](#example-app)
13. [Troubleshooting](#troubleshooting)

---

## Install

```bash
npm install react-native-smart-theme
# or
yarn add react-native-smart-theme
```

That’s enough for core theming (generator, provider, themed components, styles, contrast utils).

### Optional peers (install only what you use)

| Peer | When you need it |
|------|------------------|
| `react-native-reanimated` | `animateTransitions` |
| `react-native-mmkv` **or** `@react-native-async-storage/async-storage` | Persist mode across app restarts (otherwise in-memory) |
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
  createThemedStyles,
  ThemedView,
  ThemedButton,
} from 'react-native-smart-theme';

const theme = createTheme({ primary: '#6750A4' });

const useStyles = createThemedStyles((colors, metrics) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: metrics.spacing.md,
    gap: metrics.spacing.sm,
  },
}));

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
  const styles = useStyles();

  return (
    <ThemedView style={styles.screen}>
      <SmartText>Readable body text</SmartText>
      <ThemedButton
        title={isDark ? 'Light' : 'Dark'}
        onPress={() => {
          void toggleMode(); // always wrap — don't pass toggleMode bare to onPress
        }}
      />
    </ThemedView>
  );
}
```

---

## Color tokens

Every theme has `light` and `dark` palettes. Active colors are on `useTheme().colors`:

| Token | Use for |
|-------|---------|
| `background` | Screen background |
| `surface` / `surfaceElevated` | Cards, sheets |
| `primary` / `onPrimary` | Main actions + text/icons on them |
| `primaryContainer` / `onPrimaryContainer` | Soft primary chips / selected rows |
| `secondary` / `onSecondary` (+ containers) | Secondary actions |
| `text` / `textSecondary` / `textMuted` / `textInverse` | Typography |
| `border` / `borderSubtle` | Dividers, outlines |
| `error` / `success` / `warning` / `info` (+ `on*` / containers) | Status |
| `overlay` / `focus` / `ripple` | Modals, a11y focus, press feedback |

Also: `theme.seed`, `theme.metrics.spacing`, `theme.metrics.radius`.

---

## ThemeProvider & useTheme

### Props

| Prop | Default | Notes |
|------|---------|--------|
| `theme` | required | From `createTheme` / image / Material You |
| `defaultMode` | `'system'` | `'light' \| 'dark' \| 'system'` |
| `forcedMode` | `null` | Force light/dark until cleared |
| `persist` | `true` | Save mode (needs MMKV/AsyncStorage for restarts) |
| `storageKey` | `@rn-smart-theme/mode` | Persistence key |
| `storage` | auto | Custom `{ getItem, setItem, removeItem? }` |
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

| Field | Meaning |
|-------|---------|
| `colors` | Active palette (`ColorTokens`) |
| `theme` | Full theme (light + dark + metrics) |
| `mode` | `'light' \| 'dark' \| 'system'` |
| `resolvedMode` | Actual `'light' \| 'dark'` in use |
| `isDark` | Shortcut for dark appearance |
| `setMode(mode, options?)` | Change mode (may ask if `smartAdapt="ask"`) |
| `toggleMode(options?)` | Flip light ↔ dark |
| `forceMode('light' \| 'dark' \| null)` | Temporary force |
| `highContrast` / `setHighContrast` | A11y boost |
| `colorBlindVariant` / `setColorBlindVariant` | CVD-safe remap |
| `smartAdapt` | Whether overall contrast repair is on |
| `smartAdaptPolicy` | Provider policy (`false` / `true` / `'ask'`) |
| `setSmartAdapt(boolean)` | Turn overall on/off without changing mode |
| `isHydrated` | Persistence finished loading |
| `metrics` | Spacing + radius |
| `exportTheme()` / `importTheme(...)` | JSON round-trip (import never throws) |
| `reduceMotion` / `animateTransitions` / `transitionDuration` | Motion |

**Tips**

- Wait for `isHydrated` before treating `mode` as final when `persist` is on.
- Always: `onPress={() => { void toggleMode(); }}` — never `onPress={toggleMode}`.
- Nested `<ThemeProvider>` works for per-screen themes; use different `storageKey`s if both persist.

---

## Smart adapt (optional — never forced)

Some apps already hand-tune light/dark. Others don’t. Smart adapt is **opt-in**.

| `smartAdapt` | Behavior |
|--------------|----------|
| `false` (**default**) | Theme palette only — your styles stay as authored |
| `true` | Always repair contrast on theme tokens |
| `'ask'` | On each `setMode` / `toggleMode`, ask the user |

**“Apply overall”** repairs **theme tokens** (text, on-primary, borders, …).  
**It does not** rewrite hardcoded `#fff` in your components — use `SmartText`, `colors.*`, or `adaptStyleColors` for those.

```tsx
<ThemeProvider theme={theme} smartAdapt="ask">
  <App />
</ThemeProvider>

const { toggleMode, setSmartAdapt } = useTheme();

void toggleMode();                      // may show dialog
void toggleMode({ smartAdapt: false }); // theme only, no dialog
void toggleMode({ smartAdapt: true });  // overall, no dialog
setSmartAdapt(true);
```

Custom dialog:

```tsx
<ThemeProvider
  smartAdapt="ask"
  onSmartAdaptAsk={async () => {
    // 'overall' | 'theme-only' | 'cancel'
    return 'theme-only';
  }}
>
```

---

## Themed styles (recommended DX)

StyleSheets from theme tokens — refresh automatically on light/dark switch.

```tsx
import { createThemedStyles, useThemedStyles } from 'react-native-smart-theme';

// Best: define once outside the component
const useStyles = createThemedStyles((colors, metrics, { isDark }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: metrics.spacing.md,
  },
  title: { color: colors.text, fontSize: 22 },
  badge: {
    backgroundColor: isDark ? colors.primaryContainer : colors.primary,
    borderRadius: metrics.radius.md,
    padding: metrics.spacing.sm,
  },
}));

function Home() {
  const styles = useStyles();
  return <View style={styles.screen} />;
}

// Inline (fine for small screens):
const styles = useThemedStyles((colors, metrics) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: metrics.radius.lg,
    padding: metrics.spacing.md,
  },
}));
```

---

## Components

| Component | Purpose |
|-----------|---------|
| `ThemedView` | View with `background` / `borderColor` tokens |
| `ThemedText` | Text with variants: `body`, `secondary`, `muted`, `inverse`, `primary`, `error`, … |
| `ThemedButton` | Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive` |
| `ThemedCard` | Surface card (`elevated`, `outlined`) |
| `ThemedInput` | Themed `TextInput` |
| `ThemedSwitch` | Switch tinted with primary |
| `ThemedDivider` | Hairline divider |
| `AdaptiveText` | Picks ink for any `backgroundColor` (WCAG / APCA) |
| `SmartText` | Always-readable text for theme (or custom) background |

```tsx
<ThemedView background="surface" borderColor="border">
  <ThemedText variant="secondary">Caption</ThemedText>
  <ThemedButton title="Save" variant="primary" onPress={onSave} />
  <AdaptiveText backgroundColor={colors.primary}>On brand</AdaptiveText>
  <SmartText backgroundColor={colors.error}>On error</SmartText>
</ThemedView>
```

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
// theme.light + theme.dark
```

### Image → theme

```ts
// 1) Known colors (safest, no native deps)
const { theme } = createThemeFromColors({ colors: ['#6750A4', '#E8DEF8'] });

// 2) RGBA pixels (pure JS median-cut)
const { theme: t2 } = createThemeFromPixels({ pixels: { data, width, height } });

// 3) URI — needs react-native-image-colors; prefer the hook (handles errors)
const { theme, loading, error } = useImageTheme({ source: { uri } });
```

`createThemeFromImage` throws if it cannot extract colors — use try/catch or `useImageTheme`.

### Material You

```ts
const theme = createMaterialYouTheme({ primary: '#6750A4' }); // pure JS, all platforms
const { theme: sys, fromSystem } = await createSystemMaterialYouTheme('#6750A4');
```

---

## Accessibility

```tsx
<ThemeProvider
  theme={theme}
  highContrast
  colorBlindVariant="protanopia" // | deuteranopia | tritanopia | none
  respectReduceMotion // default true — skips animations when OS asks
>
```

Or at runtime:

```ts
const { setHighContrast, setColorBlindVariant } = useTheme();
setHighContrast(true);
setColorBlindVariant('deuteranopia');
```

---

## Contrast helpers

```ts
import {
  getContrastRatio,
  getAdaptiveColor,
  contrastWarning,
  ensureAccessiblePalette,
  adaptStyleColors,
  useAdaptiveColor,
  useSmartColor,
} from 'react-native-smart-theme';

const ink = getAdaptiveColor('#6750A4');
const { color, passes } = useAdaptiveColor(bg, { algorithm: 'APCA' });
const fixed = adaptStyleColors({ color: '#888', backgroundColor: '#999' });
```

---

## Theme JSON

```ts
import { exportTheme, importTheme } from 'react-native-smart-theme';

const json = exportTheme(theme);
const restored = importTheme(json); // throws if invalid

// Inside provider — never throws; bad payloads ignored (warns in __DEV__)
const { exportTheme: dump, importTheme: apply } = useTheme();
```

---

## Example app

```bash
npm install
cd example && npm install
npm start
```

Demo: ask-on-toggle, seed colors, classic / Material You / image generators, high contrast, color-blind variants, `createThemedStyles`, safe-area insets.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Mode resets on reload | Install MMKV or AsyncStorage; without them, persist is in-memory only |
| No animation on toggle | Install Reanimated (+ Babel plugin); or leave `animateTransitions={false}` |
| Image theme fails | Install `react-native-image-colors`, or pass hex colors / `getPixels` |
| Dialog on every toggle | `smartAdapt={false}` or `toggleMode({ smartAdapt: false })` |
| Text still wrong on custom views | Use `SmartText` / `colors.text` — overall adapt only fixes theme tokens |
| Flash of wrong mode on launch | Wait for `isHydrated` from `useTheme()` |

---

## License

MIT · [GitHub](https://github.com/SaadWaheed10/react-native-smart-theme)
