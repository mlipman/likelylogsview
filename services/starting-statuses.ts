import {StartingStatus, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type StartingStatusContent = Omit<StartingStatus, (typeof NON_CONTENT_FIELDS)[number]>;

export class StartingStatusService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<StartingStatus[]> {
    return this.prisma.startingStatus.findMany({
      orderBy: {created_at: "desc"},
      include: {
        week: true,
      },
    });
  }

  findById(id: number): Promise<StartingStatus | null> {
    return this.prisma.startingStatus.findUnique({
      where: {id},
      include: {
        week: true,
      },
    });
  }

  findByWeekId(weekId: number): Promise<StartingStatus | null> {
    return this.prisma.startingStatus.findUnique({
      where: {week_id: weekId},
      include: {
        week: true,
      },
    });
  }

  create(data: StartingStatusContent): Promise<StartingStatus> {
    return this.prisma.startingStatus.create({
      data,
    });
  }

  update(id: number, data: StartingStatusContent): Promise<StartingStatus> {
    return this.prisma.startingStatus.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<StartingStatus> {
    return this.prisma.startingStatus.delete({
      where: {id},
    });
  }

  /**
   * Format starting statuses for MCP string output
   */
  allStartingStatuses(statuses: StartingStatus[]): string {
    if (statuses.length === 0) {
      return "No starting statuses found.";
    }

    return `Found ${statuses.length} starting statuses:\n\n${statuses
      .map(status => startingStatusToString(status))
      .join("\n")}`;
  }
}

// StartingStatus utility functions for string conversion

/**
 * Convert a single starting status to a formatted string
 */
export function startingStatusToString(status: StartingStatus): string {
  const parts = [`**Starting Status for Week**`];

  parts.push(`Week ID: ${status.week_id}`);
  if (status.carryover_items_md) parts.push(`Carryover Items:\n${status.carryover_items_md}`);
  if (status.missing_staples_md) parts.push(`Missing Staples:\n${status.missing_staples_md}`);
  if (status.notes_md) parts.push(`Notes:\n${status.notes_md}`);

  parts.push(`ID: ${status.id}`);
  parts.push(`Created: ${status.created_at}`);
  parts.push(`Updated: ${status.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const startingStatusService = new StartingStatusService();