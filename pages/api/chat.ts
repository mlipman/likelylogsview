import type {NextApiRequest, NextApiResponse} from "next";

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

interface MCPRequest {
  jsonrpc: string;
  id: string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/*
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

async function fetchOpenAIResponse(
  messagesWithContext: Message[]
): Promise<OpenAIResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messagesWithContext,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data: OpenAIResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to get response from OpenAI");
  }

  return data;
}
*/

const MCP_SERVER_URL = "https://likelylogsview.vercel.app/api/mcp";

async function callMCPTool(toolName: string, args: any = {}): Promise<any> {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: Math.random().toString(36).substring(7),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const response = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const mcpResponse: MCPResponse = await response.json();

  if (mcpResponse.error) {
    throw new Error(`MCP Tool Error: ${mcpResponse.error.message}`);
  }

  return mcpResponse.result;
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
      tools: [
        {
          name: "view_projects",
          description: "View all cooking projects (prep templates) from the Sgt Chef app",
          input_schema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      ],
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
      if (contentItem.type === "tool_use" && contentItem.name === "view_projects") {
        // Execute the MCP tool
        const toolResult = await callMCPTool("view_projects", contentItem.input || {});

        toolsUsed.push({
          name: "view_projects",
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
              content: JSON.stringify(toolResult)
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
