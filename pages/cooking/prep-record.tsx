import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ImageUpload from "../../components/ImageUpload";

export default function PrepRecord() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    occurred_at: "",
    outcome_md: "",
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
      const response = await fetch("/api/cooking/preps", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: 1, // Mock prep ID - would come from route params in real app
          occurred_at: formData.occurred_at || new Date().toISOString(),
          outcome_md: formData.outcome_md,
          result_pic_ids: resultPicIds.join(","),
        }),
      });
      if (response.ok) {
        router.push("/cooking");
      } else {
        console.error("Failed to record prep session");
      }
    } catch (error) {
      console.error("Error recording prep session:", error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Record Prep Session</h1>
          <p className="text-gray-600">Document how your prep session went</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Prep Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="occurred_at" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Completed
                </label>
                <input
                  type="date"
                  id="occurred_at"
                  name="occurred_at"
                  value={formData.occurred_at}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label htmlFor="outcome_md" className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome & Results
                </label>
                <textarea
                  id="outcome_md"
                  name="outcome_md"
                  value={formData.outcome_md}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="What did you prep? How did it go?"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Photos</h2>
            <ImageUpload onUpload={handleImageUpload} multiple className="mb-4" />
            {resultPicIds.length > 0 && (
              <div className="text-sm text-green-600">
                {resultPicIds.length} photo{resultPicIds.length !== 1 ? "s" : ""} uploaded
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Link href="/cooking" className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Recording..." : "Record Prep Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
