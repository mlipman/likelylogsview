/**
 * MCP tools for StartingStatus entity
 */

import {startingStatusService, startingStatusToString, StartingStatusContent} from "../../../services/starting-statuses";
import {McpTool, stringArgument, idArgument} from "./utils";

const viewAllStartingStatuses: McpTool = {
  name: "view_starting_statuses",
  description: "View all starting statuses from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const statuses = await startingStatusService.findMany();
    return startingStatusService.allStartingStatuses(statuses);
  },
};

const createStartingStatus: McpTool = {
  name: "create_starting_status",
  description: "Create a new starting status in the Sgt Chef app",
  arguments: [
    stringArgument("week_id", "The week ID for this starting status", true),
    stringArgument("carryover_items_md", "Carryover items from previous week in markdown format", false),
    stringArgument("missing_staples_md", "Missing staples in markdown format", false),
    stringArgument("notes_md", "Additional notes in markdown format", false),
  ],
  handler: async (args: {
    week_id: string;
    carryover_items_md?: string;
    missing_staples_md?: string;
    notes_md?: string;
  }): Promise<string> => {
    const {week_id, carryover_items_md, missing_staples_md, notes_md} = args;

    const data: StartingStatusContent = {
      week_id: parseInt(week_id),
      carryover_items_md: carryover_items_md || null,
      missing_staples_md: missing_staples_md || null,
      notes_md: notes_md || null,
    };

    const newStatus = await startingStatusService.create(data);
    return `Successfully created starting status:\n\n${startingStatusToString(newStatus)}`;
  },
};

const updateStartingStatus: McpTool = {
  name: "update_starting_status",
  description: "Update an existing starting status in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("week_id", "The week ID for this starting status", false),
    stringArgument("carryover_items_md", "Carryover items from previous week in markdown format", false),
    stringArgument("missing_staples_md", "Missing staples in markdown format", false),
    stringArgument("notes_md", "Additional notes in markdown format", false),
  ],
  handler: async (args: {
    id: number;
    week_id?: string;
    carryover_items_md?: string;
    missing_staples_md?: string;
    notes_md?: string;
  }): Promise<string> => {
    const {id, week_id, carryover_items_md, missing_staples_md, notes_md} = args;

    const currentStatus = await startingStatusService.findById(id);
    if (!currentStatus) {
      throw new Error(`Starting status with ID ${id} not found`);
    }

    const data: StartingStatusContent = {
      week_id: week_id != null ? parseInt(week_id) : currentStatus.week_id,
      carryover_items_md: carryover_items_md != null ? carryover_items_md || null : currentStatus.carryover_items_md,
      missing_staples_md: missing_staples_md != null ? missing_staples_md || null : currentStatus.missing_staples_md,
      notes_md: notes_md != null ? notes_md || null : currentStatus.notes_md,
    };

    const updatedStatus = await startingStatusService.update(id, data);
    return `Successfully updated starting status:\n\n${startingStatusToString(updatedStatus)}`;
  },
};

const deleteStartingStatus: McpTool = {
  name: "delete_starting_status",
  description: "Delete a starting status from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedStatus = await startingStatusService.delete(id);
    return `Successfully deleted starting status:\n\n${startingStatusToString(deletedStatus)}`;
  },
};

export const startingStatusMcpTools: McpTool[] = [
  viewAllStartingStatuses,
  createStartingStatus,
  updateStartingStatus,
  deleteStartingStatus,
];