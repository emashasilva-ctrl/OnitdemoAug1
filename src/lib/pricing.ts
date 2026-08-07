export type PricingRuleType = "DISCOUNT" | "SURCHARGE";
export type PricingRuleAmountType = "PERCENT" | "FLAT";

export interface PricingRuleRow {
  id?: string;
  label: string;
  type: PricingRuleType;
  amountType: PricingRuleAmountType;
  amount: number;
  days: string[];
  startMinutes: number;
  endMinutes: number;
  enabled: boolean;
  appliesToAllServices: boolean;
  serviceIds: string[];
}

export interface PriceBreakdown {
  basePriceLKR: number;
  finalPriceLKR: number;
  appliedRule: {
    label: string;
    type: PricingRuleType;
    amountType: PricingRuleAmountType;
    amount: number;
  } | null;
}

function applyAmount(
  basePriceLKR: number,
  rule: Pick<PricingRuleRow, "type" | "amountType" | "amount">
): number {
  if (rule.amountType === "PERCENT") {
    const factor = rule.type === "DISCOUNT" ? 100 - rule.amount : 100 + rule.amount;
    return Math.max(0, Math.round((basePriceLKR * factor) / 100));
  }
  return rule.type === "DISCOUNT"
    ? Math.max(0, basePriceLKR - rule.amount)
    : basePriceLKR + rule.amount;
}

// Finds the first enabled rule matching this day/time/service and applies it.
// Rule creation validates against overlaps (see hasOverlappingPricingRule),
// so in practice at most one rule should ever match.
export function computePrice(
  basePriceLKR: number,
  serviceId: string,
  rules: PricingRuleRow[],
  day: string,
  startMinutes: number
): PriceBreakdown {
  const match = rules.find((rule) => {
    if (!rule.enabled) return false;
    if (!rule.days.includes(day)) return false;
    if (startMinutes < rule.startMinutes || startMinutes >= rule.endMinutes) return false;
    if (!rule.appliesToAllServices && !rule.serviceIds.includes(serviceId)) return false;
    return true;
  });

  if (!match) {
    return { basePriceLKR, finalPriceLKR: basePriceLKR, appliedRule: null };
  }

  return {
    basePriceLKR,
    finalPriceLKR: applyAmount(basePriceLKR, match),
    appliedRule: {
      label: match.label,
      type: match.type,
      amountType: match.amountType,
      amount: match.amount,
    },
  };
}

// Two rules conflict when they'd both be eligible to match the same
// day+time+service — same day, overlapping time window, and overlapping
// service scope (shared service, or either applies to all services).
export function hasOverlappingPricingRule(
  existing: PricingRuleRow[],
  candidate: PricingRuleRow,
  excludeId?: string
): boolean {
  return existing.some((rule) => {
    if (rule.id !== undefined && rule.id === excludeId) return false;
    if (!rule.enabled || !candidate.enabled) return false;

    const sharesDay = rule.days.some((d) => candidate.days.includes(d));
    if (!sharesDay) return false;

    const timeOverlaps =
      candidate.startMinutes < rule.endMinutes && rule.startMinutes < candidate.endMinutes;
    if (!timeOverlaps) return false;

    return (
      rule.appliesToAllServices ||
      candidate.appliesToAllServices ||
      rule.serviceIds.some((id) => candidate.serviceIds.includes(id))
    );
  });
}
