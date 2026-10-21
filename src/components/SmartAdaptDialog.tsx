import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { SmartAdaptChoice } from '../types/theme';

export interface SmartAdaptDialogProps {
  visible: boolean;
  onChoose: (choice: SmartAdaptChoice) => void;
}

/**
 * In-app dialog for smartAdapt="ask".
 * Clearer than a system Alert — explains overall vs theme-only.
 */
export function SmartAdaptDialog({ visible, onChoose }: SmartAdaptDialogProps) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const palette = dark
    ? {
        scrim: 'rgba(0,0,0,0.65)',
        card: '#1C1B1F',
        title: '#E6E1E5',
        body: '#CAC4D0',
        hint: '#938F99',
        border: '#49454F',
        primary: '#D0BCFF',
        primaryText: '#381E72',
        mutedBtn: '#2B2930',
        mutedText: '#E6E1E5',
      }
    : {
        scrim: 'rgba(0,0,0,0.45)',
        card: '#FFFBFE',
        title: '#1C1B1F',
        body: '#49454F',
        hint: '#79747E',
        border: '#E7E0EC',
        primary: '#6750A4',
        primaryText: '#FFFFFF',
        mutedBtn: '#F3EDF7',
        mutedText: '#1C1B1F',
      };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onChoose('cancel')}
    >
      <View style={[styles.scrim, { backgroundColor: palette.scrim }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.title, { color: palette.title }]}>
            Switch appearance
          </Text>
          <Text style={[styles.subtitle, { color: palette.body }]}>
            How should light / dark mode apply?
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => onChoose('overall')}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={[styles.optionTitle, { color: palette.primaryText }]}>
              Apply overall
            </Text>
            <Text style={[styles.optionHint, { color: palette.primaryText }]}>
              UI colors + text / icon contrast. Best if you did not hand-tune
              dark & light styles — keeps content readable.
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => onChoose('theme-only')}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: palette.mutedBtn,
                borderColor: palette.border,
                borderWidth: 1,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={[styles.optionTitle, { color: palette.mutedText }]}>
              Theme only
            </Text>
            <Text style={[styles.optionHint, { color: palette.hint }]}>
              Only UI palette colors (surfaces, buttons, accents). Leaves your
              custom text colors as you coded them.
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => onChoose('cancel')}
            style={styles.cancel}
          >
            <Text style={[styles.cancelText, { color: palette.hint }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  option: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionHint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.95,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
