/**
 * Strips campaign parameters from a URL (D-012). Nothing is stored or sent.
 * Returns the cleaned path+search+hash, or null when there was nothing to strip.
 */
export function stripUtm(href: string): string | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  const keys = [...url.searchParams.keys()].filter((k) => k.toLowerCase().startsWith('utm_'))
  if (keys.length === 0) return null
  for (const k of new Set(keys)) url.searchParams.delete(k)
  return url.pathname + url.search + url.hash
}
