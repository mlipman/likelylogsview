import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

export default function NewWeek() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    week: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        year: parseInt(formData.year),
        week: parseInt(formData.week),
      };

      const response = await fetch("/api/cooking/weeks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking/weeks");
      } else {
        console.error("Failed to create week");
      }
    } catch (error) {
      console.error("Error creating week:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Week</h1>
          <p className="text-gray-600">Create a new cooking week (Saturday-Friday)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Week Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="2020"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="2024"
                />
              </div>

              <div>
                <label
                  htmlFor="week"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Week Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="week"
                  name="week"
                  value={formData.week}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="53"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="32"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ISO week number (1-53). Week starts on Monday for calculation purposes.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Note about weeks:</h3>
              <p className="text-sm text-blue-700">
                Our cooking weeks run Saturday-Friday. The week number should correspond to the ISO week 
                that contains the Monday of your cooking week. For example, if your cooking week runs 
                Saturday Aug 10 - Friday Aug 16, 2025, you would use the ISO week number for Monday Aug 12, 2025.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link
              href="/cooking/weeks"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.year || !formData.week}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Week"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}