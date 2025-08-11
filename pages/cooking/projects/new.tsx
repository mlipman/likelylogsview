import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    source: "",
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const response = await fetch("/api/cooking/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking/projects");
      } else {
        console.error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Project</h1>
          <p className="text-gray-600">Create a new prep project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Details</h2>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Project title (e.g., Make Pizza Dough, Roast Vegetables)"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., cookbook, technique guide, etc."
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="content_md"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Content
                </label>
                <textarea
                  id="content_md"
                  name="content_md"
                  value={formData.content_md}
                  onChange={handleInputChange}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the prep project: ingredients needed, techniques, timing, storage instructions, etc."
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can use markdown formatting. This should describe how to prepare ingredients or components for later use.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link
              href="/cooking/projects"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}