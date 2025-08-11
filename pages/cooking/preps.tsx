import {useState, useEffect} from "react";
import Link from "next/link";

interface Prep {
  id: number;
  created_at: string;
  updated_at: string;
  week_id: number;
  project_id: number | null;
  occurred_at: string | null;
  plan_md: string | null;
  outcome_md: string | null;
  result_pic_ids: string | null;
  week: {
    id: number;
    year: number;
    week: number;
  };
  project: {
    id: number;
    title: string;
  } | null;
}

export default function PrepsList() {
  const [preps, setPreps] = useState<Prep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreps = async () => {
      try {
        const response = await fetch("/api/cooking/preps");
        const data = await response.json();
        setPreps(data);
      } catch (error) {
        console.error("Failed to fetch preps:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreps();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preps...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Prep Sessions</h1>
              <p className="text-gray-600">Manage your meal prep activities</p>
            </div>
            <Link
              href="/cooking/preps/new"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add Prep
            </Link>
          </div>
        </div>

        {preps.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No prep sessions found</p>
            <Link
              href="/cooking/preps/new"
              className="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add Your First Prep Session
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
                      Project
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
                  {preps.map((prep) => (
                    <tr key={prep.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {prep.week.year} - Week {prep.week.week}
                        </div>
                        <div className="text-sm text-gray-500">ID: {prep.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prep.project ? prep.project.title : "No project"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {prep.plan_md && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Planned
                            </span>
                          )}
                          {prep.outcome_md && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                          {prep.result_pic_ids && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Has photos
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prep.occurred_at 
                          ? new Date(prep.occurred_at).toLocaleDateString()
                          : new Date(prep.created_at).toLocaleDateString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/cooking/preps/${prep.id}`}
                          className="text-orange-600 hover:text-orange-900 mr-4"
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