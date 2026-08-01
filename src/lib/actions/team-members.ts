"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnedSalon } from "@/lib/actions/vendor";
import type { VendorActionResult } from "@/lib/actions/vendor";
import { hasInvalidOrOverlappingRanges } from "@/lib/time";

function revalidateTeam() {
  revalidatePath("/vendor/team");
  revalidatePath("/vendor/calendar");
  revalidatePath("/vendor/dashboard");
}

export interface TeamMemberInput {
  salonId: string;
  name: string;
  role?: string;
  serviceIds: string[];
}

async function requireOwnedTeamMember(teamMemberId: string, salonId: string) {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return check;

  const teamMember = await prisma.teamMember.findUnique({
    where: { id: teamMemberId },
    select: { salonId: true },
  });
  if (!teamMember || teamMember.salonId !== salonId) {
    return { ok: false as const, error: "Team member not found." };
  }
  return check;
}

export async function createTeamMember(input: TeamMemberInput): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(input.salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (!input.name.trim()) return { success: false, error: "Name is required." };

  await prisma.teamMember.create({
    data: {
      salonId: input.salonId,
      name: input.name,
      role: input.role || null,
      services: { connect: input.serviceIds.map((id) => ({ id })) },
    },
  });
  revalidateTeam();
  return { success: true };
}

export async function updateTeamMember(
  id: string,
  input: TeamMemberInput
): Promise<VendorActionResult> {
  const check = await requireOwnedTeamMember(id, input.salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (!input.name.trim()) return { success: false, error: "Name is required." };

  await prisma.teamMember.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role || null,
      services: { set: input.serviceIds.map((sid) => ({ id: sid })) },
    },
  });
  revalidateTeam();
  return { success: true };
}

export async function deleteTeamMember(id: string, salonId: string): Promise<VendorActionResult> {
  const check = await requireOwnedTeamMember(id, salonId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.teamMember.delete({ where: { id } });
  revalidateTeam();
  return { success: true };
}

export interface TeamMemberHoursInput {
  day: string;
  openMinutes: number;
  closeMinutes: number;
}

export async function updateTeamMemberHours(
  teamMemberId: string,
  salonId: string,
  hours: TeamMemberHoursInput[]
): Promise<VendorActionResult> {
  const check = await requireOwnedTeamMember(teamMemberId, salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (hasInvalidOrOverlappingRanges(hours)) {
    return { success: false, error: "Time ranges overlap or are invalid." };
  }

  await prisma.$transaction([
    prisma.teamMemberHours.deleteMany({ where: { teamMemberId } }),
    prisma.teamMemberHours.createMany({
      data: hours.map((h) => ({
        teamMemberId,
        day: h.day,
        openMinutes: h.openMinutes,
        closeMinutes: h.closeMinutes,
      })),
    }),
  ]);
  revalidateTeam();
  return { success: true };
}

export async function assignAppointmentTeamMember(
  appointmentId: string,
  salonId: string,
  teamMemberId: string | null
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  if (teamMemberId) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      select: { salonId: true },
    });
    if (!teamMember || teamMember.salonId !== salonId) {
      return { success: false, error: "Team member not found." };
    }
  }

  await prisma.appointment.updateMany({
    where: { id: appointmentId, salonId },
    data: { teamMemberId },
  });
  revalidateTeam();
  return { success: true };
}
