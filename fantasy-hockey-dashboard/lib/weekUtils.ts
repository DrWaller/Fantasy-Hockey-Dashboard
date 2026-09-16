// Assumes a Monday-Sunday fantasy week, Yahoo's standard default. If your
// league actually locks on a different day, this is the one place to
// change it.

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function mondayOfWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // days back to Monday
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

export function nextMonday(mondayISO: string): string {
  const d = new Date(`${mondayISO}T00:00:00`);
  d.setDate(d.getDate() + 7);
  return toISO(d);
}
