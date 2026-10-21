import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Subscribe to the system "Reduce Motion" preference.
 * Returns `true` when animations should be minimized / skipped.
 */
export function useReduceMotion(enabled = true): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReduceMotion(false);
      return;
    }

    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) setReduceMotion(Boolean(value));
      })
      .catch(() => {
        // Older RN / unsupported platforms
      });

    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (value: boolean) => {
        setReduceMotion(Boolean(value));
      }
    );

    return () => {
      mounted = false;
      // RN 0.65+ returns subscription with remove(); older returns emitter sub
      if (sub && typeof (sub as { remove?: () => void }).remove === 'function') {
        (sub as { remove: () => void }).remove();
      }
    };
  }, [enabled]);

  return reduceMotion;
}

/**
 * Resolve whether theme transitions should animate.
 */
export function shouldAnimateTransitions(options: {
  animateTransitions: boolean;
  respectReduceMotion: boolean;
  reduceMotion: boolean;
}): boolean {
  if (!options.animateTransitions) return false;
  if (options.respectReduceMotion && options.reduceMotion) return false;
  return true;
}
