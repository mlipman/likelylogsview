/**
 * Client-side utility for consuming SSE streams from the chat API endpoints.
 * Used by both the Coach page and the Sgt Chef cooking page.
 */

export interface ConversationItem {
  type: "text" | "tool_call";
  content?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
}

interface StreamChatOptions {
  url: string;
  body: Record<string, unknown>;
  onText: (text: string) => void;
  onToolStart: (name: string, input: Record<string, unknown>) => void;
  onToolEnd: (name: string, result: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Sends a POST request to an SSE chat endpoint and processes events as they arrive.
 * Returns a promise that resolves when the stream is complete.
 */
export async function streamChat({
  url,
  body,
  onText,
  onToolStart,
  onToolEnd,
  onDone,
  onError,
}: StreamChatOptions): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // If the server returned JSON error before starting SSE
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const {done, value} = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, {stream: true});

    // Parse SSE events from buffer
    // SSE events are separated by double newlines
    const parts = buffer.split("\n\n");
    // Keep the last potentially-incomplete part
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        }
      }

      if (!eventType || !eventData) continue;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(eventData);
      } catch {
        continue;
      }

      switch (eventType) {
        case "text":
          onText(parsed.text as string);
          break;
        case "tool_start":
          onToolStart(
            parsed.name as string,
            parsed.input as Record<string, unknown>
          );
          break;
        case "tool_end":
          onToolEnd(parsed.name as string, parsed.result as string);
          break;
        case "done":
          onDone();
          break;
        case "error":
          onError(parsed.message as string);
          break;
      }
    }
  }
}
