/**
 * Formatting helpers for prices, dates, and copy that matches the prototype.
 */

export function centsToDollars(cents: number | null | undefined): number {
  return cents == null ? 0 : cents / 100;
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US")}`;
}

export function formatMoneyShort(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toLocaleString("en-US")}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseISODate(iso: string): Date {
  // YYYY-MM-DD — interpret as local-noon to avoid TZ surprises in display
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDayLabel(iso: string) {
  const d = parseISODate(iso);
  return { num: d.getDate(), dow: DOWS[d.getDay()] };
}

export function formatDateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return "—";
  const s = parseISODate(start);
  const e = parseISODate(end);
  const sameMonth =
    s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  const yr = e.getFullYear();
  if (sameMonth) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${yr}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getDate()}–${MONTHS[e.getMonth()]} ${e.getDate()}, ${yr}`;
}

export function formatShortRange(
  start: string | null,
  end: string | null,
): string {
  // "May 14–22 · 8 nights"
  if (!start || !end) return "";
  const s = parseISODate(start);
  const e = parseISODate(end);
  const nights = Math.round(
    (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24),
  );
  const sameMonth =
    s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  const range = sameMonth
    ? `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}`
    : `${MONTHS[s.getMonth()]} ${s.getDate()}–${MONTHS[e.getMonth()]} ${e.getDate()}`;
  return `${range} · ${nights} night${nights === 1 ? "" : "s"}`;
}

export function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  if (diffDays <= 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  if (diffDays < 365) {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${time}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

export function formatHHmm(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}
