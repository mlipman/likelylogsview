import Link from "next/link";

interface StapleCategory {
  name: string;
  items: string[];
}

const staplesData: StapleCategory[] = [
  {
    name: "Grains & Starches",
    items: [
      "White rice",
      "Brown rice",
      "Quinoa",
      "Pasta (various shapes)",
      "All-purpose flour",
      "Bread flour",
      "Rolled oats",
      "Couscous",
      "Barley",
      "Breadcrumbs",
    ],
  },
  {
    name: "Oils & Vinegars",
    items: [
      "Olive oil",
      "Vegetable oil",
      "Coconut oil",
      "Sesame oil",
      "Balsamic vinegar",
      "White vinegar",
      "Apple cider vinegar",
      "Rice vinegar",
      "Red wine vinegar",
    ],
  },
  {
    name: "Condiments & Sauces",
    items: [
      "Soy sauce",
      "Fish sauce",
      "Worcestershire sauce",
      "Hot sauce",
      "Ketchup",
      "Mustard (Dijon, yellow)",
      "Mayonnaise",
      "Honey",
      "Maple syrup",
      "Peanut butter",
      "Tahini",
    ],
  },
  {
    name: "Canned & Jarred Goods",
    items: [
      "Diced tomatoes",
      "Tomato paste",
      "Coconut milk",
      "Black beans",
      "Chickpeas",
      "Lentils",
      "Tuna",
      "Chicken/vegetable broth",
      "Olives",
      "Capers",
      "Pickles",
    ],
  },
  {
    name: "Spices & Seasonings",
    items: [
      "Salt (kosher, sea)",
      "Black pepper",
      "Garlic powder",
      "Onion powder",
      "Paprika",
      "Cumin",
      "Oregano",
      "Basil",
      "Thyme",
      "Rosemary",
      "Bay leaves",
      "Cinnamon",
      "Nutmeg",
      "Chili powder",
      "Curry powder",
      "Red pepper flakes",
    ],
  },
  {
    name: "Baking Essentials",
    items: [
      "Sugar (white, brown)",
      "Baking soda",
      "Baking powder",
      "Vanilla extract",
      "Cocoa powder",
      "Chocolate chips",
      "Yeast",
      "Cornstarch",
    ],
  },
  {
    name: "Nuts & Seeds",
    items: [
      "Almonds",
      "Walnuts",
      "Cashews",
      "Pine nuts",
      "Sesame seeds",
      "Chia seeds",
      "Flax seeds",
      "Sunflower seeds",
    ],
  },
  {
    name: "Aromatics & Fresh Staples",
    items: ["Garlic", "Onions (yellow, red)", "Shallots", "Ginger", "Lemons", "Limes"],
  },
];

export default function Staples() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pantry Staples</h1>
          <p className="text-lg text-gray-600">
            List of long duration staples that I typically have
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staplesData.map(category => (
            <div key={category.name} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {category.name}
              </h2>
              <ul className="space-y-2">
                {category.items.map(item => (
                  <li key={item} className="text-gray-600 flex items-start">
                    <span className="mr-2 text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/cooking" className="text-blue-600 hover:text-blue-800">
            ← Back to Cooking Hub
          </Link>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
