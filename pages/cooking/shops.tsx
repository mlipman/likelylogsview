import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

interface Shop {
  id: number;
  created_at: string;
  updated_at: string;
  week_id: number;
  occurred_at: string | null;
  planned_items_text: string | null;
  planning_notes: string | null;
  purchased_items_text: string | null;
  store_name: string | null;
  total_cost: number | null;
  receipt_pic_id: string | null;
  shopping_notes: string | null;
  week: {
    id: number;
    year: number;
    week: number;
  };
}

export default function ShopsList() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch("/api/cooking/shops");
        const data = await response.json();
        setShops(data);
      } catch (error) {
        console.error("Failed to fetch shops:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shops...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Trips</h1>
              <p className="text-gray-600">Manage your grocery shopping activities</p>
            </div>
            <Link
              href="/cooking/shops/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Shop
            </Link>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No shopping trips found</p>
            <Link
              href="/cooking/shops/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Your First Shopping Trip
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store / Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/cooking/shops/${shop.id}`)}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {shop.week.year} - Week {shop.week.week}
                        </div>
                        <div className="text-sm text-gray-500">ID: {shop.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {shop.planned_items_text && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Planned
                            </span>
                          )}
                          {shop.purchased_items_text && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {shop.store_name || "-"}
                        </div>
                        {shop.total_cost && (
                          <div className="text-sm text-gray-500">
                            ${shop.total_cost.toString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shop.occurred_at
                          ? new Date(shop.occurred_at).toLocaleDateString()
                          : new Date(shop.created_at).toLocaleDateString()
                        }
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