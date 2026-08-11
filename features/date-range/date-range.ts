export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export type DateRangeValue = {
  from: string;
  to: string;
  preset: DateRangePreset;
};

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const distanceFromSunday = day;
  result.setDate(result.getDate() - distanceFromSunday);
  return result;
}

export function rangeForPreset(preset: Exclude<DateRangePreset, "custom">, now = new Date()): DateRangeValue {
  const from = new Date(now);
  const to = new Date(now);

  if (preset === "yesterday") {
    from.setDate(from.getDate() - 1);
    to.setDate(to.getDate() - 1);
  } else if (preset === "this_week") {
    from.setTime(startOfWeek(now).getTime());
  } else if (preset === "last_week") {
    const currentStart = startOfWeek(now);
    from.setTime(currentStart.getTime());
    from.setDate(from.getDate() - 7);
    to.setTime(currentStart.getTime());
    to.setDate(to.getDate() - 1);
  } else if (preset === "this_month") {
    from.setDate(1);
  } else if (preset === "last_month") {
    from.setFullYear(now.getFullYear(), now.getMonth() - 1, 1);
    to.setFullYear(now.getFullYear(), now.getMonth(), 0);
  } else if (preset === "this_year") {
    from.setMonth(0, 1);
  } else if (preset === "last_year") {
    from.setFullYear(now.getFullYear() - 1, 0, 1);
    to.setFullYear(now.getFullYear() - 1, 11, 31);
  }

  return { from: dateKey(from), to: dateKey(to), preset };
}

export function isWithinDateRange(value: string | null | undefined, range: Pick<DateRangeValue, "from" | "to">) {
  if (!value) return false;
  const key = dateKey(new Date(value));
  return key >= range.from && key <= range.to;
}

