/**
 * MCP tools for Prep entity
 */

import {prepService, prepToString, PrepContent} from "../../../services/preps";
import {McpTool, stringArgument, idArgument} from "./utils";

const viewAllPreps: McpTool = {
  name: "view_preps",
  description: "View all prep sessions from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const preps = await prepService.findMany();
    return prepService.allPreps(preps);
  },
};

const createPrep: McpTool = {
  name: "create_prep",
  description: "Create a new prep session in the Sgt Chef app",
  arguments: [
    stringArgument("week_id", "The week ID for this prep session", true),
    stringArgument("project_id", "The project ID to use (optional)", false),
    stringArgument("occurred_at", "When the prep occurred (ISO date string)", false),
    stringArgument("plan_md", "The prep plan in markdown format", false),
    stringArgument("outcome_md", "The prep outcome/results in markdown format", false),
    stringArgument("result_pic_ids", "Comma-separated Cloudinary image IDs for result photos", false),
  ],
  handler: async (args: {
    week_id: string;
    project_id?: string;
    occurred_at?: string;
    plan_md?: string;
    outcome_md?: string;
    result_pic_ids?: string;
  }): Promise<string> => {
    const {week_id, project_id, occurred_at, plan_md, outcome_md, result_pic_ids} = args;

    const data: PrepContent = {
      week_id: parseInt(week_id),
      project_id: project_id ? parseInt(project_id) : null,
      occurred_at: occurred_at ? new Date(occurred_at) : null,
      plan_md: plan_md || null,
      outcome_md: outcome_md || null,
      result_pic_ids: result_pic_ids || null,
    };

    const newPrep = await prepService.create(data);
    return `Successfully created prep session:\n\n${prepToString(newPrep)}`;
  },
};

const updatePrep: McpTool = {
  name: "update_prep",
  description: "Update an existing prep session in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("week_id", "The week ID for this prep session", false),
    stringArgument("project_id", "The project ID to use (optional)", false),
    stringArgument("occurred_at", "When the prep occurred (ISO date string)", false),
    stringArgument("plan_md", "The prep plan in markdown format", false),
    stringArgument("outcome_md", "The prep outcome/results in markdown format", false),
    stringArgument("result_pic_ids", "Comma-separated Cloudinary image IDs for result photos", false),
  ],
  handler: async (args: {
    id: number;
    week_id?: string;
    project_id?: string;
    occurred_at?: string;
    plan_md?: string;
    outcome_md?: string;
    result_pic_ids?: string;
  }): Promise<string> => {
    const {id, week_id, project_id, occurred_at, plan_md, outcome_md, result_pic_ids} = args;

    const currentPrep = await prepService.findById(id);
    if (!currentPrep) {
      throw new Error(`Prep session with ID ${id} not found`);
    }

    const data: PrepContent = {
      week_id: week_id != null ? parseInt(week_id) : currentPrep.week_id,
      project_id: project_id != null ? (project_id ? parseInt(project_id) : null) : currentPrep.project_id,
      occurred_at: occurred_at != null ? (occurred_at ? new Date(occurred_at) : null) : currentPrep.occurred_at,
      plan_md: plan_md != null ? plan_md || null : currentPrep.plan_md,
      outcome_md: outcome_md != null ? outcome_md || null : currentPrep.outcome_md,
      result_pic_ids: result_pic_ids != null ? result_pic_ids || null : currentPrep.result_pic_ids,
    };

    const updatedPrep = await prepService.update(id, data);
    return `Successfully updated prep session:\n\n${prepToString(updatedPrep)}`;
  },
};

const deletePrep: McpTool = {
  name: "delete_prep",
  description: "Delete a prep session from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedPrep = await prepService.delete(id);
    return `Successfully deleted prep session:\n\n${prepToString(deletedPrep)}`;
  },
};

export const prepMcpTools: McpTool[] = [
  viewAllPreps,
  createPrep,
  updatePrep,
  deletePrep,
];