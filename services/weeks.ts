import {Week, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type WeekContent = Omit<Week, (typeof NON_CONTENT_FIELDS)[number]>;

export class WeekService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<Week[]> {
    return this.prisma.week.findMany({
      orderBy: {created_at: "desc"},
    });
  }

  findManyWithRelations(): Promise<(Week & {
    cooks: Array<{
      id: number;
      recipe: { title: string } | null;
      plan_md: string | null;
      outcome_md: string | null;
    }>;
    preps: Array<{
      id: number;
      project: { title: string } | null;
      outcome_md: string | null;
    }>;
    shops: Array<{
      id: number;
      store_name: string | null;
      purchased_items_text: string | null;
    }>;
  })[]> {
    return this.prisma.week.findMany({
      orderBy: {created_at: "desc"},
      include: {
        cooks: {
          select: {
            id: true,
            plan_md: true,
            outcome_md: true,
            recipe: {
              select: {
                title: true,
              },
            },
          },
        },
        preps: {
          select: {
            id: true,
            outcome_md: true,
            project: {
              select: {
                title: true,
              },
            },
          },
        },
        shops: {
          select: {
            id: true,
            store_name: true,
            purchased_items_text: true,
          },
        },
      },
    });
  }

  findById(id: number): Promise<Week | null> {
    return this.prisma.week.findUnique({
      where: {id},
    });
  }

  create(data: WeekContent): Promise<Week> {
    return this.prisma.week.create({
      data,
    });
  }

  update(id: number, data: WeekContent): Promise<Week> {
    return this.prisma.week.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<Week> {
    return this.prisma.week.delete({
      where: {id},
    });
  }

  /**
   * Format weeks for MCP string output
   */
  allWeeks(weeks: Week[]): string {
    if (weeks.length === 0) {
      return "No weeks found.";
    }

    return `Found ${weeks.length} weeks:\n\n${weeks
      .map(week => weekToString(week))
      .join("\n")}`;
  }
}

// Week utility functions for string conversion

/**
 * Convert a single week to a formatted string
 */
export function weekToString(week: Week): string {
  const parts = [`**Week ${week.week} of ${week.year}**`];

  parts.push(`ID: ${week.id}`);
  parts.push(`Created: ${week.created_at}`);
  parts.push(`Updated: ${week.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const weekService = new WeekService();