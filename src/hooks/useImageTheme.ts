import { useCallback, useEffect, useState } from 'react';
import {
  createThemeFromImage,
  type CreateThemeFromImageOptions,
  type ImageThemeResult,
} from '../generators/createThemeFromImage';
import type { Theme } from '../types/theme';

export interface UseImageThemeResult {
  theme: Theme | null;
  result: ImageThemeResult | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Load a theme from an image source (URI, asset, or hex palette).
 *
 * @example
 * ```tsx
 * const { theme, loading } = useImageTheme({
 *   source: { uri: logoUri },
 * });
 * if (!theme) return null;
 * return <ThemeProvider theme={theme}>...</ThemeProvider>;
 * ```
 */
export function useImageTheme(
  options: CreateThemeFromImageOptions | null
): UseImageThemeResult {
  const [result, setResult] = useState<ImageThemeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!options) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    createThemeFromImage(options)
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult(null);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // Recreate when source identity or tick changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.source, tick]);

  return {
    theme: result?.theme ?? null,
    result,
    loading,
    error,
    reload,
  };
}
