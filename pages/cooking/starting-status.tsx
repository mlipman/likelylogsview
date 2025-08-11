import {useState, useEffect} from "react";
import Link from "next/link";

interface StartingStatus {
  id: number;
  created_at: string;
  updated_at: string;
  week_id: number;
  carryover_items_md: string | null;
  missing_staples_md: string | null;
  notes_md: string | null;
  week: {
    id: number;
    year: number;
    week: number;
  };
}

export default function StartingStatusList() {
  const [statuses, setStatuses] = useState<StartingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch("/api/cooking/starting-status");
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error("Failed to fetch starting statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading starting statuses...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Starting Status</h1>
              <p className="text-gray-600">Weekly ingredient and staple status</p>
            </div>
            <Link
              href="/cooking/starting-status/new"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Status
            </Link>
          </div>
        </div>

        {statuses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No starting statuses found</p>
            <Link
              href="/cooking/starting-status/new"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Your First Status
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
                      Content Summary
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
                  {statuses.map((status) => (
                    <tr key={status.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {status.week.year} - Week {status.week.week}
                        </div>
                        <div className="text-sm text-gray-500">ID: {status.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {status.carryover_items_md && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Has carryover
                            </span>
                          )}
                          {status.missing_staples_md && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Missing staples
                            </span>
                          )}
                          {status.notes_md && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Has notes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(status.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/cooking/starting-status/${status.id}`}
                          className="text-green-600 hover:text-green-900 mr-4"
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