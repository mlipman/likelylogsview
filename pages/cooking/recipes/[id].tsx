import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface Recipe {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  content_md: string | null;
  source: string | null;
  url: string | null;
}

export default function RecipeDetail() {
  const router = useRouter();
  const {id} = router.query;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    source: "",
    url: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/cooking/recipes`);
        const recipes = await response.json();
        const foundRecipe = recipes.find((r: Recipe) => r.id === parseInt(id as string));
        
        if (foundRecipe) {
          setRecipe(foundRecipe);
          setFormData({
            title: foundRecipe.title,
            content_md: foundRecipe.content_md || "",
            source: foundRecipe.source || "",
            url: foundRecipe.url || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
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
        title: formData.title,
        content_md: formData.content_md || null,
        source: formData.source || null,
        url: formData.url || null,
      };

      // Note: The recipes API doesn't have PUT implemented yet, so we'll need to add that
      const response = await fetch("/api/cooking/recipes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        setRecipe(updatedRecipe);
        setIsEditing(false);
      } else {
        console.error("Failed to update recipe");
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
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
    if (recipe) {
      setFormData({
        title: recipe.title,
        content_md: recipe.content_md || "",
        source: recipe.source || "",
        url: recipe.url || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Recipe not found</p>
          <Link
            href="/cooking/recipes"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Recipes
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
              {isEditing ? "Edit Recipe" : recipe.title}
            </h1>
            <p className="text-gray-600">
              {isEditing ? "Update recipe details" : "Recipe details"}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Recipe
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipe Details</h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="source"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Source
                    </label>
                    <input
                      type="text"
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="url"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="content_md"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Recipe Content
                  </label>
                  <textarea
                    id="content_md"
                    name="content_md"
                    value={formData.content_md}
                    onChange={handleInputChange}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={isSubmitting || !formData.title}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Source</h3>
                  <p className="text-gray-900">{recipe.source || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">URL</h3>
                  {recipe.url ? (
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {recipe.url}
                    </a>
                  ) : (
                    <p className="text-gray-900">Not specified</p>
                  )}
                </div>
              </div>

              {recipe.content_md && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Content</h3>
                  <div className="bg-gray-50 rounded p-4 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {recipe.content_md}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Created:</span>{" "}
                  {new Date(recipe.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Updated:</span>{" "}
                  {new Date(recipe.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/cooking/recipes" className="text-blue-600 hover:text-blue-800">
            ← Back to Recipes
          </Link>
        </div>
      </div>
    </div>
  );
}