/**
 * MCP tools for Week entity
 */

import {weekService, weekToString, WeekContent} from "../../../services/weeks";
import {McpTool, stringArgument, idArgument} from "./utils";

const viewAllWeeks: McpTool = {
  name: "view_weeks",
  description: "View all weeks from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const weeks = await weekService.findMany();
    return weekService.allWeeks(weeks);
  },
};

const createWeek: McpTool = {
  name: "create_week",
  description: "Create a new week in the Sgt Chef app",
  arguments: [
    stringArgument("year", "The year (e.g., 2025)", true),
    stringArgument("week", "The week number (1-53)", true),
  ],
  handler: async (args: {
    year: string;
    week: string;
  }): Promise<string> => {
    const {year, week} = args;
    const data: WeekContent = {
      year: parseInt(year),
      week: parseInt(week),
    };
    const newWeek = await weekService.create(data);
    return `Successfully created week:\n\n${weekToString(newWeek)}`;
  },
};

const updateWeek: McpTool = {
  name: "update_week",
  description: "Update an existing week in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("year", "The year (e.g., 2025)", false),
    stringArgument("week", "The week number (1-53)", false),
  ],
  handler: async (args: {
    id: number;
    year?: string;
    week?: string;
  }): Promise<string> => {
    const {id, year, week} = args;
    const currentWeek = await weekService.findById(id);
    if (!currentWeek) {
      throw new Error(`Week with ID ${id} not found`);
    }

    const data: WeekContent = {
      year: year != null ? parseInt(year) : currentWeek.year,
      week: week != null ? parseInt(week) : currentWeek.week,
    };

    const updatedWeek = await weekService.update(id, data);
    return `Successfully updated week:\n\n${weekToString(updatedWeek)}`;
  },
};

const deleteWeek: McpTool = {
  name: "delete_week",
  description: "Delete a week from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedWeek = await weekService.delete(id);
    return `Successfully deleted week:\n\n${weekToString(deletedWeek)}`;
  },
};

export const weekMcpTools: McpTool[] = [
  viewAllWeeks,
  createWeek,
  updateWeek,
  deleteWeek,
];