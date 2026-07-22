// Order matters: Array.find() returns the first match, so more specific
// patterns (e.g. Messenger's own FBAN/FB_IAB token also matches the generic
// Facebook pattern) must come before the broader ones they'd otherwise be
// shadowed by.
const IN_APP_UA_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'WhatsApp',   re: /WhatsApp/i },
  { name: 'Instagram',  re: /Instagram/i },
  { name: 'Messenger',  re: /Messenger/i },
  { name: 'Facebook',   re: /FBAN|FBAV|FB_IAB|FBSV/i },
  { name: 'Line',       re: /Line\// },
  { name: 'WeChat',     re: /MicroMessenger/i },
  { name: 'TikTok',     re: /TikTok|musical_ly/i },
]

/**
 * Google blocks Sign-In inside embedded in-app browsers (disallowed_useragent),
 * which silently bounces the user back to /login. Detect the common ones so
 * we can tell people to open the link in Safari/Chrome instead.
 */
export function detectInAppBrowser(ua: string): string | null {
  const match = IN_APP_UA_PATTERNS.find(p => p.re.test(ua))
  return match?.name ?? null
}
