"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { isValidIntlPhone } from "@/lib/phone";

export async function updatePersonalDetails(
  name: string,
  phone: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You need to be signed in to do that." };

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (!trimmedName) return { success: false, error: "Please enter your name." };
  if (trimmedPhone && !isValidIntlPhone(trimmedPhone)) {
    return { success: false, error: "Please enter a valid phone number, e.g. +94 771234567." };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: trimmedName, phone: trimmedPhone || null },
  });

  revalidatePath("/", "layout");
  revalidatePath("/account");
  return { success: true };
}
