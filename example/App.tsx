import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  AdaptiveText,
  SmartText,
  ThemeProvider,
  ThemedButton,
  ThemedCard,
  ThemedDivider,
  ThemedInput,
  ThemedSwitch,
  ThemedText,
  ThemedView,
  createMaterialYouTheme,
  createTheme,
  createThemeFromColors,
  createThemedStyles,
  type ColorBlindVariant,
  useTheme,
} from 'react-native-smart-theme';

const SEEDS = ['#6750A4', '#006A6A', '#B3261E', '#E65100'] as const;

type Engine = 'classic' | 'material' | 'image';

function buildTheme(seed: string, engine: Engine) {
  if (engine === 'material') {
    return createMaterialYouTheme({ primary: seed, name: 'demo-material' });
  }
  if (engine === 'image') {
    return createThemeFromColors({
      colors: [seed, '#E8DEF8', '#21005D', '#FFB4AB'],
      name: 'demo-image',
    }).theme;
  }
  return createTheme({ primary: seed, name: 'demo-classic' });
}

export default function App() {
  const [seed, setSeed] = useState<string>(SEEDS[0]);
  const [engine, setEngine] = useState<Engine>('classic');
  const theme = useMemo(() => buildTheme(seed, engine), [seed, engine]);

  return (
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      persist
      // Ask on each toggle: apply overall contrast OR theme palette only
      smartAdapt="ask"
    >
      <Demo
        seed={seed}
        onSeed={setSeed}
        engine={engine}
        onEngine={setEngine}
      />
    </ThemeProvider>
  );
}

function Demo({
  seed,
  onSeed,
  engine,
  onEngine,
}: {
  seed: string;
  onSeed: (s: string) => void;
  engine: Engine;
  onEngine: (e: Engine) => void;
}) {
  const {
    colors,
    isDark,
    toggleMode,
    setMode,
    highContrast,
    setHighContrast,
    colorBlindVariant,
    setColorBlindVariant,
    metrics,
  } = useTheme();
  const styles = useStyles();

  const [notifications, setNotifications] = useState(true);

  const cycleBlind = () => {
    const order: ColorBlindVariant[] = [
      'none',
      'protanopia',
      'deuteranopia',
      'tritanopia',
    ];
    const next = order[(order.indexOf(colorBlindVariant) + 1) % order.length];
    setColorBlindVariant(next);
  };

  return (
    <ThemedView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.content, { gap: metrics.spacing.md }]}>
          <ThemedText style={styles.title}>Smart Theme</ThemedText>
          <ThemedText variant="secondary">
            {engine} · {isDark ? 'dark' : 'light'} · seed {seed}
          </ThemedText>

          <ThemedCard>
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: colors.primary,
                  borderRadius: metrics.radius.lg,
                },
              ]}
            >
              <AdaptiveText
                backgroundColor={colors.primary}
                style={styles.heroText}
              >
                AdaptiveText on primary
              </AdaptiveText>
            </View>
            <ThemedDivider style={{ marginVertical: 12 }} />
            <SmartText>
              Tap Toggle — you will be asked whether to apply smart contrast
              overall, or only switch the theme (for apps that already
              hand-tuned light/dark).
            </SmartText>
            <ThemedText variant="muted" style={{ marginTop: 8 }}>
              Surface / border / text tokens follow the active mode and a11y
              settings automatically.
            </ThemedText>
          </ThemedCard>

          <ThemedCard>
            <ThemedText style={styles.section}>Mode</ThemedText>
            <View style={styles.row}>
              <ThemedButton
                title="Toggle"
                onPress={() => {
                  void toggleMode();
                }}
              />
              <ThemedButton
                title="System"
                variant="outline"
                onPress={() => {
                  void setMode('system');
                }}
              />
            </View>
          </ThemedCard>

          <ThemedCard>
            <ThemedText style={styles.section}>Seed color</ThemedText>
            <View style={styles.rowWrap}>
              {SEEDS.map((s) => (
                <ThemedButton
                  key={s}
                  title={s}
                  variant={seed === s ? 'primary' : 'outline'}
                  onPress={() => onSeed(s)}
                  style={styles.chip}
                />
              ))}
            </View>
          </ThemedCard>

          <ThemedCard>
            <ThemedText style={styles.section}>Generator</ThemedText>
            <View style={styles.rowWrap}>
              {(['classic', 'material', 'image'] as Engine[]).map((e) => (
                <ThemedButton
                  key={e}
                  title={e}
                  variant={engine === e ? 'secondary' : 'ghost'}
                  onPress={() => onEngine(e)}
                  style={styles.chip}
                />
              ))}
            </View>
          </ThemedCard>

          <ThemedCard>
            <ThemedText style={styles.section}>Accessibility</ThemedText>
            <View style={styles.switchRow}>
              <ThemedText>High contrast</ThemedText>
              <ThemedSwitch
                value={highContrast}
                onValueChange={setHighContrast}
              />
            </View>
            <ThemedButton
              title={`Color-blind: ${colorBlindVariant}`}
              variant="outline"
              onPress={cycleBlind}
            />
            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <ThemedText>Notifications (demo switch)</ThemedText>
              <ThemedSwitch
                value={notifications}
                onValueChange={setNotifications}
              />
            </View>
          </ThemedCard>

          <ThemedCard>
            <ThemedText style={styles.section}>Input</ThemedText>
            <ThemedInput placeholder="Themed input field" />
          </ThemedCard>

          <ThemedText variant="muted" style={styles.footer}>
            react-native-smart-theme · Expo example
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const useStyles = createThemedStyles((colors, metrics) => ({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  section: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 10,
    color: colors.text,
  },
  hero: { padding: 20 },
  heroText: { fontSize: 18, fontWeight: '600' as const },
  row: { flexDirection: 'row' as const, gap: 10, flexWrap: 'wrap' as const },
  rowWrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: { minWidth: 0, paddingHorizontal: 12 },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: 8,
    color: colors.textMuted,
  },
}));
