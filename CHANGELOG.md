# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-10-21

### Added
- One-seed `createTheme` generator with WCAG AA light + dark palettes
- `ThemeProvider` + `useTheme` — light / dark / system, force mode, persistence
- Storage adapters: MMKV, AsyncStorage, in-memory fallback
- WCAG + APCA contrast utilities, `getAdaptiveColor`, live `contrastWarning`
- `AdaptiveText` + `useAdaptiveColor`
- Accessibility: high contrast, color-blind safe variants, Reduce Motion
- Animated theme transitions (optional Reanimated) + color interpolation hooks
- Image → theme: median-cut extraction, `createThemeFromImage`, `useImageTheme`
- Material You–style MD3 tonal themes + Android dynamic seed helper
- Themed primitives: View, Text, Button, Card, Input, Switch, Divider
- Theme export / import as JSON
- Expo example app
- Unit tests for contrast, theme generation, image extract, a11y
