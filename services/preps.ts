import {Prep, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type PrepContent = Omit<Prep, (typeof NON_CONTENT_FIELDS)[number]>;

export class PrepService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<Prep[]> {
    return this.prisma.prep.findMany({
      orderBy: {created_at: "desc"},
      include: {
        week: true,
        project: true,
      },
    });
  }

  findManyByWeek(weekId: number): Promise<Prep[]> {
    return this.prisma.prep.findMany({
      where: {week_id: weekId},
      orderBy: {created_at: "desc"},
      include: {
        week: true,
        project: true,
      },
    });
  }

  findById(id: number): Promise<Prep | null> {
    return this.prisma.prep.findUnique({
      where: {id},
      include: {
        week: true,
        project: true,
      },
    });
  }

  create(data: PrepContent): Promise<Prep> {
    return this.prisma.prep.create({
      data,
    });
  }

  update(id: number, data: PrepContent): Promise<Prep> {
    return this.prisma.prep.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<Prep> {
    return this.prisma.prep.delete({
      where: {id},
    });
  }

  /**
   * Format preps for MCP string output (excludes details)
   */
  allPreps(preps: Prep[]): string {
    if (preps.length === 0) {
      return "No prep sessions found.";
    }

    return `Found ${preps.length} prep sessions:\n\n${preps
      .map(prep => prepToSummaryString(prep))
      .join("\n")}`;
  }
}

// Prep utility functions for string conversion

/**
 * Convert a single prep to a summary string (excludes details)
 * Used in list/week/MCP responses
 */
export function prepToSummaryString(prep: Prep): string {
  const parts = [prep.title ? `**${prep.title}**` : `**Prep Session**`];

  parts.push(`Status: ${prep.status}`);
  if (prep.summary) parts.push(`Summary: ${prep.summary}`);
  if (prep.local_date) parts.push(`Date: ${prep.local_date}`);
  parts.push(`Week ID: ${prep.week_id}`);
  if (prep.project_id) parts.push(`Project ID: ${prep.project_id}`);
  if (prep.occurred_at) parts.push(`Occurred: ${prep.occurred_at}`);
  if (prep.plan_md) parts.push(`Plan:\n${prep.plan_md}`);
  if (prep.outcome_md) parts.push(`Outcome:\n${prep.outcome_md}`);
  if (prep.result_pic_ids) parts.push(`Result Photos: ${prep.result_pic_ids}`);

  parts.push(`ID: ${prep.id}`);
  parts.push(`Created: ${prep.created_at}`);
  parts.push(`Updated: ${prep.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

/**
 * Convert a single prep to a full string including details
 * Used for individual entity views
 */
export function prepToString(prep: Prep): string {
  const parts = [prepToSummaryString(prep).replace(/\n---\n$/, '')];

  if (prep.details) parts.push(`Details:\n${prep.details}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const prepService = new PrepService();
