export function pickFields<T extends Record<string, unknown>>(
  source: Record<string, unknown>,
  allowed: readonly (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of allowed) {
    if (source[key as string] !== undefined) {
      result[key] = source[key as string] as T[keyof T];
    }
  }
  return result;
}
