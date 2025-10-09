// import { useRouter } from "next/router";
import Link from "next/link";
import {useEffect, useState} from "react";
import {addDays, format, setISOWeek, startOfISOWeek} from "date-fns";
import {getCurrentWeek} from "../../utils/weekUtils";

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
  cooks: Cook[];
  preps: Prep[];
  shops: Shop[];
}

export default function CookingHome() {
  // const router = useRouter();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number | null>(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentWeekData, setCurrentWeekData] = useState<{
    year: number;
    week: number;
  } | null>(null);
  const [isCreatingWeek, setIsCreatingWeek] = useState(false);

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

  const handleCookingSuggestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cooking/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          week_id: currentWeek ? currentWeek.id : 1,
          user_query: "What should I cook?",
        }),
      });

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error("Failed to get cooking suggestion:", error);
      setSuggestion(
        "Sorry, I couldn't get suggestions right now. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeekRange = (week: Week) => {
    const date = setISOWeek(new Date(week.year, 0, 4), week.week);
    const start = addDays(startOfISOWeek(date), -2);
    const end = addDays(start, 6);
    return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
  };

  if (weekLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
        <div className="mb-8">
          <h1 className={styles.pageHeader}>Sgt Chef</h1>
          <p className="text-lg text-gray-600">
            Your personal cooking assistant for planning and tracking meals
          </p>
        </div>

        {/* Week Selector */}
        <div className={styles.cardMb}>
          {currentWeekData ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Current Week</h2>
                {currentWeek ? (
                  <p className="text-gray-600">{formatWeekRange(currentWeek)}</p>
                ) : (
                  <p className="text-gray-600">
                    Week {currentWeekData.week}, {currentWeekData.year}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {currentWeek ? (
                  <>
                    <button
                      onClick={() => setCurrentWeekIndex(i => i + 1)}
                      disabled={currentWeekIndex >= weeks.length - 1}
                      className={`${styles.button.base} ${styles.button.secondary} ${styles.button.disabled}`}
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setCurrentWeekIndex(i => i - 1)}
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
                  className={`${styles.actionButton.base} ${styles.actionButton.blue}`}
                >
                  Plan Shopping List
                </button>
              </Link>
              <Link href="/cooking/shop-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  Record Shopping Trip
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
                <span className="text-2xl">🥘</span>
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
                  className={`${styles.actionButton.base} ${styles.actionButton.orange}`}
                >
                  Plan Prep Project
                </button>
              </Link>
              <Link href="/cooking/prep-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  Record Prep Session
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
                  className={`${styles.actionButton.base} ${styles.actionButton.red}`}
                >
                  Plan New Cook
                </button>
              </Link>
              <Link href="/cooking/cook-record" className="w-full block">
                <button
                  className={`${styles.actionButton.base} ${styles.actionButton.green}`}
                >
                  Record Cooking
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

        {/* Quick Actions */}
        <div className={styles.cardMb}>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={handleCookingSuggestion}
              disabled={isLoading}
              className={`${styles.quickActionButton} ${styles.actionButton.purple} ${styles.button.disabled}`}
            >
              <span className="mr-2">🤖</span>
              {isLoading ? "Thinking..." : "What should I cook?"}
            </button>
            <Link
              href="/cooking/staples"
              className={`${styles.quickActionButton} ${styles.actionButton.gray}`}
            >
              <span className="mr-2">📋</span>
              View Staples
            </Link>
            <Link
              href="/cooking/recipes"
              className={`${styles.quickActionButton} ${styles.actionButton.indigo}`}
            >
              <span className="mr-2">📖</span>
              Browse Recipes
            </Link>
            <Link
              href="/cooking/projects"
              className={`${styles.quickActionButton} ${styles.actionButton.teal}`}
            >
              <span className="mr-2">🛠️</span>
              View Projects
            </Link>
            <Link
              href="/cooking/weeks"
              className={`${styles.quickActionButton} ${styles.actionButton.purple}`}
            >
              <span className="mr-2">📅</span>
              Manage Weeks
            </Link>
          </div>
        </div>

        {/* AI Suggestions */}
        {suggestion && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-purple-800 mb-4">
              🤖 Cooking Suggestions
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">{suggestion}</div>
          </div>
        )}

        {/* Week Summary */}
        <div className={styles.card}>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Week Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Starting Status</h4>
              <p className="text-sm text-gray-600">
                Missing: olive oil, garlic
                <br />
                Carryover: leftover pasta, roasted vegetables
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Shopped at Whole Foods (Mon)</p>
                <p>• Made pizza dough (Tue)</p>
                <p>• Cooked pasta primavera (Wed)</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Upcoming Plans</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Use pizza dough (Fri)</p>
                <p>• Shop for weekend (Sat)</p>
                <p>• Meal prep for next week (Sun)</p>
              </div>
            </div>
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
