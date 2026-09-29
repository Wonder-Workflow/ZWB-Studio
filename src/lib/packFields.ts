/** Content-pack field mapping. Old blob keys stay in storage; the UI reads these. */

export function hookFromRecord(raw: { hook?: unknown; hookA?: unknown; hookB?: unknown }): string {
  if (typeof raw.hook === 'string') return raw.hook
  return firstNonEmpty(raw.hookA, raw.hookB)
}

/**
 * Apply a saved patch onto the hook already resolved from the seed.
 * `hook` is the field we write now. Legacy `hookA` wins over `hookB`.
 * A patch that only still has hook B does not replace a hook A.
 */
export function mergedHook(
  current: string,
  patch: { hook?: unknown; hookA?: unknown; hookB?: unknown },
): string {
  if (typeof patch.hook === 'string') return patch.hook
  const hookA = typeof patch.hookA === 'string' ? patch.hookA : undefined
  const hookB = typeof patch.hookB === 'string' ? patch.hookB : undefined
  if (hookA === undefined && hookB === undefined) return current
  if (hookA !== undefined && hookA.trim()) return hookA
  if (hookB !== undefined && hookB.trim()) {
    if (hookA === undefined && current.trim()) return current
    return hookB
  }
  if (hookA !== undefined) return hookA
  return current
}

/** One shoot list. Legacy setup / A-roll / B-roll fold together. Text and end cards are dropped. */
export function shotListText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const shot = value as Record<string, unknown>
  if (typeof shot.shots === 'string') return shot.shots
  const parts = [shot.setup, shot.aRoll, shot.bRoll]
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  return parts.join('\n\n')
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}
