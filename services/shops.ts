import {Shop, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type ShopContent = Omit<Shop, (typeof NON_CONTENT_FIELDS)[number]>;

export class ShopService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<Shop[]> {
    return this.prisma.shop.findMany({
      orderBy: {created_at: "desc"},
      include: {
        week: true,
      },
    });
  }

  findManyByWeek(weekId: number): Promise<Shop[]> {
    return this.prisma.shop.findMany({
      where: {week_id: weekId},
      orderBy: {created_at: "desc"},
      include: {
        week: true,
      },
    });
  }

  findById(id: number): Promise<Shop | null> {
    return this.prisma.shop.findUnique({
      where: {id},
      include: {
        week: true,
      },
    });
  }

  create(data: ShopContent): Promise<Shop> {
    return this.prisma.shop.create({
      data,
    });
  }

  update(id: number, data: ShopContent): Promise<Shop> {
    return this.prisma.shop.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<Shop> {
    return this.prisma.shop.delete({
      where: {id},
    });
  }

  /**
   * Format shops for MCP string output
   */
  allShops(shops: Shop[]): string {
    if (shops.length === 0) {
      return "No shops found.";
    }

    return `Found ${shops.length} shopping trips:\n\n${shops
      .map(shop => shopToString(shop))
      .join("\n")}`;
  }
}

// Shop utility functions for string conversion

/**
 * Convert a single shop to a formatted string
 */
export function shopToString(shop: Shop): string {
  const parts = [`**Shopping Trip**`];

  parts.push(`Week ID: ${shop.week_id}`);
  if (shop.occurred_at) parts.push(`Occurred: ${shop.occurred_at}`);
  if (shop.planned_items_text) parts.push(`Planned Items:\n${shop.planned_items_text}`);
  if (shop.planning_notes) parts.push(`Planning Notes:\n${shop.planning_notes}`);
  if (shop.purchased_items_text) parts.push(`Purchased Items:\n${shop.purchased_items_text}`);
  if (shop.store_name) parts.push(`Store: ${shop.store_name}`);
  if (shop.total_cost) parts.push(`Total Cost: $${shop.total_cost}`);
  if (shop.receipt_pic_id) parts.push(`Receipt Photo ID: ${shop.receipt_pic_id}`);
  if (shop.shopping_notes) parts.push(`Shopping Notes:\n${shop.shopping_notes}`);

  parts.push(`ID: ${shop.id}`);
  parts.push(`Created: ${shop.created_at}`);
  parts.push(`Updated: ${shop.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const shopService = new ShopService();