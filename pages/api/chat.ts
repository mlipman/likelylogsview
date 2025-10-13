import type {NextApiRequest, NextApiResponse} from "next";
import {toolToSchema} from "./mcp/utils";
import {recipeMcpTools} from "./mcp/recipes";
import {projectMcpTools} from "./mcp/projects";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ToolUse {
  name: string;
  result: any;
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
const allTools = [...projectMcpTools, ...recipeMcpTools];

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
    throw new Error(data.error?.message || "Failed to get response from Anthropic");
  }

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext} = req.body;
    const toolsUsed: ToolUse[] = [];

    const response = await fetchAnthropicResponse(messagesWithContext);

    // Check if Claude wants to use tools
    let finalContent = "";

    for (const contentItem of response.content) {
      if (contentItem.type === "tool_use" && contentItem.name) {
        // Execute the MCP tool
        const toolResult = await callMCPTool(contentItem.name, contentItem.input || {});

        toolsUsed.push({
          name: contentItem.name,
          result: toolResult,
        });

        // Add tool result to context and get Claude's response
        const toolResultMessages = [
          ...messagesWithContext,
          {
            role: "assistant" as const,
            content: JSON.stringify([contentItem]), // Include the original tool_use
          },
          {
            role: "user" as const,
            content: JSON.stringify({
              type: "tool_result",
              tool_use_id: contentItem.id || "tool_1",
              content: JSON.stringify(toolResult),
            }),
          },
        ];

        const followupResponse = await fetchAnthropicResponse(toolResultMessages);
        finalContent = followupResponse.content.find(item => item.text)?.text || "";
      } else if (contentItem.type === "text" || contentItem.text) {
        finalContent = contentItem.text || "";
      }
    }

    // If no tools were used, just return the text content
    if (toolsUsed.length === 0) {
      finalContent = response.content.find(item => item.text)?.text || "";
    }

    return res.status(200).json({
      content: finalContent,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: `Failed to process chat request: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
