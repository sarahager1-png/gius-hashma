/**
 * Validate a post-login redirect target coming from a `next` query param.
 * Only same-origin relative paths are allowed (blocks open redirects),
 * and login/auth pages are rejected to avoid redirect loops.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/') || next.startsWith('//')) return null
  if (next.startsWith('/login') || next.startsWith('/auth') || next.startsWith('/mosad')) return null
  return next
}
