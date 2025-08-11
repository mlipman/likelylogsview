import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

interface Recipe {
  id: number;
  title: string;
  content_md: string | null;
  source: string | null;
  url: string | null;
}

interface Week {
  id: number;
  year: number;
  week: number;
}

// Helper function to get current week number (Saturday-Friday weeks)
const getCurrentWeek = (): {year: number; week: number} => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // If it's Saturday (6) or Sunday (0), we want the week of the upcoming Monday
  let targetDate = new Date(now);
  if (dayOfWeek === 0) { // Sunday
    targetDate.setDate(now.getDate() + 1); // Move to Monday
  } else if (dayOfWeek === 6) { // Saturday
    targetDate.setDate(now.getDate() + 2); // Move to Monday
  }
  // For Monday-Friday (1-5), use the current date
  
  // Calculate ISO week number for the target date
  const getISOWeek = (date: Date) => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    // Get first day of year
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return {year: tempDate.getFullYear(), week: weekNo};
  };
  
  return getISOWeek(targetDate);
};

export default function AddCook() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    week_id: "",
    recipe_id: "",
    plan_md: "",
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesResponse, weeksResponse] = await Promise.all([
          fetch("/api/cooking/recipes"),
          fetch("/api/cooking/weeks"),
        ]);

        const recipesData = await recipesResponse.json();
        const weeksData = await weeksResponse.json();

        setRecipes(recipesData);
        setWeeks(weeksData);

        // Auto-select the current week if available
        const currentWeek = getCurrentWeek();
        const matchingWeek = weeksData.find((w: Week) => 
          w.year === currentWeek.year && w.week === currentWeek.week
        );
        
        if (matchingWeek) {
          setFormData(prev => ({
            ...prev,
            week_id: matchingWeek.id.toString(),
          }));
        } else if (weeksData.length > 0) {
          // Fallback to most recent week if current week not found
          setFormData(prev => ({
            ...prev,
            week_id: weeksData[0].id.toString(),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        week_id: parseInt(formData.week_id),
        recipe_id: formData.recipe_id ? parseInt(formData.recipe_id) : null,
        plan_md: formData.plan_md,
      };

      const response = await fetch("/api/cooking/cooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking");
      } else {
        console.error("Failed to create cook");
      }
    } catch (error) {
      console.error("Error creating cook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const formatWeekDisplay = (week: Week) => {
    return `${week.year} - Week ${week.week}`;
  };

  const selectedRecipe = recipes.find(r => r.id.toString() === formData.recipe_id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan New Cook</h1>
          <p className="text-gray-600">
            Create a new cooking plan for the week
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="week_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Week <span className="text-red-500">*</span>
                </label>
                <select
                  id="week_id"
                  name="week_id"
                  value={formData.week_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a week</option>
                  {weeks.map(week => (
                    <option key={week.id} value={week.id}>
                      {formatWeekDisplay(week)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="recipe_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Recipe (Optional)
                </label>
                <select
                  id="recipe_id"
                  name="recipe_id"
                  value={formData.recipe_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No recipe / Freestyle cooking</option>
                  {recipes.map(recipe => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedRecipe && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Selected Recipe: {selectedRecipe.title}
              </h3>
              {selectedRecipe.source && (
                <p className="text-sm text-blue-700 mb-2">
                  Source: {selectedRecipe.source}
                </p>
              )}
              {selectedRecipe.url && (
                <a
                  href={selectedRecipe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline mb-2 block"
                >
                  View Original Recipe
                </a>
              )}
              {selectedRecipe.content_md && (
                <div className="bg-white rounded p-3 mt-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {selectedRecipe.content_md}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Cooking Plan & Notes
            </h2>

            <div>
              <label
                htmlFor="plan_md"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Plan Details
              </label>
              <textarea
                id="plan_md"
                name="plan_md"
                value={formData.plan_md}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  selectedRecipe
                    ? "Any modifications to the recipe, shopping list, prep notes, timing considerations..."
                    : "Describe what you plan to cook, ingredients needed, techniques to use, timing considerations..."
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                You can use markdown formatting here. This will help you plan your cooking approach.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link href="/cooking" className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.week_id}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Cook Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}