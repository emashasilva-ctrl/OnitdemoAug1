"use server";

import { prisma } from "@/lib/db";
import { requireOwnedSalon, revalidateVendorAndPublic } from "@/lib/actions/vendor";
import type { VendorActionResult } from "@/lib/actions/vendor";
import { DAYS_OF_WEEK } from "@/lib/time";
import { hasOverlappingPricingRule, type PricingRuleRow } from "@/lib/pricing";
import type { PricingRuleAmountType, PricingRuleType } from "@/lib/types";

export interface PricingRuleInput {
  label: string;
  type: PricingRuleType;
  amountType: PricingRuleAmountType;
  amount: number;
  days: string[];
  startMinutes: number;
  endMinutes: number;
  appliesToAllServices: boolean;
  serviceIds: string[];
  enabled: boolean;
}

async function getExistingRuleRows(salonId: string): Promise<PricingRuleRow[]> {
  const rows = await prisma.pricingRule.findMany({
    where: { salonId },
    include: { services: { select: { id: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    type: r.type,
    amountType: r.amountType,
    amount: r.amount,
    days: JSON.parse(r.days) as string[],
    startMinutes: r.startMinutes,
    endMinutes: r.endMinutes,
    enabled: r.enabled,
    appliesToAllServices: r.appliesToAllServices,
    serviceIds: r.services.map((s) => s.id),
  }));
}

function validate(input: PricingRuleInput): string | null {
  if (!input.label.trim()) return "Please name this pricing rule.";
  if (input.days.length === 0) return "Pick at least one day.";
  if (!input.days.every((d) => (DAYS_OF_WEEK as readonly string[]).includes(d))) {
    return "Invalid day of week.";
  }
  if (input.startMinutes < 0 || input.endMinutes > 24 * 60 || input.startMinutes >= input.endMinutes) {
    return "Invalid time range.";
  }
  if (input.amountType === "PERCENT" && (input.amount < 1 || input.amount > 100)) {
    return "Percent must be between 1 and 100.";
  }
  if (input.amountType === "FLAT" && input.amount < 1) {
    return "Flat amount must be a positive LKR value.";
  }
  if (!input.appliesToAllServices && input.serviceIds.length === 0) {
    return "Pick at least one service, or apply to all services.";
  }
  return null;
}

export async function createPricingRule(
  salonId: string,
  input: PricingRuleInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const validationError = validate(input);
  if (validationError) return { success: false, error: validationError };

  if (!input.appliesToAllServices) {
    const ownedCount = await prisma.service.count({
      where: { salonId, id: { in: input.serviceIds } },
    });
    if (ownedCount !== input.serviceIds.length) {
      return { success: false, error: "One of the selected services is invalid." };
    }
  }

  const existing = await getExistingRuleRows(salonId);
  if (hasOverlappingPricingRule(existing, { ...input })) {
    return { success: false, error: "This overlaps another pricing rule for the same day, time, and service." };
  }

  await prisma.pricingRule.create({
    data: {
      salonId,
      label: input.label.trim(),
      type: input.type,
      amountType: input.amountType,
      amount: input.amount,
      days: JSON.stringify(input.days),
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      appliesToAllServices: input.appliesToAllServices,
      enabled: input.enabled,
      services: input.appliesToAllServices ? undefined : { connect: input.serviceIds.map((id) => ({ id })) },
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export async function updatePricingRule(
  id: string,
  salonId: string,
  input: PricingRuleInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const validationError = validate(input);
  if (validationError) return { success: false, error: validationError };

  if (!input.appliesToAllServices) {
    const ownedCount = await prisma.service.count({
      where: { salonId, id: { in: input.serviceIds } },
    });
    if (ownedCount !== input.serviceIds.length) {
      return { success: false, error: "One of the selected services is invalid." };
    }
  }

  const existing = await getExistingRuleRows(salonId);
  if (hasOverlappingPricingRule(existing, { ...input, id }, id)) {
    return { success: false, error: "This overlaps another pricing rule for the same day, time, and service." };
  }

  await prisma.pricingRule.update({
    where: { id },
    data: {
      label: input.label.trim(),
      type: input.type,
      amountType: input.amountType,
      amount: input.amount,
      days: JSON.stringify(input.days),
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      appliesToAllServices: input.appliesToAllServices,
      enabled: input.enabled,
      services: { set: input.appliesToAllServices ? [] : input.serviceIds.map((sid) => ({ id: sid })) },
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export async function deletePricingRule(id: string, salonId: string): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.pricingRule.deleteMany({ where: { id, salonId } });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export interface CancellationPolicyInput {
  enabled: boolean;
  percent: number;
}

export async function updateCancellationPolicy(
  salonId: string,
  input: CancellationPolicyInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (input.percent < 1 || input.percent > 100) {
    return { success: false, error: "Percent must be between 1 and 100." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: { cancellationFeeEnabled: input.enabled, cancellationFeePercent: input.percent },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export interface NoShowPolicyInput {
  enabled: boolean;
  percent: number;
}

export async function updateNoShowPolicy(
  salonId: string,
  input: NoShowPolicyInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (input.percent < 1 || input.percent > 100) {
    return { success: false, error: "Percent must be between 1 and 100." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: { noShowFeeEnabled: input.enabled, noShowFeePercent: input.percent },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}
