import {FormEvent, KeyboardEvent, useRef, useState} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {dateToInstanceNum} from "@/utils/dates";
import {streamChat, ConversationItem} from "@/utils/streamChat";

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  conversation?: ConversationItem[];
}

export default function CoachPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Ref to track the in-progress conversation items for the streaming assistant message
  const streamingItemsRef = useRef<ConversationItem[]>([]);

  const sendChatMessage = async () => {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || chatLoading) return;

    const userMessage: ChatMessage = {role: "user", content: trimmedInput};
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    // Initialize streaming assistant message
    streamingItemsRef.current = [];
    const assistantMessage: ChatMessage = {role: "assistant", conversation: []};
    setChatMessages(prev => [...prev, assistantMessage]);

    try {
      await streamChat({
        url: "/api/coach/chat",
        body: {
          messagesWithContext: updatedMessages.map(msg => {
            if (msg.role === "assistant" && msg.conversation) {
              const parts: string[] = [];
              for (const item of msg.conversation) {
                if (item.type === "text" && item.content) {
                  parts.push(item.content);
                } else if (item.type === "tool_call" && item.tool_name) {
                  parts.push(`[Called tool: ${item.tool_name} with input: ${JSON.stringify(item.tool_input)}]`);
                  if (item.tool_output) {
                    parts.push(`[Tool result: ${item.tool_output}]`);
                  }
                }
              }
              return {role: msg.role, content: parts.join("\n\n") || "I processed your request."};
            }
            return msg;
          }),
        },
        onText: (text: string) => {
          const items = streamingItemsRef.current;
          const last = items[items.length - 1];
          if (last && last.type === "text") {
            last.content = (last.content || "") + text;
          } else {
            items.push({type: "text", content: text});
          }
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              conversation: [...items],
            };
            return updated;
          });
        },
        onToolStart: (name: string, input: Record<string, unknown>) => {
          streamingItemsRef.current.push({
            type: "tool_call",
            tool_name: name,
            tool_input: input,
            tool_output: undefined,
          });
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              conversation: [...streamingItemsRef.current],
            };
            return updated;
          });
        },
        onToolEnd: (name: string, result: string) => {
          const items = streamingItemsRef.current;
          // Find the last tool_call with this name that has no output yet
          for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].type === "tool_call" && items[i].tool_name === name && !items[i].tool_output) {
              items[i].tool_output = result;
              break;
            }
          }
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              conversation: [...items],
            };
            return updated;
          });
        },
        onDone: () => {},
        onError: (message: string) => {
          setChatError(message);
        },
      });
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendChatMessage();
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      void sendChatMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Coach</h1>
          <p className="text-lg text-gray-600">
            Accountability partner for diet and exercise
          </p>
        </div>

        {/* Coach Chat */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Talk to Coach</h3>
          <p className="text-sm text-gray-500 mb-4">
            Log meals, exercise, ask for advice. This conversation is transient &mdash; important
            info gets saved to your daily log via tools.
          </p>

          <div className="space-y-4">
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
              {chatMessages.length === 0 && !chatLoading ? (
                <div className="text-sm text-gray-500">
                  Tell your coach what you ate, how you exercised, or ask about your progress.
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-lg px-4 py-3 text-sm shadow-sm ${
                        message.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.role === "user" && message.content && (
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {message.content}
                        </ReactMarkdown>
                      )}

                      {message.role === "assistant" && message.conversation && (
                        <div className="space-y-3">
                          {message.conversation.map((item, itemIndex) => (
                            <div key={itemIndex}>
                              {item.type === "text" && item.content && (
                                <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                  {item.content}
                                </ReactMarkdown>
                              )}
                              {item.type === "tool_call" && (
                                <details className="bg-gray-50 rounded border p-2 cursor-pointer">
                                  <summary className="text-xs font-medium text-gray-600">
                                    Tool: {item.tool_name}
                                  </summary>
                                  <div className="mt-2 space-y-2">
                                    <div>
                                      <div className="text-xs font-medium text-gray-600 mb-1">
                                        Input:
                                      </div>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(item.tool_input, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-600 mb-1">
                                        Output:
                                      </div>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                                        {JSON.stringify(item.tool_output, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {chatLoading && streamingItemsRef.current.length === 0 && (
                <div className="text-sm text-gray-500">
                  Coach is thinking...
                </div>
              )}
            </div>

            {chatError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {chatError}
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="space-y-2">
              <textarea
                value={chatInput}
                onChange={event => setChatInput(event.target.value)}
                onKeyDown={handleChatKeyDown}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Had a chicken salad for lunch... / Ran 3 miles this morning... / How am I doing this week?"
                disabled={chatLoading}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Shift + Enter to send, Enter for a new line.
                </span>
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-800">
            &larr; Back to Home
          </Link>
          <Link
            href={`/session/day/${dateToInstanceNum(new Date(), "day")}`}
            className="text-emerald-600 hover:text-emerald-800"
          >
            Today&apos;s Full Log
          </Link>
        </div>
      </div>
    </div>
  );
}
