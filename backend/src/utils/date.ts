export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseDateOnly(value: string | Date): Date {
  const d = typeof value === 'string' ? new Date(value) : new Date(value);
  return startOfDay(d);
}
