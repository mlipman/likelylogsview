import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface Cook {
  id: number;
  created_at: string;
  updated_at: string;
  week_id: number;
  recipe_id: number | null;
  occurred_at: string | null;
  plan_md: string | null;
  outcome_md: string | null;
  result_pic_ids: string | null;
  week: {
    id: number;
    year: number;
    week: number;
  };
  recipe: {
    id: number;
    title: string;
    content_md: string | null;
    source: string | null;
    url: string | null;
  } | null;
}

export default function CookDetail() {
  const router = useRouter();
  const {id} = router.query;
  const [cook, setCook] = useState<Cook | null>(null);
  const [formData, setFormData] = useState({
    occurred_at: "",
    plan_md: "",
    outcome_md: "",
    result_pic_ids: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCook = async () => {
      try {
        const response = await fetch(`/api/cooking/cooks`);
        const cooks = await response.json();
        const foundCook = cooks.find((c: Cook) => c.id === parseInt(id as string));
        
        if (foundCook) {
          setCook(foundCook);
          setFormData({
            occurred_at: foundCook.occurred_at ? foundCook.occurred_at.split('T')[0] : "",
            plan_md: foundCook.plan_md || "",
            outcome_md: foundCook.outcome_md || "",
            result_pic_ids: foundCook.result_pic_ids || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch cook:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCook();
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
        occurred_at: formData.occurred_at || null,
        plan_md: formData.plan_md || null,
        outcome_md: formData.outcome_md || null,
        result_pic_ids: formData.result_pic_ids || null,
      };

      const response = await fetch("/api/cooking/cooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedCook = await response.json();
        setCook({...cook!, ...updatedCook});
        setIsEditing(false);
      } else {
        console.error("Failed to update cook");
      }
    } catch (error) {
      console.error("Error updating cook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleCancel = () => {
    if (cook) {
      setFormData({
        occurred_at: cook.occurred_at ? cook.occurred_at.split('T')[0] : "",
        plan_md: cook.plan_md || "",
        outcome_md: cook.outcome_md || "",
        result_pic_ids: cook.result_pic_ids || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cook...</p>
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cook not found</p>
          <Link
            href="/cooking/cooks"
            className="text-red-600 hover:text-red-800"
          >
            ← Back to Cooks
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
              {isEditing ? "Edit Cook" : "Cook Session"}
            </h1>
            <p className="text-gray-600">
              {cook.week.year} - Week {cook.week.week}
              {cook.recipe && ` • ${cook.recipe.title}`}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Edit Cook
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cook Details</h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="occurred_at"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date Completed
                  </label>
                  <input
                    type="date"
                    id="occurred_at"
                    name="occurred_at"
                    value={formData.occurred_at}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

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
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="outcome_md"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Outcome & Results
                  </label>
                  <textarea
                    id="outcome_md"
                    name="outcome_md"
                    value={formData.outcome_md}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="How did the cooking go? How did it taste? What worked well? What would you change next time? Serving notes..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="result_pic_ids"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Photo IDs
                  </label>
                  <input
                    type="text"
                    id="result_pic_ids"
                    name="result_pic_ids"
                    value={formData.result_pic_ids}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Comma-separated Cloudinary image IDs"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter comma-separated Cloudinary image IDs for photos of your dish
                  </p>
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Week</h3>
                  <p className="text-gray-900">{cook.week.year} - Week {cook.week.week}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Recipe</h3>
                  <p className="text-gray-900">{cook.recipe ? cook.recipe.title : "No recipe / Freestyle"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date Completed</h3>
                  <p className="text-gray-900">
                    {cook.occurred_at 
                      ? new Date(cook.occurred_at).toLocaleDateString()
                      : "Not completed"
                    }
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <div className="flex gap-2">
                    {cook.plan_md && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Planned
                      </span>
                    )}
                    {cook.outcome_md && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                    {cook.result_pic_ids && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Has photos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {cook.recipe && cook.recipe.content_md && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Original Recipe</h3>
                  <div className="bg-red-50 rounded p-4 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {cook.recipe.content_md}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {cook.plan_md && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Plan Details</h3>
                  <div className="bg-gray-50 rounded p-4 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {cook.plan_md}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {cook.outcome_md && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Outcome & Results</h3>
                  <div className="bg-green-50 rounded p-4 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {cook.outcome_md}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {cook.result_pic_ids && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Photo IDs</h3>
                  <p className="text-sm text-gray-700">{cook.result_pic_ids}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Created:</span>{" "}
                  {new Date(cook.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Updated:</span>{" "}
                  {new Date(cook.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/cooking/cooks" className="text-red-600 hover:text-red-800">
            ← Back to Cooks
          </Link>
        </div>
      </div>
    </div>
  );
}