function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseDateOnly(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

function parseDateTimeLocal(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  return { year, month, day, hour, minute };
}

/**
 * Converts DB values (date-only, datetime-local, ISO) to a `date` input value (YYYY-MM-DD).
 */
export function toDateInputValue(value: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  const dateOnly = parseDateOnly(raw);
  if (dateOnly) {
    return `${dateOnly.year}-${pad2(dateOnly.month)}-${pad2(dateOnly.day)}`;
  }

  // `datetime-local` value: keep date portion.
  const local = parseDateTimeLocal(raw);
  if (local) return `${local.year}-${pad2(local.month)}-${pad2(local.day)}`;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Validates and normalizes a `date` input value (YYYY-MM-DD).
 */
export function dateInputToDateOnly(value: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  const dateOnly = parseDateOnly(raw);
  if (!dateOnly) return "";
  return `${dateOnly.year}-${pad2(dateOnly.month)}-${pad2(dateOnly.day)}`;
}
