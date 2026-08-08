"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { deleteSession } from "@/lib/session";
import { isValidIntlPhone } from "@/lib/phone";

export async function updatePersonalDetails(
  name: string,
  phone: string,
  whatsappNumber: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You need to be signed in to do that." };

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedWhatsapp = whatsappNumber.trim();
  if (!trimmedName) return { success: false, error: "Please enter your name." };
  if (trimmedPhone && !isValidIntlPhone(trimmedPhone)) {
    return { success: false, error: "Please enter a valid phone number, e.g. +94 771234567." };
  }
  if (trimmedWhatsapp && !isValidIntlPhone(trimmedWhatsapp)) {
    return { success: false, error: "Please enter a valid WhatsApp number, e.g. +94 771234567." };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: trimmedName,
      phone: trimmedPhone || null,
      whatsappNumber: trimmedWhatsapp || null,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/account");
  return { success: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You need to be signed in to do that." };

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });
  if (!user) return { success: false, error: "You need to be signed in to do that." };

  if (user.passwordHash) {
    const valid = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!valid) return { success: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash },
  });

  return { success: true };
}

export async function deleteAccount() {
  const session = await verifySession();
  if (!session) redirect("/login");

  await prisma.appointment.updateMany({
    where: { customerId: session.userId },
    data: { customerId: null },
  });
  await prisma.salon.updateMany({
    where: { ownerId: session.userId },
    data: { ownerId: null },
  });
  await prisma.user.delete({ where: { id: session.userId } });

  await deleteSession();
  redirect("/");
}
