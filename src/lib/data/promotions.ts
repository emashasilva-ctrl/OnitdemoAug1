export function isPromotionActive(
  startDate: string | null,
  endDate: string | null,
  today: string
): boolean {
  return (!startDate || startDate <= today) && (!endDate || endDate >= today);
}
