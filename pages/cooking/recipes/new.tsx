import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

export default function NewRecipe() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    source: "",
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NYT Import state
  const [nytUrl, setNytUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        content_md: formData.content_md || null,
        source: formData.source || null,
        url: formData.url || null,
      };

      const response = await fetch("/api/cooking/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking/recipes");
      } else {
        console.error("Failed to create recipe");
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);

    try {
      const response = await fetch("/api/cooking/recipes/import", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url: nytUrl}),
      });

      if (response.ok) {
        const recipe = await response.json();
        router.push(`/cooking/recipes/${recipe.id}`);
      } else {
        const data = await response.json();
        setImportError(data.error || "Failed to import recipe");
      }
    } catch (error) {
      setImportError("Network error. Check that the dev server is running.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Recipe</h1>
          <p className="text-gray-600">Create a new recipe for your collection</p>
        </div>

        {/* NYT Cooking Import */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Import from NYT Cooking
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste a NYT Cooking recipe URL to automatically import it.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={nytUrl}
              onChange={e => setNytUrl(e.target.value)}
              placeholder="https://cooking.nytimes.com/recipes/..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !nytUrl}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isImporting ? "Importing..." : "Import"}
            </button>
          </div>
          {importError && (
            <p className="mt-3 text-sm text-red-600">{importError}</p>
          )}
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-sm text-gray-500">
              or add manually
            </span>
          </div>
        </div>

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
                  placeholder="Recipe title"
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
                    placeholder="e.g., NYT Cooking, cookbook name, etc."
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
                    placeholder="https://..."
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
                  placeholder="Write your recipe here in markdown format. Include ingredients, instructions, notes, etc."
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can use markdown formatting (## headings, **bold**, bullet points, etc.)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link
              href="/cooking/recipes"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
