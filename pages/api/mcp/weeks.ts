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
      carryover_items_md: null,
      missing_staples_md: null,
      plan_md: null,
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
    stringArgument("carryover_items_md", "Available ingredients/leftovers from previous weeks (markdown)", false),
    stringArgument("missing_staples_md", "Staples that are low or out (markdown)", false),
    stringArgument("plan_md", "Strategic planning notes for the week (markdown)", false),
  ],
  handler: async (args: {
    id: number;
    year?: string;
    week?: string;
    carryover_items_md?: string;
    missing_staples_md?: string;
    plan_md?: string;
  }): Promise<string> => {
    const {id, year, week, carryover_items_md, missing_staples_md, plan_md} = args;
    const currentWeek = await weekService.findById(id);
    if (!currentWeek) {
      throw new Error(`Week with ID ${id} not found`);
    }

    const data: WeekContent = {
      year: year != null ? parseInt(year) : currentWeek.year,
      week: week != null ? parseInt(week) : currentWeek.week,
      carryover_items_md: carryover_items_md !== undefined ? (carryover_items_md || null) : currentWeek.carryover_items_md,
      missing_staples_md: missing_staples_md !== undefined ? (missing_staples_md || null) : currentWeek.missing_staples_md,
      plan_md: plan_md !== undefined ? (plan_md || null) : currentWeek.plan_md,
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

const updateWeekPlan: McpTool = {
  name: "update_week_plan",
  description: "Update the plan_md field for a week. Use this to record planning notes, meal ideas, and strategic decisions from chat conversations.",
  arguments: [
    idArgument(),
    stringArgument("plan_md", "The updated planning notes (markdown). This replaces the entire plan_md field.", true),
  ],
  handler: async (args: {
    id: number;
    plan_md: string;
  }): Promise<string> => {
    const {id, plan_md} = args;
    const currentWeek = await weekService.findById(id);
    if (!currentWeek) {
      throw new Error(`Week with ID ${id} not found`);
    }

    const data: WeekContent = {
      year: currentWeek.year,
      week: currentWeek.week,
      carryover_items_md: currentWeek.carryover_items_md,
      missing_staples_md: currentWeek.missing_staples_md,
      plan_md: plan_md || null,
    };

    const updatedWeek = await weekService.update(id, data);
    return `Successfully updated week plan:\n\n${weekToString(updatedWeek)}`;
  },
};

const readWeekPlan: McpTool = {
  name: "read_week_plan",
  description: "Read the current plan_md for a week. Use this to get the latest planning notes if they may have changed since the conversation started.",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const week = await weekService.findById(id);
    if (!week) {
      throw new Error(`Week with ID ${id} not found`);
    }

    if (!week.plan_md) {
      return `Week ${week.week} of ${week.year} (ID: ${id}) has no plan yet.`;
    }

    return `Plan for Week ${week.week} of ${week.year} (ID: ${id}):\n\n${week.plan_md}`;
  },
};

export const weekMcpTools: McpTool[] = [
  viewAllWeeks,
  createWeek,
  updateWeek,
  deleteWeek,
  updateWeekPlan,
  readWeekPlan,
];
