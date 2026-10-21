import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { optionalRequire } from '../utils/optionalRequire';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyReanimated = {
  default?: { View?: React.ComponentType<any> };
  View?: React.ComponentType<any>;
  useSharedValue: (value: number) => { value: number };
  useAnimatedStyle: (fn: () => Record<string, unknown>) => object;
  withTiming: (
    to: number,
    config?: { duration?: number; easing?: unknown }
  ) => number;
  Easing?: { out: (fn: unknown) => unknown; cubic: unknown };
};

const Reanimated = optionalRequire<AnyReanimated>('react-native-reanimated');
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ThemeTransitionProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Soft cross-fade when light/dark changes.
 * Falls back to a plain View when Reanimated is not installed.
 */
export function ThemeTransition({
  children,
  style,
  ...rest
}: ThemeTransitionProps) {
  const { resolvedMode, reduceMotion, animateTransitions, transitionDuration } =
    useTheme();

  const canAnimate =
    Boolean(Reanimated?.useSharedValue) &&
    animateTransitions &&
    !reduceMotion;

  if (!canAnimate || !Reanimated) {
    return (
      <View style={[{ flex: 1 }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedFade
      reanimated={Reanimated}
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
  reanimated: R,
  resolvedMode,
  duration,
  style,
  ...rest
}: ThemeTransitionProps & {
  reanimated: AnyReanimated;
  resolvedMode: string;
  duration: number;
}) {
  const opacity = R.useSharedValue(1);
  const prevMode = useRef(resolvedMode);

  useEffect(() => {
    if (prevMode.current === resolvedMode) return;
    prevMode.current = resolvedMode;

    try {
      opacity.value = 0.72;
      opacity.value = R.withTiming(1, {
        duration,
        easing: R.Easing?.out?.(R.Easing.cubic),
      });
    } catch {
      opacity.value = 1;
    }
  }, [resolvedMode, duration, opacity, R]);

  const animatedStyle = R.useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const AnimatedView = R.default?.View ?? R.View ?? View;

  return (
    <AnimatedView style={[styles.fill, style, animatedStyle]} {...rest}>
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
