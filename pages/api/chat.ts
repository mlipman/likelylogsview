import type {NextApiRequest, NextApiResponse} from "next";
import {toolToSchema} from "./mcp/utils";
import {recipeMcpTools} from "./mcp/recipes";
import {projectMcpTools} from "./mcp/projects";
import {weekMcpTools} from "./mcp/weeks";
import {shopMcpTools} from "./mcp/shops";
import {cookMcpTools} from "./mcp/cooks";
import {prepMcpTools} from "./mcp/preps";
import {weekService} from "../../services/weeks";
import {recipeService} from "../../services/recipes";
import {projectService} from "../../services/projects";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ConversationItem {
  type: "text" | "tool_call";
  content?: string; // For text items
  tool_name?: string; // For tool call items
  tool_input?: any; // For tool call items
  tool_output?: any; // For tool call items
}

interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
    name?: string;
    input?: any;
    id?: string;
  }>;
  stop_reason?: string;
  error?: {
    message: string;
  };
}

// Combine all available MCP tools
const allTools = [
  ...projectMcpTools,
  ...recipeMcpTools,
  ...weekMcpTools,
  ...shopMcpTools,
  ...cookMcpTools,
  ...prepMcpTools,
];

async function callMCPTool(toolName: string, args: any = {}): Promise<any> {
  // Find the tool directly instead of making HTTP request
  const tool = allTools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`MCP Tool Error: Unknown tool: ${toolName}`);
  }

  try {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    console.error("MCP tool error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`MCP Tool Error: ${message}`);
  }
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

async function fetchAnthropicResponse(
  systemPrompt: string,
  messagesWithContext: Message[]
): Promise<AnthropicResponse> {
  console.log("🤖 Making LLM request...", {
    messageCount: messagesWithContext.length,
    lastMessage:
      messagesWithContext[messagesWithContext.length - 1]?.content?.substring(0, 100) +
      "...",
  });

  const messages = messagesWithContext.map(msg => ({
    role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      system: systemPrompt,
      messages: messages,
      max_tokens: 10000,
      tools: allTools.map(tool => {
        const schema = toolToSchema(tool);
        return {
          name: schema.name,
          description: schema.description,
          input_schema: schema.inputSchema,
        };
      }),
    }),
  });

  const data: AnthropicResponse = await response.json();

  if (!response.ok) {
    console.error("❌ LLM request failed:", data.error?.message);
    throw new Error(data.error?.message || "Failed to get response from Anthropic");
  }

  console.log("✅ LLM response received", {
    stopReason: data.stop_reason,
    contentItems: data.content.length,
    contentTypes: data.content.map(item => item.type),
  });

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext, week_id} = req.body;
    const conversationItems: ConversationItem[] = [];

    // Build system prompt with week context if week_id is provided
    let systemPrompt: string;
    if (week_id) {
      const weekContext = await buildWeekContext(week_id);
      systemPrompt = SYSTEM_PROMPT_PREFIX + weekContext;
    } else {
      systemPrompt = "You are Sgt Chef, a helpful cooking assistant who gives concise, practical advice about meal planning, prep, and grocery shopping.";
    }

    // Filter out system messages from the client — we handle system prompt server-side now
    const userMessages = messagesWithContext.filter(
      (msg: Message) => msg.role !== "system"
    );

    let currentMessages = [...userMessages];

    // Continue the conversation loop until Claude stops requesting tools
    let loopCount = 0;
    while (true) {
      loopCount++;
      console.log(`Starting conversation loop ${loopCount}`);

      const response = await fetchAnthropicResponse(systemPrompt, currentMessages);

      let hasToolUse = false;
      let textContent = "";

      // Process all content items in this response
      for (const contentItem of response.content) {
        if (contentItem.type === "tool_use" && contentItem.name) {
          hasToolUse = true;

          console.log("🔧 Executing tool:", {
            name: contentItem.name,
            input: contentItem.input,
            id: contentItem.id,
          });

          // Execute the MCP tool
          const toolResult = await callMCPTool(contentItem.name, contentItem.input || {});

          console.log("✅ Tool completed:", {
            name: contentItem.name,
            outputLength: JSON.stringify(toolResult).length,
          });

          // Add tool call to conversation items
          conversationItems.push({
            type: "tool_call",
            tool_name: contentItem.name,
            tool_input: contentItem.input || {},
            tool_output: toolResult,
          });

          // Add tool use and result to message history for next iteration
          currentMessages.push({
            role: "assistant",
            content: JSON.stringify({
              type: "tool_use",
              name: contentItem.name,
              input: contentItem.input,
              id: contentItem.id,
            }),
          });

          currentMessages.push({
            role: "user",
            content: JSON.stringify({
              type: "tool_result",
              tool_use_id: contentItem.id,
              content: toolResult.content || [{type: "text", text: String(toolResult)}],
            }),
          });
        } else if (contentItem.type === "text" && contentItem.text) {
          textContent += contentItem.text;
        }
      }

      // If there's text content, add it to conversation items
      if (textContent.trim()) {
        conversationItems.push({
          type: "text",
          content: textContent.trim(),
        });
      }

      // If no tools were used in this iteration, we're done
      if (!hasToolUse || response.stop_reason === "end_turn") {
        console.log("Conversation complete", {
          totalLoops: loopCount,
          conversationItems: conversationItems.length,
          stopReason: response.stop_reason,
        });
        break;
      }
    }

    // If no conversation items were generated, add the final text content
    if (conversationItems.length === 0) {
      conversationItems.push({
        type: "text",
        content: "I apologize, but I couldn't process your request properly.",
      });
    }

    return res.status(200).json({
      conversation: conversationItems,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: `Failed to process chat request: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
