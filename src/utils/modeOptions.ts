import type { ModeChangeOptions } from '../types/theme';

/**
 * Pressable passes a gesture event into onPress handlers.
 * Ignore anything that looks like a RN event so
 * `onPress={toggleMode}` never corrupts options.
 */
export function normalizeModeOptions(
  options?: ModeChangeOptions | unknown
): ModeChangeOptions | undefined {
  if (options == null) return undefined;
  if (typeof options !== 'object') return undefined;

  const obj = options as Record<string, unknown>;
  // React Native press / responder events
  if ('nativeEvent' in obj || 'persist' in obj || '_dispatchInstances' in obj) {
    return undefined;
  }

  if ('smartAdapt' in obj) {
    const sa = obj.smartAdapt;
    if (sa === true || sa === false || sa === 'ask') {
      return { smartAdapt: sa };
    }
  }

  return undefined;
}
