import { Alert } from 'react-native';
import type { SmartAdaptChoice } from '../types/theme';

/**
 * Default system dialog when `smartAdapt="ask"`.
 * Apps can replace this via `onSmartAdaptAsk` for custom UI / copy.
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
      'Theme only — use your theme colors as designed.\n\nApply overall — also fix text/border contrast so content stays readable.',
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
