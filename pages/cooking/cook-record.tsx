import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ImageUpload from "../../components/ImageUpload";

export default function CookRecord() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    actual_ingredients_used: "",
    cooking_notes: "",
    result_description: "",
    servings_made: "",
  });
  const [resultPicIds, setResultPicIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (picId: string) => {
    setResultPicIds(prev => [...prev, picId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cooking/cooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 1, // Mock cook ID - would come from route params in real app
          occurred_at: new Date().toISOString(),
          ...formData,
          servings_made: formData.servings_made ? parseInt(formData.servings_made) : null,
          result_pic_ids: resultPicIds.join(","),
        }),
      });

      if (response.ok) {
        router.push("/cooking");
      } else {
        console.error("Failed to record cooking session");
      }
    } catch (error) {
      console.error("Error recording cooking session:", error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Record Cooking Session
          </h1>
          <p className="text-gray-600">
            Document how your cooking went and what you made
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cooking Details</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="actual_ingredients_used"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ingredients Actually Used
                </label>
                <textarea
                  id="actual_ingredients_used"
                  name="actual_ingredients_used"
                  value={formData.actual_ingredients_used}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List what ingredients you actually used..."
                />
              </div>

              <div>
                <label
                  htmlFor="cooking_notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cooking Process & Notes
                </label>
                <textarea
                  id="cooking_notes"
                  name="cooking_notes"
                  value={formData.cooking_notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How did the cooking go? Any adjustments, timing notes, techniques used..."
                />
              </div>

              <div>
                <label
                  htmlFor="servings_made"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Servings Made
                </label>
                <input
                  type="number"
                  id="servings_made"
                  name="servings_made"
                  value={formData.servings_made}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of servings"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Results & Feedback
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="result_description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  How Did It Turn Out?
                </label>
                <textarea
                  id="result_description"
                  name="result_description"
                  value={formData.result_description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the final result - taste, texture, appearance, what you liked/didn't like..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos of Your Creation
                </label>
                <ImageUpload
                  onUpload={handleImageUpload}
                  multiple={true}
                  className="mb-4"
                />
                {resultPicIds.length > 0 && (
                  <div className="text-sm text-green-600">
                    {resultPicIds.length} photo{resultPicIds.length !== 1 ? "s" : ""}{" "}
                    uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link href="/cooking" className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Recording..." : "Record Cooking Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
