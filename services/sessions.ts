import {session, PrismaClient, Prisma} from "@prisma/client";
import {startOfISOWeek, setISOWeek, setISOWeekYear, addDays, endOfMonth} from "date-fns";
import prisma from "../lib/prisma";

interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

type SessionPeriod = "day" | "week" | "month";

function parseInstance(instance: string): {period: SessionPeriod; instanceNum: string} | null {
  for (const p of ["month", "week", "day"] as const) {
    if (instance.startsWith(p)) {
      return {period: p, instanceNum: instance.slice(p.length)};
    }
  }
  return null;
}

/**
 * Converts an instanceNum to the date range it represents.
 * For day: the specific day.
 * For week: Monday–Sunday of that ISO week.
 * For month: first and last day of that month.
 */
function instanceToDateRange(
  period: SessionPeriod,
  instanceNum: string
): {start: Date; end: Date} | null {
  if (period === "day") {
    const year = parseInt(instanceNum.substring(0, 4));
    const dayOfYear = parseInt(instanceNum.substring(4, 7));
    if (isNaN(year) || isNaN(dayOfYear)) return null;
    const date = new Date(year, 0);
    date.setDate(dayOfYear);
    return {start: date, end: date};
  } else if (period === "week") {
    // ISO week: instanceNum like "202608"
    const year = parseInt(instanceNum.substring(0, 4));
    const week = parseInt(instanceNum.substring(4, 6));
    if (isNaN(year) || isNaN(week)) return null;
    const monday = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week));
    const sunday = addDays(monday, 6);
    return {start: monday, end: sunday};
  } else if (period === "month") {
    const year = parseInt(instanceNum.substring(0, 4));
    const month = parseInt(instanceNum.substring(4, 6)) - 1;
    if (isNaN(year) || isNaN(month)) return null;
    const start = new Date(year, month, 1);
    const end = endOfMonth(start);
    return {start, end};
  }
  return null;
}

/**
 * Formats a datetime prefix for a session message.
 * Uses the server's current time, converted to America/Chicago.
 *
 * Day sessions: "8:15am" if same day, "8:15am Tuesday, Feb 12" if different day
 * Week sessions: "8:15am Tuesday" if same week, "8:15am Tuesday, Feb 12" if different week
 * Month sessions: always "8:15am Tuesday, Feb 12"
 */
function formatMessagePrefix(instance: string): string {
  const parsed = parseInstance(instance);
  if (!parsed) return "";

  const {period, instanceNum} = parsed;
  const now = new Date();

  // Format date parts in Central time (no time of day)
  const weekdayStr = now.toLocaleString("en-US", {
    weekday: "long",
    timeZone: "America/Chicago",
  });

  const monthStr = now.toLocaleString("en-US", {
    month: "short",
    timeZone: "America/Chicago",
  });

  const dayNum = now.toLocaleString("en-US", {
    day: "numeric",
    timeZone: "America/Chicago",
  });

  const fullDate = `${weekdayStr}, ${monthStr} ${dayNum}`;

  if (period === "month") {
    return fullDate;
  }

  // Get the "today" date in Central time for comparison
  const centralDateStr = now.toLocaleDateString("en-US", {timeZone: "America/Chicago"});
  const centralToday = new Date(centralDateStr);

  const range = instanceToDateRange(period, instanceNum);
  if (!range) return "";

  if (period === "day") {
    // Same day: no prefix needed (the session is already scoped to the day)
    const centralYear = centralToday.getFullYear();
    const centralDayOfYear = Math.floor(
      (centralToday.getTime() - new Date(centralYear, 0, 0).getTime()) / 86400000
    );
    const expectedInstanceNum = `${centralYear}${String(centralDayOfYear).padStart(3, "0")}`;
    if (instanceNum === expectedInstanceNum) {
      return "";
    }
    return fullDate;
  }

  if (period === "week") {
    // Same week: just the weekday
    const todayMidnight = new Date(centralToday.getFullYear(), centralToday.getMonth(), centralToday.getDate());
    const startMidnight = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
    const endMidnight = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
    if (todayMidnight >= startMidnight && todayMidnight <= endMidnight) {
      return weekdayStr;
    }
    return fullDate;
  }

  return "";
}

export class SessionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findByInstance(instance: string): Promise<session | null> {
    return this.prisma.session.findUnique({
      where: {instance},
    });
  }

  async upsert(
    instance: string,
    message_list_json: string,
    context_json: string,
    weight_lbs?: Prisma.Decimal | null
  ): Promise<session> {
    return this.prisma.session.upsert({
      where: {instance},
      update: {
        message_list_json,
        context_json,
        ...(weight_lbs !== undefined ? {weight_lbs} : {}),
      },
      create: {
        instance,
        message_list_json,
        context_json,
        ...(weight_lbs !== undefined ? {weight_lbs} : {}),
      },
    });
  }

  async appendMessage(instance: string, message: string): Promise<session> {
    const existing = await this.findByInstance(instance);

    const prefix = formatMessagePrefix(instance);
    const prefixedContent = prefix ? `${prefix}\n${message}` : message;

    const newMessage: SessionMessage = {
      role: "assistant",
      content: prefixedContent,
    };

    let messages: SessionMessage[];
    let context_json: string;

    if (existing) {
      messages = JSON.parse(existing.message_list_json) as SessionMessage[];
      messages.push(newMessage);
      context_json = existing.context_json;
    } else {
      messages = [newMessage];
      context_json = JSON.stringify({data: ""});
    }

    return this.prisma.session.upsert({
      where: {instance},
      update: {message_list_json: JSON.stringify(messages)},
      create: {
        instance,
        message_list_json: JSON.stringify(messages),
        context_json,
      },
    });
  }

  /**
   * Prepends a datetime prefix to a message based on the session instance.
   * Used by the frontend to stamp user messages before saving.
   */
  prependTimestamp(instance: string, message: string): string {
    const prefix = formatMessagePrefix(instance);
    return prefix ? `${prefix}\n${message}` : message;
  }

  async setWeight(instance: string, weight_lbs: Prisma.Decimal): Promise<session> {
    const existing = await this.findByInstance(instance);

    if (existing) {
      return this.prisma.session.update({
        where: {instance},
        data: {weight_lbs},
      });
    }

    return this.prisma.session.create({
      data: {
        instance,
        message_list_json: JSON.stringify([]),
        context_json: JSON.stringify({data: ""}),
        weight_lbs,
      },
    });
  }

  async getWeightHistory(count: number = 14): Promise<{instance: string; weight_lbs: Prisma.Decimal}[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        instance: {startsWith: "day"},
        weight_lbs: {not: null},
      },
      select: {
        instance: true,
        weight_lbs: true,
      },
      orderBy: {instance: "desc"},
      take: count,
    });

    return sessions.map(s => ({
      instance: s.instance,
      weight_lbs: s.weight_lbs!,
    }));
  }

  sessionToString(s: session): string {
    const parts: string[] = [];
    parts.push(`Instance: ${s.instance}`);
    if (s.weight_lbs) {
      parts.push(`Weight: ${s.weight_lbs} lbs`);
    }
    const messages = JSON.parse(s.message_list_json) as SessionMessage[];
    if (messages.length > 0) {
      parts.push(`Messages (${messages.length}):`);
      for (const msg of messages) {
        parts.push(`  [${msg.role}]: ${msg.content}`);
      }
    } else {
      parts.push("No messages.");
    }
    return parts.join("\n");
  }
}

export const sessionService = new SessionService();
