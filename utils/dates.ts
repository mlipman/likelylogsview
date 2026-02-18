import {
  startOfISOWeek,
  getDate,
  getMonth,
  getYear,
  getDayOfYear,
  format,
  addDays,
  addMonths,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  addWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";

export type Period = "month" | "week" | "day";

export const addOne = (
  period: Period,
  instanceNum: string
): {period: Period; instanceNum: string} => {
  const date = toDate(period, instanceNum);
  if (date == null) throw new Error(`Bad instance ${instanceNum} for ${period}`);
  if (period == "month") {
    return {period, instanceNum: dateToInstanceNum(addMonths(date, 1), period)};
  } else if (period == "week") {
    return {period, instanceNum: dateToInstanceNum(addWeeks(date, 1), period)};
  } else if (period == "day") {
    return {period, instanceNum: dateToInstanceNum(addDays(date, 1), period)};
  }
  throw new Error(`Invalid period ${period}`);
};

export const subtractOne = (
  period: Period,
  instanceNum: string
): {period: Period; instanceNum: string} => {
  const date = toDate(period, instanceNum);
  if (date == null) throw new Error(`Bad instance ${instanceNum} for ${period}`);
  if (period == "month") {
    return {period, instanceNum: dateToInstanceNum(addMonths(date, -1), period)};
  } else if (period == "week") {
    return {period, instanceNum: dateToInstanceNum(addWeeks(date, -1), period)};
  } else if (period == "day") {
    return {period, instanceNum: dateToInstanceNum(addDays(date, -1), period)};
  }
  throw new Error(`Invalid period ${period}`);
};

/**
 * Returns a date. For month and week it's the first or the month
 * or first day of the week.
 * Won't throw an error on weird instanceNums.
 */
const toDate = (period: Period, instanceNum: string): Date | null => {
  if (period == "month") {
    const year = parseInt(instanceNum.substring(0, 4));
    const month = parseInt(instanceNum.substring(4, 6)) - 1;
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return null;
    }
    return new Date(year, month);
  } else if (period == "week") {
    const year = parseInt(instanceNum.substring(0, 4));
    const week = parseInt(instanceNum.substring(4, 6));
    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
      return null;
    }
    return startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week));
  } else if (period == "day") {
    const year = parseInt(instanceNum.substring(0, 4));
    const day = parseInt(instanceNum.substring(4, 7));
    if (isNaN(year) || isNaN(day) || day < 1 || day > 366) {
      return null;
    }
    const date = new Date(year, 0);
    date.setDate(day);
    return date;
  }
  throw new Error(`Invalid period`);
};

export const dateToInstanceNum = (date: Date, period: Period): string => {
  if (period == "month") {
    return `${date.getFullYear()}${String(getMonth(date) + 1).padStart(2, "0")}`;
  } else if (period == "week") {
    return `${getISOWeekYear(date)}${String(getISOWeek(date)).padStart(2, "0")}`;
  } else if (period == "day") {
    return `${date.getFullYear()}${String(getDayOfYear(date)).padStart(3, "0")}`;
  }
  throw new Error(`Invalid period`);
};

/**
 * Returns a list of child page links, each with a title to display
 * and url.
 * For month, it shows 4 or 5 weeks, need a rule
 * For week, it shows 7 days
 * For day, it shows nothing.
 */

export const childPages = (
  period: "month" | "week" | "day",
  instanceNum: string
): {title: string; url: string}[] => {
  // if (period == "month") {
  // a week belongs to a month if the thursday of the week is in the mont
  // so given a month, if the first day of the month is x, the first day of the
  // first week is as follows
  // M:
  // }

  // want real child pages. also home and parent

  const previous = subtractOne(period, instanceNum);
  const next = addOne(period, instanceNum);
  return [
    {
      title: "Previous",
      url: `/session/${previous.period}/${previous.instanceNum}`,
    },
    {
      title: "Home",
      url: "/",
    },
    {
      title: "Next",
      url: `/session/${next.period}/${next.instanceNum}`,
    },
  ];
};

/**
 * Given a period that is "month", "week" or "day"
 * and an instanceNum like 202510 or similar, it creates
 * the header such as "January 2025" or "December 30, 2024 - January 5, 2025".
 */
export const makeHeader = (
  period: string | string[] | undefined,
  instanceNum: string | string[] | undefined
): string | null => {
  if (
    !period ||
    !instanceNum ||
    Array.isArray(period) ||
    Array.isArray(instanceNum) ||
    !["month", "week", "day"].includes(period)
  ) {
    return null;
  }
  const date = toDate(period as Period, instanceNum);
  if (date == null) return null;

  if (period === "month") {
    return date.toLocaleString("en-US", {month: "long", year: "numeric"});
  } else if (period === "week") {
    const startDate = date;
    const endDate = addDays(startDate, 6);
    const startMonth = format(startDate, "MMMM");
    const endMonth = format(endDate, "MMMM");
    const startYear = getYear(startDate);
    const endYear = getYear(endDate);
    const startDay = getDate(startDate);
    const endDay = getDate(endDate);

    if (startYear !== endYear) {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    } else if (startMonth !== endMonth) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    } else {
      return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
    }
  } else if (period === "day") {
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } else {
    return null;
  }
};

// --- Calendar grid utilities ---

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayInstanceNum: string;
}

export interface CalendarWeekRow {
  isoWeekYear: number;
  isoWeek: number;
  weekInstanceNum: string;
  days: CalendarDay[];
}

/**
 * Builds a calendar grid for the given year/month (1-indexed month).
 * Weeks start on Monday (ISO standard). Includes padding days from
 * adjacent months to fill complete rows.
 */
export const buildCalendarGrid = (year: number, month: number): CalendarWeekRow[] => {
  const monthDate = new Date(year, month - 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Find the Monday on or before the first day of the month
  const firstMonday = startOfISOWeek(monthStart);
  // Find the Sunday on or after the last day of the month
  const lastDayWeekStart = startOfISOWeek(monthEnd);
  const lastSunday = addDays(lastDayWeekStart, 6);

  const allDays = eachDayOfInterval({start: firstMonday, end: lastSunday});

  const rows: CalendarWeekRow[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    const monday = weekDays[0];
    rows.push({
      isoWeekYear: getISOWeekYear(monday),
      isoWeek: getISOWeek(monday),
      weekInstanceNum: dateToInstanceNum(monday, "week"),
      days: weekDays.map(day => ({
        date: day,
        dayOfMonth: getDate(day),
        isCurrentMonth: isSameMonth(day, monthDate),
        isToday: isToday(day),
        dayInstanceNum: dateToInstanceNum(day, "day"),
      })),
    });
  }
  return rows;
};

/**
 * Returns all instance keys needed for a batch session existence check
 * for the given calendar month. Includes day instances for current-month
 * days only, week instances for all displayed weeks, and the month instance.
 */
export const calendarInstanceKeys = (year: number, month: number): string[] => {
  const grid = buildCalendarGrid(year, month);
  const keys: string[] = [];

  // Month instance
  keys.push(`month${String(year).padStart(4, "0")}${String(month).padStart(2, "0")}`);

  for (const row of grid) {
    // Week instance
    keys.push(`week${row.weekInstanceNum}`);
    // Day instances (current month only)
    for (const day of row.days) {
      if (day.isCurrentMonth) {
        keys.push(`day${day.dayInstanceNum}`);
      }
    }
  }
  return keys;
};
