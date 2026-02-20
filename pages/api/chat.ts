import type {NextApiRequest, NextApiResponse} from "next";
import {McpTool} from "./mcp/utils";
import {recipeMcpTools} from "./mcp/recipes";
import {projectMcpTools} from "./mcp/projects";
import {weekMcpTools} from "./mcp/weeks";
import {shopMcpTools} from "./mcp/shops";
import {cookMcpTools} from "./mcp/cooks";
import {prepMcpTools} from "./mcp/preps";
import {sessionMcpTools} from "./mcp/sessions";
import {weekService} from "../../services/weeks";
import {recipeService} from "../../services/recipes";
import {projectService} from "../../services/projects";
import {streamAnthropicChat} from "../../lib/streaming";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Combine all available MCP tools
const allTools: McpTool[] = [
  ...projectMcpTools,
  ...recipeMcpTools,
  ...weekMcpTools,
  ...shopMcpTools,
  ...cookMcpTools,
  ...prepMcpTools,
  ...sessionMcpTools,
];

async function callTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = allTools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`MCP Tool Error: Unknown tool: ${toolName}`);
  }

  const result = await tool.handler(args);
  return result;
}

async function buildWeekContext(weekId: number): Promise<string> {
  const week = await weekService.findByIdWithRelations(weekId);
  if (!week) {
    return "No week data found for the provided week_id.";
  }

  const recipes = await recipeService.findMany();
  const projects = await projectService.findMany();

  const parts: string[] = [];

  parts.push(`# Current Week: Week ${week.week} of ${week.year} (ID: ${week.id})`);
  parts.push("");

  // Plan
  if (week.plan_md) {
    parts.push("## Current Plan");
    parts.push(week.plan_md);
    parts.push("");
  }

  // Ingredient context
  if (week.carryover_items_md) {
    parts.push("## Carryover Ingredients");
    parts.push(week.carryover_items_md);
    parts.push("");
  }

  if (week.missing_staples_md) {
    parts.push("## Missing Staples");
    parts.push(week.missing_staples_md);
    parts.push("");
  }

  // Cooks this week
  if (week.cooks.length > 0) {
    parts.push("## Cooks This Week");
    for (const cook of week.cooks) {
      const title = cook.recipe ? cook.recipe.title : "Freestyle";
      const status = cook.outcome_md ? "completed" : "planned";
      parts.push(`- [${status}] ${title} (cook ID: ${cook.id})`);
      if (cook.plan_md) parts.push(`  Plan: ${cook.plan_md}`);
      if (cook.outcome_md) parts.push(`  Outcome: ${cook.outcome_md}`);
    }
    parts.push("");
  }

  // Preps this week
  if (week.preps.length > 0) {
    parts.push("## Preps This Week");
    for (const prep of week.preps) {
      const title = prep.project ? prep.project.title : "Prep Session";
      const status = prep.outcome_md ? "completed" : "planned";
      parts.push(`- [${status}] ${title} (prep ID: ${prep.id})`);
      if (prep.plan_md) parts.push(`  Plan: ${prep.plan_md}`);
      if (prep.outcome_md) parts.push(`  Outcome: ${prep.outcome_md}`);
    }
    parts.push("");
  }

  // Shops this week
  if (week.shops.length > 0) {
    parts.push("## Shops This Week");
    for (const shop of week.shops) {
      const name = shop.store_name || "Shopping Trip";
      const status = shop.purchased_items_text ? "completed" : "planned";
      parts.push(`- [${status}] ${name} (shop ID: ${shop.id})`);
      if (shop.planned_items_text) parts.push(`  Planned: ${shop.planned_items_text}`);
      if (shop.purchased_items_text) parts.push(`  Purchased: ${shop.purchased_items_text}`);
    }
    parts.push("");
  }

  // Available recipes
  if (recipes.length > 0) {
    parts.push("## Available Recipes");
    for (const recipe of recipes) {
      parts.push(`- ${recipe.title} (recipe ID: ${recipe.id})`);
    }
    parts.push("");
  }

  // Available projects
  if (projects.length > 0) {
    parts.push("## Available Projects");
    for (const project of projects) {
      parts.push(`- ${project.title} (project ID: ${project.id})`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

const SYSTEM_PROMPT_PREFIX = `You are Sgt Chef, a practical cooking assistant for meal planning, prep, and grocery shopping.

You have access to tools for managing the cooking app: creating/viewing/updating weeks, cooks, preps, shops, recipes, and projects.

When the user discusses meal planning ideas, you should:
1. Help brainstorm and refine ideas based on available ingredients, recipes, and projects
2. Create cooks or preps for this week when the user decides on something
3. Update the week's plan_md to capture key decisions and ideas from the conversation — this is important because future chats will read plan_md to understand the current state of planning

When updating plan_md, write it as a concise summary of the current state of plans and decisions, not a transcript of the conversation. Future chats will use this as context.

Here is the current state of this week:

`;

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext, week_id} = req.body;

    // Build system prompt with week context if week_id is provided
    let systemPrompt: string;
    if (week_id) {
      const weekContext = await buildWeekContext(week_id);
      systemPrompt = SYSTEM_PROMPT_PREFIX + weekContext;
    } else {
      systemPrompt =
        "You are Sgt Chef, a helpful cooking assistant who gives concise, practical advice about meal planning, prep, and grocery shopping.";
    }

    // Filter out system messages and map to Anthropic format
    const messages = (messagesWithContext as Message[])
      .filter(msg => msg.role !== "system")
      .map(msg => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      }));

    await streamAnthropicChat({
      systemPrompt,
      messages,
      tools: allTools,
      res,
      callTool,
    });
  } catch (error) {
    console.error("Chat error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: `Failed to process chat request: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}
