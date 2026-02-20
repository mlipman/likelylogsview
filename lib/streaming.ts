import type {NextApiResponse} from "next";
import type {McpTool} from "@/pages/api/mcp/utils";
import {toolToSchema} from "@/pages/api/mcp/utils";

// =============================================================================
// Types
// =============================================================================

interface Message {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

interface AnthropicContentBlock {
  type: "text" | "tool_use";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** SSE event types sent to the client */
type SseEventType = "text" | "tool_start" | "tool_end" | "done" | "error";

// Anthropic streaming event types
interface ContentBlockStart {
  type: "content_block_start";
  index: number;
  content_block: AnthropicContentBlock;
}

interface ContentBlockDelta {
  type: "content_block_delta";
  index: number;
  delta: {
    type: "text_delta" | "input_json_delta";
    text?: string;
    partial_json?: string;
  };
}

interface MessageDelta {
  type: "message_delta";
  delta: {
    stop_reason: string | null;
  };
}

type AnthropicStreamEvent = ContentBlockStart | ContentBlockDelta | MessageDelta | {type: string};

// =============================================================================
// SSE helpers
// =============================================================================

function writeSse(res: NextApiResponse, event: SseEventType, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function initSse(res: NextApiResponse): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

// =============================================================================
// Anthropic streaming
// =============================================================================

interface StreamAnthropicOptions {
  systemPrompt: string;
  messages: Message[];
  tools: McpTool[];
  res: NextApiResponse;
  callTool: (name: string, input: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Stream an Anthropic conversation with tool-calling loop over SSE.
 *
 * Sets SSE headers, then streams text tokens and tool call events to the
 * client. Handles multiple tool-calling rounds server-side, starting a new
 * Anthropic stream after each tool result.
 */
export async function streamAnthropicChat({
  systemPrompt,
  messages,
  tools,
  res,
  callTool,
}: StreamAnthropicOptions): Promise<void> {
  initSse(res);

  const anthropicTools = tools.map(tool => {
    const schema = toolToSchema(tool);
    return {
      name: schema.name,
      description: schema.description,
      input_schema: schema.inputSchema,
    };
  });

  let currentMessages = [...messages];
  let loopCount = 0;

  try {
    while (true) {
      loopCount++;
      console.log(`Streaming conversation loop ${loopCount}`);

      const {contentBlocks, stopReason} = await streamOneRound({
        systemPrompt,
        messages: currentMessages,
        tools: anthropicTools,
        res,
      });

      // Check if we need to handle tool calls
      const toolBlocks = contentBlocks.filter(b => b.type === "tool_use");

      if (toolBlocks.length === 0 || stopReason === "end_turn") {
        break;
      }

      // Build assistant message with all content blocks from this round
      const assistantContent: AnthropicContentBlock[] = contentBlocks.map(b => {
        if (b.type === "text") {
          return {type: "text" as const, text: b.text};
        }
        return {type: "tool_use" as const, id: b.id, name: b.name, input: b.input};
      });

      currentMessages.push({role: "assistant", content: assistantContent});

      // Execute each tool and send events
      const toolResults: Array<{type: "tool_result"; tool_use_id: string; content: string}> =
        [];

      for (const block of toolBlocks) {
        if (!block.name || !block.id) continue;

        writeSse(res, "tool_start", {name: block.name, input: block.input});

        try {
          const result = await callTool(block.name, block.input || {});
          const resultText = typeof result === "string" ? result : JSON.stringify(result);

          writeSse(res, "tool_end", {name: block.name, result: resultText});
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: resultText,
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          writeSse(res, "tool_end", {name: block.name, result: `Error: ${errMsg}`});
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error: ${errMsg}`,
          });
        }
      }

      // Add tool results as a user message (Anthropic expects this format)
      currentMessages.push({
        role: "user",
        content: toolResults as unknown as AnthropicContentBlock[],
      });
    }

    writeSse(res, "done", {});
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Streaming error:", errMsg);
    writeSse(res, "error", {message: errMsg});
  } finally {
    res.end();
  }
}

// =============================================================================
// Single streaming round
// =============================================================================

interface StreamOneRoundOptions {
  systemPrompt: string;
  messages: Message[];
  tools: Array<{name: string; description: string; input_schema: unknown}>;
  res: NextApiResponse;
}

interface StreamRoundResult {
  contentBlocks: AnthropicContentBlock[];
  stopReason: string | null;
}

async function streamOneRound({
  systemPrompt,
  messages,
  tools,
  res,
}: StreamOneRoundOptions): Promise<StreamRoundResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      messages,
      max_tokens: 10000,
      stream: true,
      tools,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error("No response body from Anthropic API");
  }

  const contentBlocks: AnthropicContentBlock[] = [];
  let stopReason: string | null = null;

  // Track in-progress blocks by index
  const blocksByIndex: Map<number, AnthropicContentBlock> = new Map();
  const jsonAccumulators: Map<number, string> = new Map();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const {done, value} = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, {stream: true});

    // Parse SSE lines from the buffer
    const lines = buffer.split("\n");
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      let event: AnthropicStreamEvent;
      try {
        event = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      switch (event.type) {
        case "content_block_start": {
          const e = event as ContentBlockStart;
          blocksByIndex.set(e.index, {...e.content_block});
          if (e.content_block.type === "tool_use") {
            jsonAccumulators.set(e.index, "");
          }
          break;
        }
        case "content_block_delta": {
          const e = event as ContentBlockDelta;
          if (e.delta.type === "text_delta" && e.delta.text) {
            // Stream text to client immediately
            writeSse(res, "text", {text: e.delta.text});
            // Accumulate for the content block
            const block = blocksByIndex.get(e.index);
            if (block) {
              block.text = (block.text || "") + e.delta.text;
            }
          } else if (e.delta.type === "input_json_delta" && e.delta.partial_json) {
            const acc = jsonAccumulators.get(e.index) || "";
            jsonAccumulators.set(e.index, acc + e.delta.partial_json);
          }
          break;
        }
        case "content_block_stop": {
          const stopEvent = event as ContentBlockStart & {index: number};
          const index = stopEvent.index;
          const block = blocksByIndex.get(index);
          if (block) {
            // Parse accumulated JSON for tool_use blocks
            if (block.type === "tool_use") {
              const json = jsonAccumulators.get(index) || "{}";
              try {
                block.input = JSON.parse(json);
              } catch {
                block.input = {};
              }
              jsonAccumulators.delete(index);
            }
            contentBlocks.push(block);
            blocksByIndex.delete(index);
          }
          break;
        }
        case "message_delta": {
          const e = event as MessageDelta;
          stopReason = e.delta.stop_reason;
          break;
        }
      }
    }
  }

  return {contentBlocks, stopReason};
}
