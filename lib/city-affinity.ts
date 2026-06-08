export const CITY_AFFINITY_GROUPS: string[][] = [
  // ביתר עילית ↔ קרית ארבע
  ['ביתר עילית', 'ביתר', 'קרית ארבע'],
  // יבנה ↔ קרית מלאכי ↔ קרית גת
  ['יבנה', 'קרית מלאכי', 'קריית מלאכי', 'קרית גת', 'קריית גת'],
]

export function inSameCityGroup(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b || a === b) return false
  return CITY_AFFINITY_GROUPS.some(g => g.includes(a) && g.includes(b))
}
