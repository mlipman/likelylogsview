// import { useRouter } from "next/router";
import Link from "next/link";
import {useState} from "react";

export default function CookingHome() {
  // const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState<string>("2024-01-13"); // Example date
  const [suggestion, setSuggestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCookingSuggestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cooking/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          week_id: 1, // Mock week ID for now
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

  const formatWeekRange = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString("en-US", {month: "short", day: "numeric"})} - ${end.toLocaleDateString("en-US", {month: "short", day: "numeric"})}`;
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Current Week</h2>
              <p className="text-gray-600">{formatWeekRange(currentWeek)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const prev = new Date(currentWeek);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeek(prev.toISOString().split("T")[0]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => {
                  const next = new Date(currentWeek);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeek(next.toISOString().split("T")[0]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

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
              <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
                Plan Shopping List
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                Record Shopping Trip
              </button>
            </div>
            <div className="text-sm text-gray-500">
              <p>This week: 2 trips planned</p>
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
              <button className="w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors">
                Plan Prep Project
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                Record Prep Session
              </button>
            </div>
            <div className="text-sm text-gray-500">
              <p>This week: 1 project in progress</p>
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
              <p>This week: 5 meals planned</p>
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
