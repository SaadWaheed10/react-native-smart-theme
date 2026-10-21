import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyReanimated = {
  default: {
    View: React.ComponentType<any>;
  };
  useSharedValue: (value: number) => { value: number };
  useAnimatedStyle: (fn: () => Record<string, unknown>) => object;
  withTiming: (
    to: number,
    config?: { duration?: number; easing?: unknown }
  ) => number;
  Easing: { out: (fn: unknown) => unknown; cubic: unknown };
};

let Reanimated: AnyReanimated | null = null;
try {
  // Optional peer — package still works without it
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Reanimated = require('react-native-reanimated');
} catch {
  Reanimated = null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ThemeTransitionProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Soft cross-fade when the resolved light/dark mode changes.
 * No-ops (plain View) when Reanimated is missing, animations are off,
 * or the user has Reduce Motion enabled.
 */
export function ThemeTransition({
  children,
  style,
  ...rest
}: ThemeTransitionProps) {
  const { resolvedMode, reduceMotion, animateTransitions, transitionDuration } =
    useTheme();

  const canAnimate =
    Boolean(Reanimated) && animateTransitions && !reduceMotion;

  if (!canAnimate || !Reanimated) {
    return (
      <View style={[{ flex: 1 }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedFade
      resolvedMode={resolvedMode}
      duration={transitionDuration}
      style={style}
      {...rest}
    >
      {children}
    </AnimatedFade>
  );
}

function AnimatedFade({
  children,
  resolvedMode,
  duration,
  style,
  ...rest
}: ThemeTransitionProps & {
  resolvedMode: string;
  duration: number;
}) {
  const R = Reanimated!;
  const AnimatedView = R.default.View;
  const opacity = R.useSharedValue(1);
  const prevMode = useRef(resolvedMode);

  useEffect(() => {
    if (prevMode.current === resolvedMode) return;
    prevMode.current = resolvedMode;

    opacity.value = 0.72;
    opacity.value = R.withTiming(1, {
      duration,
      easing: R.Easing.out(R.Easing.cubic),
    });
  }, [resolvedMode, duration, opacity, R]);

  const animatedStyle = R.useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <AnimatedView style={[styles.fill, style, animatedStyle]} {...rest}>
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
