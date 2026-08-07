export interface TimeSlot {
  minutes: number;
  label: string;
  available: boolean;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

const DEFAULT_DAY_START_MIN = 9 * 60;
const DEFAULT_DAY_END_MIN = 20 * 60;
const STEP_MIN = 30;

export function getSlotsForDate(
  venueId: string,
  durationMins: number,
  dateISO: string,
  now: Date = new Date(),
  dayStartMin: number = DEFAULT_DAY_START_MIN,
  dayEndMin: number = DEFAULT_DAY_END_MIN
): TimeSlot[] {
  const rand = mulberry32(hashSeed(`${venueId}:${dateISO}:${durationMins}`));
  const slots: TimeSlot[] = [];

  const nowISO = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  const isToday = dateISO === nowISO;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (
    let mins = dayStartMin;
    mins + durationMins <= dayEndMin;
    mins += STEP_MIN
  ) {
    const inPast = isToday && mins <= nowMinutes + 30;
    const randomlyBooked = rand() < 0.35;
    slots.push({
      minutes: mins,
      label: minutesToLabel(mins),
      available: !inPast && !randomlyBooked,
    });
  }

  return slots;
}

export function nextAvailableLabel(slots: TimeSlot[]): string | null {
  const next = slots.find((s) => s.available);
  return next ? next.label : null;
}
