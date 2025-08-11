import {useState, useEffect} from "react";
import Link from "next/link";

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
  } | null;
}

export default function CooksList() {
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCooks = async () => {
      try {
        const response = await fetch("/api/cooking/cooks");
        const data = await response.json();
        setCooks(data);
      } catch (error) {
        console.error("Failed to fetch cooks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCooks();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Cook Sessions</h1>
              <p className="text-gray-600">Manage your cooking activities</p>
            </div>
            <Link
              href="/cooking/cooks/new"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Add Cook
            </Link>
          </div>
        </div>

        {cooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No cooking sessions found</p>
            <Link
              href="/cooking/cooks/new"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Add Your First Cook Session
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cooks.map((cook) => (
                    <tr key={cook.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {cook.week.year} - Week {cook.week.week}
                        </div>
                        <div className="text-sm text-gray-500">ID: {cook.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cook.recipe ? cook.recipe.title : "No recipe / Freestyle"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cook.occurred_at 
                          ? new Date(cook.occurred_at).toLocaleDateString()
                          : new Date(cook.created_at).toLocaleDateString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/cooking/cooks/${cook.id}`}
                          className="text-red-600 hover:text-red-900 mr-4"
                        >
                          View/Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/cooking" className="text-blue-600 hover:text-blue-800">
            ← Back to Cooking
          </Link>
        </div>
      </div>
    </div>
  );
}