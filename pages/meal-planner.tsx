import {FC, useState, useEffect} from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Image from "next/image";
import {PencilIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {log} from "@prisma/client";
import {getCloudinaryUrls} from "../utils/imageUtils";

type DayPlan = {
  dayName: string;
  offset: number;
  stats: {
    calories: number;
    protein: number;
  } | null;
};

// Example data
const weekData: DayPlan[] = [
  {
    dayName: "Monday",
    offset: 0,
    stats: {
      calories: 1200,
      protein: 85,
    },
  },
  {
    dayName: "Tuesday",
    offset: 2,
    stats: null,
  },
  {
    dayName: "Wednesday",
    offset: 4,
    stats: null,
  },
  {
    dayName: "Thursday",
    offset: 6,
    stats: null,
  },
  {
    dayName: "Friday",
    offset: 8,
    stats: null,
  },
  {
    dayName: "Saturday",
    offset: 10,
    stats: null,
  },
  {
    dayName: "Sunday",
    offset: 12,
    stats: null,
  },
];

const MealModal: FC<{
  meal: log | null;
  position: number;
  existingLogs: log[];
  onClose: () => void;
  mealUpdated: (meal: log | null) => void;
}> = ({meal, position, onClose, existingLogs, mealUpdated}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContents, setEditedContents] = useState(
    meal?.contents || "No meal recorded" // maybe use null here
  );

  const imageUrls = meal?.pic_id1 ? getCloudinaryUrls(meal.pic_id1) : null;

  const updateLog = async () => {
    const response = await fetch("/api/logs", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({contents: editedContents, position}),
    });
    const updatedLog = await response.json();
    // maybe do optimistic update here
    mealUpdated(updatedLog);
    setIsEditing(false);
  };

  const clearLog = async () => {
    await fetch("/api/log-position-clear", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({position}),
    });
    mealUpdated(null);
    setIsEditing(false);
  };

  const onLogChosen = async (logId: number, position: number) => {
    // the backend call also clears out the connection between another position
    // and this log, but that position won't get updated on the frontend until a refresh
    // ok with this being a known issue and not fixing right now
    const response = await fetch("api/log-positions", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({logId, position}),
    });
    const updatedLog = await response.json();
    mealUpdated(updatedLog);
    setEditedContents(updatedLog.contents);
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg max-w-2xl w-full m-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
        >
          {!isEditing ? (
            <PencilIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {isEditing ? (
          <>
            <textarea
              className="w-full p-2 border rounded-lg mb-4"
              value={editedContents}
              onChange={(e) => setEditedContents(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={updateLog}
              >
                Update
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
            {imageUrls && (
              <Image
                className="rounded-lg mt-4"
                src={imageUrls.srcUrl}
                alt="Meal"
                width={500}
                height={500}
                placeholder="blur"
                blurDataURL={imageUrls.blurUrl}
              />
            )}
            <button
              className="px-4 py-2 mt-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
              onClick={clearLog}
            >
              Clear
            </button>
            <p className="text-sm text-gray-500 mt-1">
              {`postion ${position}`}
            </p>
          </>
        ) : (
          // not editing
          <>
            {meal ? (
              <>
                <ReactMarkdown
                  className="text-gray-600 mb-4"
                  remarkPlugins={[remarkBreaks]}
                >
                  {editedContents}
                </ReactMarkdown>
                {imageUrls && (
                  <Image
                    className="rounded-lg"
                    src={imageUrls.srcUrl}
                    alt="Meal"
                    width={500}
                    height={500}
                    placeholder="blur"
                    blurDataURL={imageUrls.blurUrl}
                  />
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {`position ${position}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500">No log chosen</p>
                <div className="grid gap-4 overflow-y-auto max-h-[700px]">
                  {existingLogs.map((log) => {
                    const imageUrls = log.pic_id1
                      ? getCloudinaryUrls(log.pic_id1)
                      : null;
                    return (
                      <div
                        key={log.id}
                        className="border p-4 rounded-lg shadow cursor-pointer"
                        onClick={() => onLogChosen(log.id, position)} // Click handler
                      >
                        <p className="text-sm text-gray-500 mb-2">
                          ID: {log.id}
                        </p>
                        <p className="font-semibold">Message: {log.contents}</p>
                        {imageUrls && (
                          <Image
                            className="rounded-lg w-[100px] h-[100px]"
                            src={imageUrls.srcUrl}
                            alt="Meal"
                            width={500}
                            height={500}
                            placeholder="blur"
                            blurDataURL={imageUrls.blurUrl}
                          />
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          Created:{" "}
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              onClick={onClose}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/*
early plan:
1. create log with picture from camera or album.
2. create a bunch of logs. DONE
3. view logs when clicking an empty postions DONE
4. select log to associate log with position. (each position will have up to one log) DONE
5. when viewing positions, each log will show up. DONE

when log is created, we enrich it


chat on page that pulls in summary of logs being viewed
*/

const MealBox: FC<{
  position: number;
  existingLogs: log[];
}> = ({position, existingLogs}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meal, setMeal] = useState(findLogForPosition(position, existingLogs));
  const imageUrls = meal?.pic_id1 ? getCloudinaryUrls(meal.pic_id1) : null;

  return (
    <>
      <div
        className={`h-[260px] border rounded-lg p-3 ${
          meal == null ? "bg-gray-50" : "bg-white"
        } cursor-pointer hover:bg-gray-50 overflow-auto`}
        onClick={() => setIsModalOpen(true)}
      >
        <ReactMarkdown
          className="text-sm text-gray-600"
          remarkPlugins={[remarkBreaks]}
        >
          {meal ? meal.contents : "No meal recorded"}
        </ReactMarkdown>
        {imageUrls && (
          <Image
            className="w-full rounded-lg"
            src={imageUrls.srcUrl}
            alt="Meal"
            width={50}
            height={50}
            placeholder="blur"
            blurDataURL={imageUrls.blurUrl}
          />
        )}
      </div>
      {isModalOpen && (
        <MealModal
          meal={meal}
          position={position}
          existingLogs={existingLogs}
          onClose={() => setIsModalOpen(false)}
          mealUpdated={setMeal}
        />
      )}
    </>
  );
};

const DayColumn: FC<{dayPlan: DayPlan; existingLogs: log[]}> = ({
  dayPlan,
  existingLogs,
}) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-2">
        <div className="font-medium">{dayPlan.dayName}</div>{" "}
      </div>

      <div className="space-y-4">
        <MealBox position={dayPlan.offset} existingLogs={existingLogs} />
        <MealBox position={dayPlan.offset + 1} existingLogs={existingLogs} />

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

const findLogForPosition = (position: number, logs: log[]): log | null => {
  const foundLog = logs.find((log) => log.position === position);
  return foundLog || null;
};

const MealPlanner: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [existingLogs, setExistingLogs] = useState<log[]>([]);
  const weekStartDate = new Date(2024, 8, 12); // September 12, 2024
  const weekLabel = `Week of ${weekStartDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      const data = await response.json();
      setExistingLogs(data);
      setLoading(false);
    } catch (error) {
      // no good error reporting here
      setExistingLogs([]);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{weekLabel}</h1>
      {loading ? (
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {weekData.map((dayPlan, index) => (
            <DayColumn
              key={index}
              dayPlan={dayPlan}
              existingLogs={existingLogs}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
