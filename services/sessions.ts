import {session, PrismaClient, Prisma} from "@prisma/client";
import prisma from "../lib/prisma";

interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string;
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

    const newMessage: SessionMessage = {
      role: "assistant",
      content: message,
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
