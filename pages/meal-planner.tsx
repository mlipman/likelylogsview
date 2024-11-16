import {FC} from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

type Meal = {
  title: string;
  note: string;
};

type DayPlan = {
  dayName: string;
  lunch: Meal | null;
  dinner: Meal | null;
  stats: {
    calories: number;
    protein: number;
  } | null;
};

// Example data
const weekData: DayPlan[] = [
  {
    dayName: "Monday",
    lunch: {
      title: "Chicken Salad",
      note: "Prep 15min\nWith **avocado**",
    },
    dinner: null,
    stats: {
      calories: 1200,
      protein: 85,
    },
  },
  {
    dayName: "Tuesday",
    lunch: null,
    dinner: {
      title: "stuff",
      note: "asdfasdf asdf asdf",
    },
    stats: null,
  },
  {
    dayName: "Wednesday",
    lunch: null,
    dinner: null,
    stats: null,
  },
  {
    dayName: "Thursday",
    lunch: null,
    dinner: null,
    stats: null,
  },
  {
    dayName: "Friday",
    lunch: null,
    dinner: null,
    stats: null,
  },
  {
    dayName: "Saturday",
    lunch: null,
    dinner: null,
    stats: null,
  },
  {
    dayName: "Sunday",
    lunch: null,
    dinner: null,
    stats: null,
  },
];

const MealBox: FC<{meal: Meal | null}> = ({meal}) => {
  if (meal == null) {
    return (
      <div className="h-32 border rounded-lg p-3 bg-gray-50">
        <p className="text-gray-400">No meal recorded</p>
      </div>
    );
  }

  return (
    <div className="h-32 border rounded-lg p-3 bg-white">
      <h3 className="font-semibold text-lg mb-2">{meal.title}</h3>
      <ReactMarkdown
        className="text-sm text-gray-600"
        remarkPlugins={[remarkBreaks]}
      >
        {meal.note}
      </ReactMarkdown>
    </div>
  );
};
const DayColumn: FC<{dayPlan: DayPlan}> = ({dayPlan}) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-2">
        <div className="font-medium">{dayPlan.dayName}</div>{" "}
      </div>

      <div className="space-y-4">
        <MealBox meal={dayPlan.lunch} />
        <MealBox meal={dayPlan.dinner} />

        {dayPlan.stats && (
          <div className="h-10 border rounded-lg p-2 bg-white">
            <div className="flex justify-between text-sm">
              <span>{dayPlan.stats.calories} cals</span>
              <span>{dayPlan.stats.protein}g protein</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MealPlanner: React.FC = () => {
  const weekStartDate = new Date(2024, 8, 12); // September 12, 2024
  const weekLabel = `Week of ${weekStartDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{weekLabel}</h1>{" "}
      <div className="grid grid-cols-7 gap-4">
        {weekData.map((dayPlan, index) => (
          <DayColumn key={index} dayPlan={dayPlan} />
        ))}
      </div>
    </div>
  );
};

export default MealPlanner;
