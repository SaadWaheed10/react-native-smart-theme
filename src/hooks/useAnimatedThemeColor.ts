import { useEffect, useRef, useState } from 'react';
import type { ColorTokens, HexColor } from '../types/theme';
import { interpolateColorTokens, interpolateHex } from '../utils/interpolateColor';
import { useTheme } from './useTheme';

/**
 * Animate a single hex color toward the latest theme value when mode changes.
 * Falls back to an instant swap when animations are disabled / Reduce Motion is on.
 */
export function useAnimatedThemeColor(
  token: keyof ColorTokens,
  durationMs?: number
): HexColor {
  const { colors, animateTransitions, reduceMotion, transitionDuration } =
    useTheme();
  const target = colors[token];
  const duration = durationMs ?? transitionDuration;
  const shouldAnimate = animateTransitions && !reduceMotion;

  const [display, setDisplay] = useState<HexColor>(target);
  const fromRef = useRef<HexColor>(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldAnimate || fromRef.current === target) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    const from = fromRef.current;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setDisplay(interpolateHex(from, target, t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, shouldAnimate, duration]);

  return display;
}

/**
 * Animate the full active color palette across a mode change.
 * Prefer token-level `useAnimatedThemeColor` for hot paths.
 */
export function useAnimatedColors(durationMs?: number): ColorTokens {
  const { colors, animateTransitions, reduceMotion, transitionDuration } =
    useTheme();
  const duration = durationMs ?? transitionDuration;
  const shouldAnimate = animateTransitions && !reduceMotion;

  const [display, setDisplay] = useState<ColorTokens>(colors);
  const fromRef = useRef<ColorTokens>(colors);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      fromRef.current = colors;
      setDisplay(colors);
      return;
    }

    // Only animate when the palette identity actually changed
    if (fromRef.current.background === colors.background &&
        fromRef.current.primary === colors.primary &&
        fromRef.current.text === colors.text) {
      fromRef.current = colors;
      setDisplay(colors);
      return;
    }

    const from = fromRef.current;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setDisplay(interpolateColorTokens(from, colors, t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = colors;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [colors, shouldAnimate, duration]);

  return display;
}
