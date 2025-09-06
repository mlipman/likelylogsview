// import { useRouter } from "next/router";
import Link from "next/link";
import {useEffect, useState} from "react";
import {addDays, format, setISOWeek, startOfISOWeek} from "date-fns";

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
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weekLoading, setWeekLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch("/api/cooking/weeks");
        const data = await response.json();
        setWeeks(data);
      } catch (error) {
        console.error("Failed to fetch weeks:", error);
      } finally {
        setWeekLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  const currentWeek = weeks[currentWeekIndex];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sgt Chef</h1>
          <p className="text-lg text-gray-600">
            Your personal cooking assistant for planning and tracking meals
          </p>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {weekLoading ? (
            <p className="text-gray-600">Loading week...</p>
          ) : currentWeek ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Current Week</h2>
                <p className="text-gray-600">{formatWeekRange(currentWeek)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentWeekIndex(i => i + 1)}
                  disabled={currentWeekIndex >= weeks.length - 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentWeekIndex(i => i - 1)}
                  disabled={currentWeekIndex === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-2">No weeks found</p>
              <Link href="/cooking/weeks/new" className="text-purple-600 hover:text-purple-800">
                Add Week
              </Link>
            </div>
          )}
        </div>

        {currentWeek && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cooks This Week</h3>
              {currentWeek.cooks.length === 0 ? (
                <p className="text-gray-600">No cooks planned.</p>
              ) : (
                <ul className="space-y-4">
                  {currentWeek.cooks.map(cook => (
                    <li key={cook.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-800">
                          {cook.recipe ? cook.recipe.title : "No recipe / Freestyle"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/cooking/cooks/${cook.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        {!cook.outcome_md && (
                          <Link
                            href={`/cooking/cooks/${cook.id}?edit=1`}
                            className="text-green-600 hover:text-green-800"
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

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preps This Week</h3>
              {currentWeek.preps.length === 0 ? (
                <p className="text-gray-600">No preps planned.</p>
              ) : (
                <ul className="space-y-4">
                  {currentWeek.preps.map(prep => (
                    <li key={prep.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-800">
                          {prep.project ? prep.project.title : "Prep Session"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/cooking/preps/${prep.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        {!prep.outcome_md && (
                          <Link
                            href={`/cooking/preps/${prep.id}?edit=1`}
                            className="text-green-600 hover:text-green-800"
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

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Shops This Week</h3>
              {currentWeek.shops.length === 0 ? (
                <p className="text-gray-600">No shopping trips planned.</p>
              ) : (
                <ul className="space-y-4">
                  {currentWeek.shops.map(shop => (
                    <li key={shop.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-800">
                          {shop.store_name || "Shopping Trip"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/cooking/shops/${shop.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        {!shop.purchased_items_text && (
                          <Link
                            href={`/cooking/shops/${shop.id}?edit=1`}
                            className="text-green-600 hover:text-green-800"
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <Link href="/cooking/shops">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">Shop</h3>
                </Link>
                <p className="text-gray-600">Grocery shopping</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Link href="/cooking/shops/new" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
                  Plan Shopping List
                </button>
              </Link>
              <Link href="/cooking/shop-record" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🥘</span>
              </div>
              <div>
                <Link href="/cooking/preps">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-orange-600 cursor-pointer transition-colors">Prep</h3>
                </Link>
                <p className="text-gray-600">Meal preparation</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Link href="/cooking/preps/new" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors">
                  Plan Prep Project
                </button>
              </Link>
              <Link href="/cooking/prep-record" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                  Record Prep Session
                </button>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>
                This week: {currentWeek ? currentWeek.preps.length : 0} project
                {currentWeek && currentWeek.preps.length !== 1 ? "s" : ""} in
                progress
              </p>
            </div>
          </div>

          {/* Cook */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">👨‍🍳</span>
              </div>
              <div>
                <Link href="/cooking/cooks">
                  <h3 className="text-xl font-semibold text-gray-800 hover:text-red-600 cursor-pointer transition-colors">Cook</h3>
                </Link>
                <p className="text-gray-600">Making meals</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Link href="/cooking/add-cook" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                  Plan New Cook
                </button>
              </Link>
              <Link href="/cooking/cook-record" className="w-full block">
                <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={handleCookingSuggestion}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-2">🤖</span>
              {isLoading ? "Thinking..." : "What should I cook?"}
            </button>
            <Link
              href="/cooking/staples"
              className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              <span className="mr-2">📋</span>
              View Staples
            </Link>
            <Link
              href="/cooking/recipes"
              className="flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
            >
              <span className="mr-2">📖</span>
              Browse Recipes
            </Link>
            <Link
              href="/cooking/projects"
              className="flex items-center justify-center px-4 py-3 bg-teal-50 text-teal-700 rounded hover:bg-teal-100 transition-colors"
            >
              <span className="mr-2">🛠️</span>
              View Projects
            </Link>
            <Link
              href="/cooking/weeks"
              className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
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
        <div className="bg-white rounded-lg shadow-md p-6">
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
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
