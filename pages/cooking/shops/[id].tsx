import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

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

export default function ShopDetail() {
  const router = useRouter();
  const {id} = router.query;
  const [shop, setShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    planned_items_text: "",
    planning_notes: "",
    occurred_at: "",
    purchased_items_text: "",
    store_name: "",
    total_cost: "",
    receipt_pic_id: "",
    shopping_notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchShop = async () => {
      try {
        const response = await fetch(`/api/cooking/shops`);
        const shops = await response.json();
        const foundShop = shops.find((s: Shop) => s.id === parseInt(id as string));
        
        if (foundShop) {
          setShop(foundShop);
          setFormData({
            planned_items_text: foundShop.planned_items_text || "",
            planning_notes: foundShop.planning_notes || "",
            occurred_at: foundShop.occurred_at ? foundShop.occurred_at.split('T')[0] : "",
            purchased_items_text: foundShop.purchased_items_text || "",
            store_name: foundShop.store_name || "",
            total_cost: foundShop.total_cost ? foundShop.total_cost.toString() : "",
            receipt_pic_id: foundShop.receipt_pic_id || "",
            shopping_notes: foundShop.shopping_notes || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [id]);

  useEffect(() => {
    if (router.query.edit) {
      setIsEditing(true);
    }
  }, [router.query.edit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        id: parseInt(id as string),
        planned_items_text: formData.planned_items_text || null,
        planning_notes: formData.planning_notes || null,
        occurred_at: formData.occurred_at || null,
        purchased_items_text: formData.purchased_items_text || null,
        store_name: formData.store_name || null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
        receipt_pic_id: formData.receipt_pic_id || null,
        shopping_notes: formData.shopping_notes || null,
      };

      const response = await fetch("/api/cooking/shops", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedShop = await response.json();
        setShop({...shop!, ...updatedShop});
        setIsEditing(false);
      } else {
        console.error("Failed to update shop");
      }
    } catch (error) {
      console.error("Error updating shop:", error);
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

  const handleCancel = () => {
    if (shop) {
      setFormData({
        planned_items_text: shop.planned_items_text || "",
        planning_notes: shop.planning_notes || "",
        occurred_at: shop.occurred_at ? shop.occurred_at.split('T')[0] : "",
        purchased_items_text: shop.purchased_items_text || "",
        store_name: shop.store_name || "",
        total_cost: shop.total_cost ? shop.total_cost.toString() : "",
        receipt_pic_id: shop.receipt_pic_id || "",
        shopping_notes: shop.shopping_notes || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Shop not found</p>
          <Link
            href="/cooking/shops"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEditing ? "Edit Shopping Trip" : "Shopping Trip"}
            </h1>
            <p className="text-gray-600">
              {shop.week.year} - Week {shop.week.week}
              {shop.store_name && ` • ${shop.store_name}`}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Shop
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shopping Details</h2>

              {/* Future: could split into plan/act editing phases */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="planned_items_text"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Shopping List (Planned Items)
                  </label>
                  <textarea
                    id="planned_items_text"
                    name="planned_items_text"
                    value={formData.planned_items_text}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List what you plan to buy..."
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
                    placeholder="Notes about the shopping plan, meal ideas driving the list, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="occurred_at"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Date Completed
                    </label>
                    <input
                      type="date"
                      id="occurred_at"
                      name="occurred_at"
                      value={formData.occurred_at}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="store_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Store Name
                    </label>
                    <input
                      type="text"
                      id="store_name"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Whole Foods, Safeway, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="total_cost"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Total Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="total_cost"
                      name="total_cost"
                      value={formData.total_cost}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="receipt_pic_id"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Receipt Photo ID
                    </label>
                    <input
                      type="text"
                      id="receipt_pic_id"
                      name="receipt_pic_id"
                      value={formData.receipt_pic_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cloudinary image ID"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="purchased_items_text"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Items Actually Purchased
                  </label>
                  <textarea
                    id="purchased_items_text"
                    name="purchased_items_text"
                    value={formData.purchased_items_text}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List what you actually bought..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="shopping_notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Shopping Notes
                  </label>
                  <textarea
                    id="shopping_notes"
                    name="shopping_notes"
                    value={formData.shopping_notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How did the shopping go? Any substitutions, notes about quality, things that were out of stock..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Week</h3>
                  <p className="text-gray-900">{shop.week.year} - Week {shop.week.week}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Store</h3>
                  <p className="text-gray-900">{shop.store_name || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date Completed</h3>
                  <p className="text-gray-900">
                    {shop.occurred_at 
                      ? new Date(shop.occurred_at).toLocaleDateString()
                      : "Not completed"
                    }
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Cost</h3>
                  <p className="text-gray-900">
                    {shop.total_cost ? `$${shop.total_cost}` : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <div className="flex gap-2">
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
                  {shop.receipt_pic_id && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Has receipt
                    </span>
                  )}
                </div>
              </div>

              {shop.planned_items_text && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Original Shopping List</h3>
                  <div className="bg-yellow-50 rounded p-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {shop.planned_items_text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {shop.planning_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Planning Notes</h3>
                  <div className="bg-gray-50 rounded p-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {shop.planning_notes}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {shop.purchased_items_text && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Items Actually Purchased</h3>
                  <div className="bg-green-50 rounded p-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {shop.purchased_items_text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {shop.shopping_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Shopping Notes</h3>
                  <div className="bg-blue-50 rounded p-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {shop.shopping_notes}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {shop.receipt_pic_id && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Receipt Photo ID</h3>
                  <p className="text-sm text-gray-700">{shop.receipt_pic_id}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Created:</span>{" "}
                  {new Date(shop.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Updated:</span>{" "}
                  {new Date(shop.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/cooking/shops" className="text-blue-600 hover:text-blue-800">
            ← Back to Shops
          </Link>
        </div>
      </div>
    </div>
  );
}