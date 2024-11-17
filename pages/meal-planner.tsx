import {FC, useState} from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Image from "next/image";

type Meal = {
  contents: string;
  pic1Id?: string;
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
      // contents: `🥪 Grilled cheese sandwich w/ tomato & side of fries
      //         - Restaurant takeout portion
      //         - Est. 690 calories (range: 550-850)
      //         - Medium portion fries, white bread, likely buttered, melted white cheese`,
      contents: "Candy and cheese fries",
      pic1Id: "koahnvnx2x5xf6vzy4kk",
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
      contents: "asdfasdf asdf asdf",
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

// Add new Modal component
const MealModal: FC<{meal: Meal; onClose: () => void}> = ({meal, onClose}) => {
  const srcUrl = meal.pic1Id
    ? `https://res.cloudinary.com/dllptigzk/image/upload/v1731521561/logs/${meal.pic1Id}.jpg`
    : null;
  const blurUrl = meal.pic1Id
    ? `https://res.cloudinary.com/dllptigzk/image/upload/w_50,e_blur:100/v1731521561/logs/${meal.pic1Id}.jpg`
    : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg max-w-2xl w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ReactMarkdown
          className="text-gray-600 mb-4"
          remarkPlugins={[remarkBreaks]}
        >
          {meal.contents}
        </ReactMarkdown>
        {srcUrl && blurUrl && (
          <Image
            className="w-full rounded-lg"
            src={srcUrl}
            alt="Meal"
            width={500}
            height={500}
            placeholder="blur"
            blurDataURL={blurUrl}
          />
        )}
        <button
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Update MealBox component
const MealBox: FC<{meal: Meal | null}> = ({meal}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (meal == null) {
    return (
      <div className="h-32 border rounded-lg p-3 bg-gray-50">
        <p className="text-gray-400">No meal recorded</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="h-32 border rounded-lg p-3 bg-white cursor-pointer hover:bg-gray-50"
        onClick={() => setIsModalOpen(true)}
      >
        <ReactMarkdown
          className="text-sm text-gray-600"
          remarkPlugins={[remarkBreaks]}
        >
          {meal.contents}
        </ReactMarkdown>
      </div>
      {isModalOpen && (
        <MealModal meal={meal} onClose={() => setIsModalOpen(false)} />
      )}
    </>
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
