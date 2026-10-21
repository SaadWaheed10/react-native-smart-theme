# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-10-21

### Added
- One-seed `createTheme` generator with WCAG AA light + dark palettes
- `ThemeProvider` + `useTheme` — light / dark / system, force mode, persistence
- Storage adapters: MMKV, AsyncStorage, in-memory fallback (optional peers; no crash if missing)
- WCAG + APCA contrast utilities, `getAdaptiveColor`, live `contrastWarning`
- `AdaptiveText` + `useAdaptiveColor`
- Accessibility: high contrast, color-blind safe variants, Reduce Motion
- Animated theme transitions when Reanimated is installed (safe no-op otherwise)
- Image → theme: median-cut extraction, `createThemeFromImage`, `useImageTheme`
- Material You–style MD3 tonal themes + Android dynamic seed helper
- Themed primitives: View, Text, Button, Card, Input, Switch, Divider
- `smartAdapt` policy: `false` (default) \| `true` \| `'ask'` (overall vs theme-only prompt)
- `SmartText`, `useSmartColor`, `ensureAccessiblePalette`, `scanPaletteContrast`, `adaptStyleColors`
- Theme export / import as JSON
- Expo example app
- Unit tests for contrast, theme generation, and smart adapt

### Safety
- Optional peers loaded dynamically (Metro-safe) — missing packages do not break the bundle
- Hydration will not overwrite a mode change the user already made
- `onPress={toggleMode}` press events are ignored safely
- `importTheme` on the provider never throws on bad JSON
