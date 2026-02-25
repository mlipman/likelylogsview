/**
 * MCP tools for Cook entity
 */

import {cookService, cookToString, CookContent} from "../../../services/cooks";
import {McpTool, stringArgument, idArgument} from "./utils";
import {EntityStatus} from "@prisma/client";

const viewAllCooks: McpTool = {
  name: "view_cooks",
  description: "View all cooking sessions from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const cooks = await cookService.findMany();
    return cookService.allCooks(cooks);
  },
};

const createCook: McpTool = {
  name: "create_cook",
  description: "Create a new cooking session in the Sgt Chef app",
  arguments: [
    stringArgument("week_id", "The week ID for this cooking session", true),
    stringArgument("recipe_id", "The recipe ID to use (optional)", false),
    stringArgument("title", "A short title for the cooking session", false),
    stringArgument("summary", "A brief summary of the cooking session", false),
    stringArgument("local_date", "The local date for this cook (e.g. 2025-03-15)", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
    stringArgument("occurred_at", "When the cooking occurred (ISO date string)", false),
    stringArgument("plan_md", "The cooking plan in markdown format", false),
    stringArgument("outcome_md", "The cooking outcome/results in markdown format", false),
    stringArgument("result_pic_ids", "Comma-separated Cloudinary image IDs for result photos", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
  ],
  handler: async (args: {
    week_id: string;
    recipe_id?: string;
    title?: string;
    summary?: string;
    local_date?: string;
    status?: string;
    occurred_at?: string;
    plan_md?: string;
    outcome_md?: string;
    result_pic_ids?: string;
    details?: string;
  }): Promise<string> => {
    const {week_id, recipe_id, title, summary, local_date, status, occurred_at, plan_md, outcome_md, result_pic_ids, details} = args;

    const data: CookContent = {
      week_id: parseInt(week_id),
      recipe_id: recipe_id ? parseInt(recipe_id) : null,
      title: title || null,
      summary: summary || null,
      local_date: local_date || null,
      status: (status as EntityStatus) || EntityStatus.proposed,
      occurred_at: occurred_at ? new Date(occurred_at) : null,
      plan_md: plan_md || null,
      outcome_md: outcome_md || null,
      result_pic_ids: result_pic_ids || null,
      details: details || null,
    };

    const newCook = await cookService.create(data);
    return `Successfully created cooking session:\n\n${cookToString(newCook)}`;
  },
};

const updateCook: McpTool = {
  name: "update_cook",
  description: "Update an existing cooking session in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("week_id", "The week ID for this cooking session", false),
    stringArgument("recipe_id", "The recipe ID to use (optional)", false),
    stringArgument("title", "A short title for the cooking session", false),
    stringArgument("summary", "A brief summary of the cooking session", false),
    stringArgument("local_date", "The local date for this cook (e.g. 2025-03-15)", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
    stringArgument("occurred_at", "When the cooking occurred (ISO date string)", false),
    stringArgument("plan_md", "The cooking plan in markdown format", false),
    stringArgument("outcome_md", "The cooking outcome/results in markdown format", false),
    stringArgument("result_pic_ids", "Comma-separated Cloudinary image IDs for result photos", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
  ],
  handler: async (args: {
    id: number;
    week_id?: string;
    recipe_id?: string;
    title?: string;
    summary?: string;
    local_date?: string;
    status?: string;
    occurred_at?: string;
    plan_md?: string;
    outcome_md?: string;
    result_pic_ids?: string;
    details?: string;
  }): Promise<string> => {
    const {id, week_id, recipe_id, title, summary, local_date, status, occurred_at, plan_md, outcome_md, result_pic_ids, details} = args;

    const currentCook = await cookService.findById(id);
    if (!currentCook) {
      throw new Error(`Cooking session with ID ${id} not found`);
    }

    const data: CookContent = {
      week_id: week_id != null ? parseInt(week_id) : currentCook.week_id,
      recipe_id: recipe_id != null ? (recipe_id ? parseInt(recipe_id) : null) : currentCook.recipe_id,
      title: title != null ? title || null : currentCook.title,
      summary: summary != null ? summary || null : currentCook.summary,
      local_date: local_date != null ? local_date || null : currentCook.local_date,
      status: status != null ? (status as EntityStatus) : currentCook.status,
      occurred_at: occurred_at != null ? (occurred_at ? new Date(occurred_at) : null) : currentCook.occurred_at,
      plan_md: plan_md != null ? plan_md || null : currentCook.plan_md,
      outcome_md: outcome_md != null ? outcome_md || null : currentCook.outcome_md,
      result_pic_ids: result_pic_ids != null ? result_pic_ids || null : currentCook.result_pic_ids,
      details: details != null ? details || null : currentCook.details,
    };

    const updatedCook = await cookService.update(id, data);
    return `Successfully updated cooking session:\n\n${cookToString(updatedCook)}`;
  },
};

const deleteCook: McpTool = {
  name: "delete_cook",
  description: "Delete a cooking session from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedCook = await cookService.delete(id);
    return `Successfully deleted cooking session:\n\n${cookToString(deletedCook)}`;
  },
};

export const cookMcpTools: McpTool[] = [
  viewAllCooks,
  createCook,
  updateCook,
  deleteCook,
];
