// import { useRouter } from "next/router";
import Link from "next/link";
import {FormEvent, KeyboardEvent, useEffect, useState} from "react";
import {getCurrentWeek, formatWeekRange} from "../../utils/weekUtils";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface Cook {
  id: number;
  recipe: {title: string} | null;
  plan_md: string | null;
  outcome_md: string | null;
}

interface Prep {
  id: number;
  project: {title: string} | null;
  outcome_md: string | null;
}

interface Shop {
  id: number;
  store_name: string | null;
  purchased_items_text: string | null;
}

interface Week {
  id: number;
  year: number;
  week: number;
  carryover_items_md: string | null;
  missing_staples_md: string | null;
  plan_md: string | null;
  cooks: Cook[];
  preps: Prep[];
  shops: Shop[];
}

interface ConversationItem {
  type: "text" | "tool_call";
  content?: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  conversation?: ConversationItem[];
}

export default function CookingHome() {
  // const router = useRouter();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number | null>(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [currentWeekData, setCurrentWeekData] = useState<{
    year: number;
    week: number;
  } | null>(null);
  const [isCreatingWeek, setIsCreatingWeek] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          week_id: currentWeek?.id,
          messagesWithContext: updatedMessages.map(msg => {
            // Convert assistant messages with conversation back to content format for API
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

      setChatMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Sorry, something went wrong. Please try again."
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

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch("/api/cooking/weeks");
        const data = await response.json();
        setWeeks(data);

        // Get current week according to Saturday-Friday rule
        const currentWeek = getCurrentWeek();
        setCurrentWeekData(currentWeek);

        // Find if current week exists in data
        const currentWeekRecord = data.find(
          (week: Week) => week.year === currentWeek.year && week.week === currentWeek.week
        );

        if (currentWeekRecord) {
          // Set current week as the active one
          const currentIndex = data.indexOf(currentWeekRecord);
          setCurrentWeekIndex(currentIndex);
        } else {
          // Current week doesn't exist, we'll show create button
          setCurrentWeekIndex(null);
        }
      } catch (error) {
        console.error("Failed to fetch weeks:", error);
      } finally {
        setWeekLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  const currentWeek = currentWeekIndex !== null ? weeks[currentWeekIndex] : null;

  const handleCreateCurrentWeek = async () => {
    if (!currentWeekData || isCreatingWeek) return;

    setIsCreatingWeek(true);
    try {
      const response = await fetch("/api/cooking/weeks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: currentWeekData.year,
          week: currentWeekData.week,
        }),
      });

      if (response.ok) {
        await response.json();
        // Refetch weeks to get updated list with the new week
        const weeksResponse = await fetch("/api/cooking/weeks");
        const updatedWeeks = await weeksResponse.json();
        setWeeks(updatedWeeks);

        // Find and set the newly created week as current
        const newWeekIndex = updatedWeeks.findIndex(
          (week: Week) =>
            week.year === currentWeekData.year && week.week === currentWeekData.week
        );
        if (newWeekIndex >= 0) {
          setCurrentWeekIndex(newWeekIndex);
        }
      } else {
        console.error("Failed to create week");
      }
    } catch (error) {
      console.error("Error creating week:", error);
    } finally {
      setIsCreatingWeek(false);
    }
  };

  if (weekLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/sgt_chef_logo.png"
            alt="Sgt Chef Logo"
            className="h-20 w-20 rounded-lg shadow-md object-cover mx-auto mb-4"
          />
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Sgt Chef</h2>
          <p className="text-gray-600">Preparing your cooking dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src="/sgt_chef_logo.png"
              alt="Sgt Chef Logo"
              className="h-16 w-16 rounded-lg shadow-md object-cover"
            />
          </div>

          {/* Title and Description */}
          <div>
            <h1 className={styles.pageHeader}>Sgt Chef</h1>
            <p className="text-lg text-gray-600">
              Your personal cooking assistant for planning and tracking meals
            </p>
          </div>
        </div>

        {/* Week Selector */}
        <div className={styles.cardMb}>
          {currentWeekData ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Current Week</h2>
                {currentWeek ? (
                  <p className="text-gray-600">{formatWeekRange(currentWeek.year, currentWeek.week)}</p>
                ) : (
                  <p className="text-gray-600">
                    Week {currentWeekData.week}, {currentWeekData.year}
                  </p>
                )}
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  {currentWeek && currentWeekIndex != null ? (
                    <>
                      <button
                        onClick={() => setCurrentWeekIndex(i => (i || 0) + 1)}
                        disabled={currentWeekIndex >= weeks.length - 1}
                        className={`${styles.button.base} ${styles.button.secondary} ${styles.button.disabled}`}
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setCurrentWeekIndex(i => (i || 0) - 1)}
                        disabled={currentWeekIndex === 0}
                        className={`${styles.button.base} ${styles.button.secondary} ${styles.button.disabled}`}
                      >
                        Next →
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateCurrentWeek}
                      disabled={isCreatingWeek}
                      className={`${styles.button.base} ${styles.button.primary} ${styles.button.disabled}`}
                    >
                      {isCreatingWeek ? "Creating..." : "Create This Week"}
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <Link href="/cooking/weeks" className={styles.link.blue}>
                    Manage Weeks
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-2">Unable to determine current week</p>
              <Link href="/cooking/weeks/new" className={styles.link.purple}>
                Add Week Manually
              </Link>
            </div>
          )}
        </div>

        {currentWeek && (currentWeek.plan_md || currentWeek.carryover_items_md || currentWeek.missing_staples_md) && (
          <div className={styles.cardMb}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={styles.sectionHeader + " !mb-0"}>Week Plan</h3>
              <Link
                href={`/cooking/weeks/${currentWeek.id}?edit=1`}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Edit
              </Link>
            </div>
            {currentWeek.plan_md && (
              <div className="text-gray-700 whitespace-pre-wrap mb-4">{currentWeek.plan_md}</div>
            )}
            {(currentWeek.carryover_items_md || currentWeek.missing_staples_md) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentWeek.carryover_items_md && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Carryover Ingredients</h4>
                    <div className="text-sm text-green-900 whitespace-pre-wrap">{currentWeek.carryover_items_md}</div>
                  </div>
                )}
                {currentWeek.missing_staples_md && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">Missing Staples</h4>
                    <div className="text-sm text-amber-900 whitespace-pre-wrap">{currentWeek.missing_staples_md}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentWeek && (
          <>
            <div className={styles.cardMb}>
              <h3 className={styles.sectionHeader}>Cooks This Week</h3>
              {currentWeek.cooks.length === 0 ? (
                <p className="text-gray-600">No cooks planned.</p>
              ) : (
                <ul className={styles.spacingY}>
                  {currentWeek.cooks.map(cook => (
                    <li key={cook.id} className={styles.listItem}>
                      <div>
                        <p className="text-gray-800">
                          {cook.recipe ? cook.recipe.title : "No recipe / Freestyle"}
                        </p>
                      </div>
                      <div className={styles.actionGroup}>
                        <Link
                          href={`/cooking/cooks/${cook.id}`}
                          className={styles.link.blue}
                        >
                          View
                        </Link>
                        {!cook.outcome_md && (
                          <Link
                            href={`/cooking/cooks/${cook.id}?edit=1`}
                            className={styles.link.green}
                          >
                            Record
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.cardMb}>
              <h3 className={styles.sectionHeader}>Preps This Week</h3>
              {currentWeek.preps.length === 0 ? (
                <p className="text-gray-600">No preps planned.</p>
              ) : (
                <ul className={styles.spacingY}>
                  {currentWeek.preps.map(prep => (
                    <li key={prep.id} className={styles.listItem}>
                      <div>
                        <p className="text-gray-800">
                          {prep.project ? prep.project.title : "Prep Session"}
                        </p>
                      </div>
                      <div className={styles.actionGroup}>
                        <Link
                          href={`/cooking/preps/${prep.id}`}
                          className={styles.link.blue}
                        >
                          View
                        </Link>
                        {!prep.outcome_md && (
                          <Link
                            href={`/cooking/preps/${prep.id}?edit=1`}
                            className={styles.link.green}
                          >
                            Record
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.cardMb}>
              <h3 className={styles.sectionHeader}>Shops This Week</h3>
              {currentWeek.shops.length === 0 ? (
                <p className="text-gray-600">No shopping trips planned.</p>
              ) : (
                <ul className={styles.spacingY}>
                  {currentWeek.shops.map(shop => (
                    <li key={shop.id} className={styles.listItem}>
                      <div>
                        <p className="text-gray-800">
                          {shop.store_name || "Shopping Trip"}
                        </p>
                      </div>
                      <div className={styles.actionGroup}>
                        <Link
                          href={`/cooking/shops/${shop.id}`}
                          className={styles.link.blue}
                        >
                          View
                        </Link>
                        {!shop.purchased_items_text && (
                          <Link
                            href={`/cooking/shops/${shop.id}?edit=1`}
                            className={styles.link.green}
                          >
                            Record
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Main Functions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Shop */}
          <div className={styles.card}>
            <div className="flex items-center mb-4">
              <div
                className={`${styles.iconContainer.base} ${styles.iconContainer.blue}`}
              >
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <Link href="/cooking/shops">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
                    Shop
                  </h3>
                </Link>
                <p className="text-gray-600">Grocery shopping</p>
              </div>
            </div>
            <div className={`${styles.spacingY2} mb-4`}>
              <Link href="/cooking/shops/new" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.purple}`}
                >
                  Plan Shopping List
                </button>
              </Link>
              <Link href="/cooking/shop-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.blue}`}
                >
                  Record Shopping Trip
                </button>
              </Link>
              <Link href="/cooking/staples" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  View Staples
                </button>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>
                This week: {currentWeek ? currentWeek.shops.length : 0} trip
                {currentWeek && currentWeek.shops.length !== 1 ? "s" : ""} planned
              </p>
            </div>
          </div>

          {/* Prep */}
          <div className={styles.card}>
            <div className="flex items-center mb-4">
              <div
                className={`${styles.iconContainer.base} ${styles.iconContainer.orange}`}
              >
                <span className="text-2xl">🔪</span>
              </div>
              <div>
                <Link href="/cooking/preps">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-orange-600 cursor-pointer transition-colors">
                    Prep
                  </h3>
                </Link>
                <p className="text-gray-600">Meal preparation</p>
              </div>
            </div>
            <div className={`${styles.spacingY2} mb-4`}>
              <Link href="/cooking/preps/new" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.purple}`}
                >
                  Plan Prep Project
                </button>
              </Link>
              <Link href="/cooking/prep-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.blue}`}
                >
                  Record Prep Session
                </button>
              </Link>
              <Link href="/cooking/projects" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  View Projects
                </button>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>
                This week: {currentWeek ? currentWeek.preps.length : 0} project
                {currentWeek && currentWeek.preps.length !== 1 ? "s" : ""} in progress
              </p>
            </div>
          </div>

          {/* Cook */}
          <div className={styles.card}>
            <div className="flex items-center mb-4">
              <div className={`${styles.iconContainer.base} ${styles.iconContainer.red}`}>
                <span className="text-2xl">👨‍🍳</span>
              </div>
              <div>
                <Link href="/cooking/cooks">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-red-600 cursor-pointer transition-colors">
                    Cook
                  </h3>
                </Link>
                <p className="text-gray-600">Making meals</p>
              </div>
            </div>
            <div className={`${styles.spacingY2} mb-4`}>
              <Link href="/cooking/add-cook" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.purple}`}
                >
                  Plan New Cook
                </button>
              </Link>
              <Link href="/cooking/cook-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.blue}`}
                >
                  Record Cooking
                </button>
              </Link>
              <Link href="/cooking/recipes" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  Browse Recipes
                </button>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>
                This week: {currentWeek ? currentWeek.cooks.length : 0} meal
                {currentWeek && currentWeek.cooks.length !== 1 ? "s" : ""} planned
              </p>
            </div>
          </div>
        </div>

        {/* Sgt Chef Chat */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ask Sgt Chef</h3>
          <p className="text-gray-600 mb-4">
            Get quick ideas about what to cook, how to prep, or what to buy. Sgt Chef
            remembers this conversation while you stay on this page.
          </p>

          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {chatMessages.length === 0 && !chatLoading ? (
                <div className="text-sm text-gray-500">
                  Ask for recipe ideas, prep strategies, or shopping help to get started.
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
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {/* Handle user messages with simple content */}
                      {message.role === "user" && message.content && (
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {message.content}
                        </ReactMarkdown>
                      )}

                      {/* Handle assistant messages with conversation items */}
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
                                    🔧 Tool: {item.tool_name}
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
                  Sgt Chef is thinking and may be checking your cooking data...
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Ask for cooking suggestions, prep plans, or shopping tips..."
                disabled={chatLoading}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Press Enter to send, Shift + Enter for a new line.
                </span>
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/" className={styles.link.blue}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: "bg-white rounded-lg shadow-md p-6",
  cardMb: "bg-white rounded-lg shadow-md p-6 mb-8",
  button: {
    base: "px-4 py-2 rounded transition-colors",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },
  actionButton: {
    base: "w-full text-left px-4 py-2 rounded transition-colors",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-100",
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    teal: "bg-teal-50 text-teal-700 hover:bg-teal-100",
  },
  quickActionButton:
    "flex items-center justify-center px-4 py-3 rounded transition-colors",
  iconContainer: {
    base: "w-12 h-12 rounded-lg flex items-center justify-center mr-4",
    blue: "bg-blue-100",
    orange: "bg-orange-100",
    red: "bg-red-100",
  },
  link: {
    blue: "text-blue-600 hover:text-blue-800",
    green: "text-green-600 hover:text-green-800",
    purple: "text-purple-600 hover:text-purple-800",
    orange: "text-orange-600 hover:text-orange-600",
    red: "text-red-600 hover:text-red-600",
  },
  sectionHeader: "text-lg font-semibold text-gray-800 mb-4",
  pageHeader: "text-4xl font-bold text-gray-900 mb-2",
  listItem: "flex justify-between items-center",
  actionGroup: "flex gap-2",
  spacingY: "space-y-4",
  spacingY2: "space-y-2",
};
