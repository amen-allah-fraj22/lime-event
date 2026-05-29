export type CalendarEntry = {
  id: string;
  title: string;
  date: string;
  status: string;
  city?: string | null;
  kind: 'booking' | 'event' | 'blocked';
};

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date | null; inMonth: boolean }[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - startPad - daysInMonth + 1;
    cells.push({ date: new Date(year, month + 1, next), inMonth: false });
  }
  return cells;
}

export function entriesForDay(entries: CalendarEntry[], day: Date): CalendarEntry[] {
  return entries.filter((e) => sameDay(new Date(e.date), day));
}
