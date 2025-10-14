import type {NextApiRequest, NextApiResponse} from "next";
import {toolToSchema} from "./mcp/utils";
import {recipeMcpTools} from "./mcp/recipes";
import {projectMcpTools} from "./mcp/projects";
import {weekMcpTools} from "./mcp/weeks";
import {shopMcpTools} from "./mcp/shops";
import {cookMcpTools} from "./mcp/cooks";
import {prepMcpTools} from "./mcp/preps";
import {startingStatusMcpTools} from "./mcp/starting-statuses";

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
  ...startingStatusMcpTools,
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

async function fetchAnthropicResponse(
  messagesWithContext: Message[]
): Promise<AnthropicResponse> {
  console.log("🤖 Making LLM request...", {
    messageCount: messagesWithContext.length,
    lastMessage:
      messagesWithContext[messagesWithContext.length - 1]?.content?.substring(0, 100) +
      "...",
  });

  const messages = messagesWithContext.map(msg => ({
    role: msg.role === "assistant" ? "assistant" : "user",
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
      messages: messages,
      max_tokens: 10000,
      tools: allTools.map(tool => {
        const schema = toolToSchema(tool);
        return {
          name: schema.name,
          description: schema.description,
          input_schema: schema.inputSchema, // Convert camelCase to snake_case for Anthropic API
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
    const {messagesWithContext} = req.body;
    const conversationItems: ConversationItem[] = [];
    let currentMessages = [...messagesWithContext];

    // Continue the conversation loop until Claude stops requesting tools
    let loopCount = 0;
    while (true) {
      loopCount++;
      console.log(`Starting conversation loop ${loopCount}`);

      const response = await fetchAnthropicResponse(currentMessages);

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
