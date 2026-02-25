/**
 * MCP tools for Shop entity
 */

import {shopService, shopToString, ShopContent} from "../../../services/shops";
import {McpTool, stringArgument, idArgument} from "./utils";
import {Decimal} from "@prisma/client/runtime/library";
import {EntityStatus} from "@prisma/client";

const viewAllShops: McpTool = {
  name: "view_shops",
  description: "View all shopping trips from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const shops = await shopService.findMany();
    return shopService.allShops(shops);
  },
};

const createShop: McpTool = {
  name: "create_shop",
  description: "Create a new shopping trip in the Sgt Chef app",
  arguments: [
    stringArgument("week_id", "The week ID for this shopping trip", true),
    stringArgument("title", "A short title for the shopping trip", false),
    stringArgument("summary", "A brief summary of the shopping trip", false),
    stringArgument("local_date", "The local date for this trip (e.g. 2025-03-15)", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
    stringArgument("occurred_at", "When the shopping occurred (ISO date string)", false),
    stringArgument("planned_items_text", "The shopping list as text", false),
    stringArgument("planning_notes", "Notes during planning phase", false),
    stringArgument("purchased_items_text", "What was actually bought", false),
    stringArgument("store_name", "Name of the store", false),
    stringArgument("total_cost", "Total cost of shopping (numeric string)", false),
    stringArgument("receipt_pic_id", "Cloudinary image ID for receipt", false),
    stringArgument("shopping_notes", "How it went, substitutions made, etc.", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
  ],
  handler: async (args: {
    week_id: string;
    title?: string;
    summary?: string;
    local_date?: string;
    status?: string;
    occurred_at?: string;
    planned_items_text?: string;
    planning_notes?: string;
    purchased_items_text?: string;
    store_name?: string;
    total_cost?: string;
    receipt_pic_id?: string;
    shopping_notes?: string;
    details?: string;
  }): Promise<string> => {
    const {
      week_id,
      title,
      summary,
      local_date,
      status,
      occurred_at,
      planned_items_text,
      planning_notes,
      purchased_items_text,
      store_name,
      total_cost,
      receipt_pic_id,
      shopping_notes,
      details,
    } = args;

    const data: ShopContent = {
      week_id: parseInt(week_id),
      title: title || null,
      summary: summary || null,
      local_date: local_date || null,
      status: (status as EntityStatus) || EntityStatus.proposed,
      occurred_at: occurred_at ? new Date(occurred_at) : null,
      planned_items_text: planned_items_text || null,
      planning_notes: planning_notes || null,
      purchased_items_text: purchased_items_text || null,
      store_name: store_name || null,
      total_cost: total_cost ? new Decimal(total_cost) : null,
      receipt_pic_id: receipt_pic_id || null,
      shopping_notes: shopping_notes || null,
      details: details || null,
    };

    const newShop = await shopService.create(data);
    return `Successfully created shopping trip:\n\n${shopToString(newShop)}`;
  },
};

const updateShop: McpTool = {
  name: "update_shop",
  description: "Update an existing shopping trip in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("week_id", "The week ID for this shopping trip", false),
    stringArgument("title", "A short title for the shopping trip", false),
    stringArgument("summary", "A brief summary of the shopping trip", false),
    stringArgument("local_date", "The local date for this trip (e.g. 2025-03-15)", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
    stringArgument("occurred_at", "When the shopping occurred (ISO date string)", false),
    stringArgument("planned_items_text", "The shopping list as text", false),
    stringArgument("planning_notes", "Notes during planning phase", false),
    stringArgument("purchased_items_text", "What was actually bought", false),
    stringArgument("store_name", "Name of the store", false),
    stringArgument("total_cost", "Total cost of shopping (numeric string)", false),
    stringArgument("receipt_pic_id", "Cloudinary image ID for receipt", false),
    stringArgument("shopping_notes", "How it went, substitutions made, etc.", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
  ],
  handler: async (args: {
    id: number;
    week_id?: string;
    title?: string;
    summary?: string;
    local_date?: string;
    status?: string;
    occurred_at?: string;
    planned_items_text?: string;
    planning_notes?: string;
    purchased_items_text?: string;
    store_name?: string;
    total_cost?: string;
    receipt_pic_id?: string;
    shopping_notes?: string;
    details?: string;
  }): Promise<string> => {
    const {
      id,
      week_id,
      title,
      summary,
      local_date,
      status,
      occurred_at,
      planned_items_text,
      planning_notes,
      purchased_items_text,
      store_name,
      total_cost,
      receipt_pic_id,
      shopping_notes,
      details,
    } = args;

    const currentShop = await shopService.findById(id);
    if (!currentShop) {
      throw new Error(`Shopping trip with ID ${id} not found`);
    }

    const data: ShopContent = {
      week_id: week_id != null ? parseInt(week_id) : currentShop.week_id,
      title: title != null ? title || null : currentShop.title,
      summary: summary != null ? summary || null : currentShop.summary,
      local_date: local_date != null ? local_date || null : currentShop.local_date,
      status: status != null ? (status as EntityStatus) : currentShop.status,
      occurred_at: occurred_at != null ? (occurred_at ? new Date(occurred_at) : null) : currentShop.occurred_at,
      planned_items_text: planned_items_text != null ? planned_items_text || null : currentShop.planned_items_text,
      planning_notes: planning_notes != null ? planning_notes || null : currentShop.planning_notes,
      purchased_items_text: purchased_items_text != null ? purchased_items_text || null : currentShop.purchased_items_text,
      store_name: store_name != null ? store_name || null : currentShop.store_name,
      total_cost: total_cost != null ? (total_cost ? new Decimal(total_cost) : null) : currentShop.total_cost,
      receipt_pic_id: receipt_pic_id != null ? receipt_pic_id || null : currentShop.receipt_pic_id,
      shopping_notes: shopping_notes != null ? shopping_notes || null : currentShop.shopping_notes,
      details: details != null ? details || null : currentShop.details,
    };

    const updatedShop = await shopService.update(id, data);
    return `Successfully updated shopping trip:\n\n${shopToString(updatedShop)}`;
  },
};

const deleteShop: McpTool = {
  name: "delete_shop",
  description: "Delete a shopping trip from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedShop = await shopService.delete(id);
    return `Successfully deleted shopping trip:\n\n${shopToString(deletedShop)}`;
  },
};

export const shopMcpTools: McpTool[] = [
  viewAllShops,
  createShop,
  updateShop,
  deleteShop,
];
