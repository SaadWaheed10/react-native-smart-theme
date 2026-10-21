import { Alert } from 'react-native';
import type { SmartAdaptChoice } from '../types/theme';

/**
 * System Alert fallback when `smartAdaptDialog={false}`.
 * Prefer the built-in SmartAdaptDialog for clearer hints.
 */
export function askSmartAdaptDefault(): Promise<SmartAdaptChoice> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (choice: SmartAdaptChoice) => {
      if (settled) return;
      settled = true;
      resolve(choice);
    };

    Alert.alert(
      'Switch appearance',
      'Apply overall — UI colors + text/icon contrast (keeps content readable).\n\nTheme only — UI palette only; leaves your custom text colors as coded.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => finish('cancel'),
        },
        {
          text: 'Theme only',
          onPress: () => finish('theme-only'),
        },
        {
          text: 'Apply overall',
          onPress: () => finish('overall'),
        },
      ],
      { cancelable: true, onDismiss: () => finish('cancel') }
    );
  });
}
