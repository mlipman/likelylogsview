import {useState, useEffect} from "react";
import Link from "next/link";

interface Week {
  id: number;
  created_at: string;
  updated_at: string;
  year: number;
  week: number;
  shops: any[];
  preps: any[];
  cooks: any[];
  starting_status: any | null;
}

export default function WeeksList() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch("/api/cooking/weeks");
        const data = await response.json();
        setWeeks(data);
      } catch (error) {
        console.error("Failed to fetch weeks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weeks...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Weeks</h1>
              <p className="text-gray-600">Manage cooking weeks (Saturday-Friday)</p>
            </div>
            <Link
              href="/cooking/weeks/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Week
            </Link>
          </div>
        </div>

        {weeks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No weeks found</p>
            <Link
              href="/cooking/weeks/new"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Your First Week
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
                      Activity Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeks.map((week) => (
                    <tr key={week.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {week.year} - Week {week.week}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {week.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex gap-4 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {week.shops.length} shops
                            </span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {week.preps.length} preps
                            </span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              {week.cooks.length} cooks
                            </span>
                            {week.starting_status && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                has status
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(week.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/cooking/weeks/${week.id}`}
                          className="text-purple-600 hover:text-purple-900 mr-4"
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