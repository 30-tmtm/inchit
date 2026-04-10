/**
 * 아이 나이 표기 규칙:
 * - 36개월 미만: "10개월 9일차"
 * - 36개월 이상: "만 3세 (37개월)"
 */

export function formatAgeTitle(months: number, days: number): string {
  if (months < 36) {
    return `${months}개월 ${days}일차`;
  }
  const years = Math.floor(months / 12);
  return `만 ${years}세 (${months}개월)`;
}

/** 짧은 표기 (목록 등): "10개월" → "만 3세" */
export function formatAgeShort(months: number): string {
  if (months < 36) return `${months}개월`;
  return `만 ${Math.floor(months / 12)}세`;
}
