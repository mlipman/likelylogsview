import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {formatWeekRange} from "../../../utils/weekUtils";

interface Week {
  id: number;
  created_at: string;
  updated_at: string;
  year: number;
  week: number;
  carryover_items_md: string | null;
  missing_staples_md: string | null;
  plan_md: string | null;
  shops: any[];
  preps: any[];
  cooks: any[];
}

export default function WeekDetail() {
  const router = useRouter();
  const {id} = router.query;
  const [week, setWeek] = useState<Week | null>(null);
  const [formData, setFormData] = useState({
    year: "",
    week: "",
    carryover_items_md: "",
    missing_staples_md: "",
    plan_md: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchWeek = async () => {
      try {
        const response = await fetch(`/api/cooking/weeks`);
        const weeks = await response.json();
        const foundWeek = weeks.find((w: Week) => w.id === parseInt(id as string));
        
        if (foundWeek) {
          setWeek(foundWeek);
          setFormData({
            year: foundWeek.year.toString(),
            week: foundWeek.week.toString(),
            carryover_items_md: foundWeek.carryover_items_md || "",
            missing_staples_md: foundWeek.missing_staples_md || "",
            plan_md: foundWeek.plan_md || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch week:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeek();
  }, [id]);

  useEffect(() => {
    if (router.query.edit) {
      setIsEditing(true);
    }
  }, [router.query.edit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        id: parseInt(id as string),
        year: parseInt(formData.year),
        week: parseInt(formData.week),
        carryover_items_md: formData.carryover_items_md || null,
        missing_staples_md: formData.missing_staples_md || null,
        plan_md: formData.plan_md || null,
      };

      const response = await fetch("/api/cooking/weeks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedWeek = await response.json();
        setWeek({...week!, ...updatedWeek});
        setIsEditing(false);
      } else {
        console.error("Failed to update week");
      }
    } catch (error) {
      console.error("Error updating week:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleCancel = () => {
    if (week) {
      setFormData({
        year: week.year.toString(),
        week: week.week.toString(),
        carryover_items_md: week.carryover_items_md || "",
        missing_staples_md: week.missing_staples_md || "",
        plan_md: week.plan_md || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading week...</p>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Week not found</p>
          <Link
            href="/cooking/weeks"
            className="text-purple-600 hover:text-purple-800"
          >
            ← Back to Weeks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEditing ? "Edit Week" : `${week.year} - Week ${week.week}`}
            </h1>
            <p className="text-gray-600">
              {formatWeekRange(week.year, week.week)}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Edit Week
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Week Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Year</span>
                  <p className="text-gray-900">{week.year}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Week Number</span>
                  <p className="text-gray-900">{week.week}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Planning</h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="plan_md"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Week Plan
                  </label>
                  <textarea
                    id="plan_md"
                    name="plan_md"
                    value={formData.plan_md}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Strategic planning notes for the week..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Updated by chat conversations. Captures meal ideas, decisions, and strategy.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="carryover_items_md"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Carryover Ingredients
                  </label>
                  <textarea
                    id="carryover_items_md"
                    name="carryover_items_md"
                    value={formData.carryover_items_md}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Available ingredients and leftovers from previous weeks..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="missing_staples_md"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Missing Staples
                  </label>
                  <textarea
                    id="missing_staples_md"
                    name="missing_staples_md"
                    value={formData.missing_staples_md}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Staples that are low or out of stock..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !formData.year || !formData.week}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Week Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Year</h4>
                  <p className="text-gray-900">{week.year}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Week Number</h4>
                  <p className="text-gray-900">{week.week}</p>
                </div>
              </div>
            </div>

            {week.plan_md && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Week Plan</h3>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{week.plan_md}</ReactMarkdown>
                </div>
              </div>
            )}

            {(week.carryover_items_md || week.missing_staples_md) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingredient Status</h3>
                <div className="space-y-4">
                  {week.carryover_items_md && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Carryover Ingredients</h4>
                      <div className="text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{week.carryover_items_md}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {week.missing_staples_md && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Missing Staples</h4>
                      <div className="text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{week.missing_staples_md}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{week.shops.length}</div>
                  <div className="text-sm text-blue-800">Shopping trips</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{week.preps.length}</div>
                  <div className="text-sm text-orange-800">Prep sessions</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{week.cooks.length}</div>
                  <div className="text-sm text-red-800">Cooking sessions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Created:</span>{" "}
                  {new Date(week.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Updated:</span>{" "}
                  {new Date(week.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/cooking/weeks" className="text-purple-600 hover:text-purple-800">
            ← Back to Weeks
          </Link>
        </div>
      </div>
    </div>
  );
}