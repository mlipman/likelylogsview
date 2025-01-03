import {
  startOfISOWeek,
  getDate,
  getYear,
  format,
  addDays,
  setISOWeek,
  setISOWeekYear,
} from "date-fns";

export const makeHeader = (
  period: string | string[] | undefined,
  instanceNum: string | string[] | undefined
): string | null => {
  if (
    !period ||
    !instanceNum ||
    Array.isArray(period) ||
    Array.isArray(instanceNum)
  ) {
    return null;
  }

  if (period === "month") {
    const year = parseInt(instanceNum.substring(0, 4));
    const month = parseInt(instanceNum.substring(4, 6)) - 1;
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return null;
    }
    const date = new Date(year, month);
    return date.toLocaleString("en-US", {month: "long", year: "numeric"});
  } else if (period === "week") {
    const year = parseInt(instanceNum.substring(0, 4));
    const week = parseInt(instanceNum.substring(4, 6));
    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
      return null;
    }
    const startDate = startOfISOWeek(
      setISOWeek(setISOWeekYear(new Date(), year), week)
    );
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
    const year = parseInt(instanceNum.substring(0, 4));
    const day = parseInt(instanceNum.substring(4, 7));
    if (isNaN(year) || isNaN(day) || day < 1 || day > 366) {
      return null;
    }
    const date = new Date(year, 0);
    date.setDate(day);
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
