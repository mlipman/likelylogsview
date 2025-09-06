import {useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import ImageUpload from "../../components/ImageUpload";

export default function ShopRecord() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    occurred_at: "",
    purchased_items_text: "",
    store_name: "",
    total_cost: "",
    shopping_notes: "",
  });
  const [receiptPicId, setReceiptPicId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (picId: string) => {
    setReceiptPicId(picId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/cooking/shops", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: 1, // Mock shop ID - would come from route params in real app
          occurred_at: formData.occurred_at || new Date().toISOString(),
          purchased_items_text: formData.purchased_items_text,
          store_name: formData.store_name || null,
          total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
          receipt_pic_id: receiptPicId,
          shopping_notes: formData.shopping_notes || null,
        }),
      });
      if (response.ok) {
        router.push("/cooking");
      } else {
        console.error("Failed to record shopping trip");
      }
    } catch (error) {
      console.error("Error recording shopping trip:", error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Record Shopping Trip</h1>
          <p className="text-gray-600">Log details about your grocery trip</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shopping Details</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-2">
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
              <div>
                <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label htmlFor="purchased_items_text" className="block text-sm font-medium text-gray-700 mb-2">
                  Items Purchased
                </label>
                <textarea
                  id="purchased_items_text"
                  name="purchased_items_text"
                  value={formData.purchased_items_text}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List what you bought..."
                />
              </div>
              <div>
                <label htmlFor="shopping_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Shopping Notes
                </label>
                <textarea
                  id="shopping_notes"
                  name="shopping_notes"
                  value={formData.shopping_notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes or observations?"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Receipt Photo</h2>
            <ImageUpload onUpload={handleImageUpload} className="mb-4" />
            {receiptPicId && (
              <div className="text-sm text-green-600">Photo uploaded</div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Link href="/cooking" className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Recording..." : "Record Shopping Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
