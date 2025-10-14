import {Cook, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type CookContent = Omit<Cook, (typeof NON_CONTENT_FIELDS)[number]>;

export class CookService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<Cook[]> {
    return this.prisma.cook.findMany({
      orderBy: {created_at: "desc"},
      include: {
        week: true,
        recipe: true,
      },
    });
  }

  findManyByWeek(weekId: number): Promise<Cook[]> {
    return this.prisma.cook.findMany({
      where: {week_id: weekId},
      orderBy: {created_at: "desc"},
      include: {
        week: true,
        recipe: true,
      },
    });
  }

  findById(id: number): Promise<Cook | null> {
    return this.prisma.cook.findUnique({
      where: {id},
      include: {
        week: true,
        recipe: true,
      },
    });
  }

  create(data: CookContent): Promise<Cook> {
    return this.prisma.cook.create({
      data,
    });
  }

  update(id: number, data: CookContent): Promise<Cook> {
    return this.prisma.cook.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<Cook> {
    return this.prisma.cook.delete({
      where: {id},
    });
  }

  /**
   * Format cooks for MCP string output
   */
  allCooks(cooks: Cook[]): string {
    if (cooks.length === 0) {
      return "No cooking sessions found.";
    }

    return `Found ${cooks.length} cooking sessions:\n\n${cooks
      .map(cook => cookToString(cook))
      .join("\n")}`;
  }
}

// Cook utility functions for string conversion

/**
 * Convert a single cook to a formatted string
 */
export function cookToString(cook: Cook): string {
  const parts = [`**Cooking Session**`];

  parts.push(`Week ID: ${cook.week_id}`);
  if (cook.recipe_id) parts.push(`Recipe ID: ${cook.recipe_id}`);
  if (cook.occurred_at) parts.push(`Occurred: ${cook.occurred_at}`);
  if (cook.plan_md) parts.push(`Plan:\n${cook.plan_md}`);
  if (cook.outcome_md) parts.push(`Outcome:\n${cook.outcome_md}`);
  if (cook.result_pic_ids) parts.push(`Result Photos: ${cook.result_pic_ids}`);

  parts.push(`ID: ${cook.id}`);
  parts.push(`Created: ${cook.created_at}`);
  parts.push(`Updated: ${cook.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const cookService = new CookService();