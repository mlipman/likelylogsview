import {getISOWeek, getISOWeekYear} from "date-fns";

// Helper function to get current week number (Saturday-Friday weeks)
export const getCurrentWeek = (): {year: number; week: number} => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // If it's Saturday (6) or Sunday (0), we want the week of the upcoming Monday
  let targetDate = new Date(now);
  if (dayOfWeek === 0) {
    // Sunday
    targetDate.setDate(now.getDate() + 1); // Move to Monday
  } else if (dayOfWeek === 6) {
    // Saturday
    targetDate.setDate(now.getDate() + 2); // Move to Monday
  }

  const year = getISOWeekYear(targetDate);
  const week = getISOWeek(targetDate);
  return {year, week};
};
