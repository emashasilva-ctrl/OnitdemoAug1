export function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function minutesToTimeValue(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function timeValueToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildDateOptions(count = 7) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = toLocalISODate(d);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    return { iso, label };
  });
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function groupOpenHoursByDay(
  rows: { day: string; openMinutes: number; closeMinutes: number }[]
): { day: string; hours: string }[] {
  const byDay = new Map<string, { openMinutes: number; closeMinutes: number }[]>();
  for (const row of rows) {
    if (!byDay.has(row.day)) byDay.set(row.day, []);
    byDay.get(row.day)!.push(row);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map(([day, ranges]) => ({
      day,
      hours: ranges
        .sort((a, b) => a.openMinutes - b.openMinutes)
        .map((r) => `${minutesToLabel(r.openMinutes)} – ${minutesToLabel(r.closeMinutes)}`)
        .join(", "),
    }));
}
