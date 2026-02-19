import {FormEvent, KeyboardEvent, useEffect, useState} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {dateToInstanceNum} from "@/utils/dates";

interface ConversationItem {
  type: "text" | "tool_call";
  content?: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
}

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  conversation?: ConversationItem[];
}

interface SessionMessage {
  role: string;
  content: string;
}

interface DailyData {
  weight_lbs: string | null;
  messages: SessionMessage[];
}

export default function CoachPage() {
  const [dailyData, setDailyData] = useState<DailyData>({weight_lbs: null, messages: []});
  const [pageLoading, setPageLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);

  const todayInstance = `day${dateToInstanceNum(new Date(), "day")}`;

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const response = await fetch(`/api/session?instance=${todayInstance}`);
        if (response.ok) {
          const session = await response.json();
          const messages = JSON.parse(session.message_list_json) as SessionMessage[];
          setDailyData({
            weight_lbs: session.weight_lbs,
            messages,
          });
          if (session.weight_lbs) {
            setWeightInput(String(session.weight_lbs));
          }
        }
      } catch (error) {
        console.error("Failed to fetch today's session:", error);
      } finally {
        setPageLoading(false);
      }
    };
    fetchToday();
  }, [todayInstance]);

  const saveWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0 || weightSaving) return;

    setWeightSaving(true);
    try {
      const response = await fetch(`/api/session?instance=${todayInstance}`);
      let messageListJson = JSON.stringify([]);
      let contextJson = JSON.stringify({data: ""});

      if (response.ok) {
        const existing = await response.json();
        messageListJson = existing.message_list_json;
        contextJson = existing.context_json;
      }

      await fetch("/api/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          instance: todayInstance,
          message_list_json: messageListJson,
          context_json: contextJson,
          weight_lbs: weight,
        }),
      });

      setDailyData(prev => ({...prev, weight_lbs: String(weight)}));
    } catch (error) {
      console.error("Failed to save weight:", error);
    } finally {
      setWeightSaving(false);
    }
  };

  const handleWeightKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveWeight();
    }
  };

  const sendChatMessage = async () => {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || chatLoading) return;

    const userMessage: ChatMessage = {role: "user", content: trimmedInput};
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          messagesWithContext: updatedMessages.map(msg => {
            if (msg.role === "assistant" && msg.conversation) {
              const textItems = msg.conversation
                .filter(item => item.type === "text" && item.content)
                .map(item => item.content)
                .join("\n\n");
              return {
                role: msg.role,
                content: textItems || "I processed your request.",
              };
            }
            return msg;
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        conversation: data.conversation,
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Refresh today's data since the coach may have added session messages
      const sessionResponse = await fetch(`/api/session?instance=${todayInstance}`);
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        const messages = JSON.parse(session.message_list_json) as SessionMessage[];
        setDailyData({
          weight_lbs: session.weight_lbs,
          messages,
        });
      }
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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChatMessage();
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Coach</h2>
          <p className="text-gray-600">Gathering your data...</p>
        </div>
      </div>
    );
  }

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

        {/* Today's Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Today</h2>

          {/* Weight */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-gray-700 w-16">Weight</label>
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onKeyDown={handleWeightKeyDown}
              placeholder="lbs"
              className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={saveWeight}
              disabled={weightSaving || !weightInput.trim()}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {weightSaving ? "Saving..." : "Save"}
            </button>
            {dailyData.weight_lbs && (
              <span className="text-sm text-gray-500">
                Recorded: {dailyData.weight_lbs} lbs
              </span>
            )}
          </div>

          {/* Today's session messages */}
          {dailyData.messages.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Today&apos;s Log ({dailyData.messages.length} entries)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dailyData.messages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-xs font-medium text-gray-400 mr-2">
                      [{msg.role}]
                    </span>
                    <span className="text-gray-700">{msg.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dailyData.messages.length === 0 && !dailyData.weight_lbs && (
            <p className="text-sm text-gray-500">
              No data logged today yet. Start by logging your weight or chatting with your coach.
            </p>
          )}
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

              {chatLoading && (
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
                  Press Enter to send, Shift + Enter for a new line.
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
