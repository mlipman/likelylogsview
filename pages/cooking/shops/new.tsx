import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

interface Week {
  id: number;
  year: number;
  week: number;
}

export default function NewShop() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    week_id: "",
    planned_items_text: "",
    planning_notes: "",
  });
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch("/api/cooking/weeks");
        const data = await response.json();
        setWeeks(data);
        
        // Auto-select current week if available
        const currentWeek = getCurrentWeek();
        const matchingWeek = data.find((w: Week) => 
          w.year === currentWeek.year && w.week === currentWeek.week
        );
        
        if (matchingWeek) {
          setFormData(prev => ({
            ...prev,
            week_id: matchingWeek.id.toString(),
          }));
        } else if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            week_id: data[0].id.toString(),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch weeks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  const getCurrentWeek = (): {year: number; week: number} => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    let targetDate = new Date(now);
    if (dayOfWeek === 0) {
      targetDate.setDate(now.getDate() + 1);
    } else if (dayOfWeek === 6) {
      targetDate.setDate(now.getDate() + 2);
    }
    
    const getISOWeek = (date: Date) => {
      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return {year: tempDate.getFullYear(), week: weekNo};
    };
    
    return getISOWeek(targetDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        week_id: parseInt(formData.week_id),
        planned_items_text: formData.planned_items_text || null,
        planning_notes: formData.planning_notes || null,
      };

      const response = await fetch("/api/cooking/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking/shops");
      } else {
        console.error("Failed to create shop");
      }
    } catch (error) {
      console.error("Error creating shop:", error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan Shopping Trip</h1>
          <p className="text-gray-600">Create a new shopping list and plan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shopping Details</h2>

            <div className="space-y-4">
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
                      {week.year} - Week {week.week}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="planned_items_text"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Shopping List
                </label>
                <textarea
                  id="planned_items_text"
                  name="planned_items_text"
                  value={formData.planned_items_text}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List items you plan to buy..."
                />
              </div>

              <div>
                <label
                  htmlFor="planning_notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Planning Notes
                </label>
                <textarea
                  id="planning_notes"
                  name="planning_notes"
                  value={formData.planning_notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes about the shopping trip, stores to visit, budget considerations..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link
              href="/cooking/shops"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.week_id}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Shopping Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}