/**
 * Dynamically require an optional peer so Metro does not fail the bundle
 * when the package is missing. Static `require('pkg')` is resolved at
 * bundle time; a variable name is not.
 */
export function optionalRequire<T = unknown>(moduleName: string): T | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require(moduleName) as T;
  } catch {
    return null;
  }
}
