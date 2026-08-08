"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { verifySession } from "@/lib/dal";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { sanitizeNextPath } from "@/lib/oauth";

export interface AuthFormState {
  error?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const accountType = String(formData.get("accountType") ?? "customer");
  const next = String(formData.get("next") ?? "") || "/";

  if (!name) return { error: "Please enter your name." };
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      isVendor: accountType === "vendor",
    },
  });

  await sendEmail({ to: user.email, ...welcomeEmail({ name: user.name, isVendor: user.isVendor }) });

  await createSession(user.id);
  redirect(user.isVendor ? "/vendor/setup" : next);
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return { error: "Incorrect email or password." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Incorrect email or password." };

  await createSession(user.id);

  if (user.isVendor) {
    const ownedSalon = await prisma.salon.findFirst({ where: { ownerId: user.id }, select: { id: true } });
    if (!ownedSalon) redirect("/vendor/setup");
  }
  redirect(next);
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function becomeVendor() {
  const session = await verifySession();
  if (!session) redirect("/login?next=/become-a-vendor");

  await prisma.user.update({
    where: { id: session.userId },
    data: { isVendor: true },
  });

  revalidatePath("/", "layout");
  redirect("/vendor/setup");
}

// The other half of the account-type choice on /become-a-vendor — no DB
// write needed since isVendor already defaults to false, this just sends
// the user on to wherever they were headed (falling back to home if that
// was /become-a-vendor itself, to avoid looping back into the same choice).
export async function continueAsCustomer(formData: FormData) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const next = sanitizeNextPath(String(formData.get("next") ?? ""));
  redirect(next === "/become-a-vendor" ? "/" : next);
}

// Reverses becomeVendor() for someone who picked "Customer and vendor" by
// mistake, or just no longer wants vendor access. If a salon was already
// created, this hides it rather than deleting it — it disappears from
// public browsing but every setting, service, and booking history stays
// intact, so switching back to vendor later (via /become-a-vendor) picks
// up right where they left off instead of starting over.
export async function switchToCustomer() {
  const session = await verifySession();
  if (!session) redirect("/login");

  await prisma.salon.updateMany({
    where: { ownerId: session.userId },
    data: { hidden: true },
  });
  await prisma.user.update({
    where: { id: session.userId },
    data: { isVendor: false },
  });

  revalidatePath("/", "layout");
  redirect("/");
}

// Undoes switchToCustomer()'s hide — used from the vendor profile page once
// someone has an existing (hidden) salon and wants it visible again.
export async function unhideSalon() {
  const session = await verifySession();
  if (!session) redirect("/login");

  await prisma.salon.updateMany({
    where: { ownerId: session.userId },
    data: { hidden: false },
  });

  revalidatePath("/", "layout");
}
