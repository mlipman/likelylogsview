import {FC, useState, useEffect, useCallback} from "react";
import {useRouter} from "next/router";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Link from "next/link";
import {
  buildCalendarGrid,
  calendarInstanceKeys,
  dateToInstanceNum,
} from "@/utils/dates";
import type {CalendarDay, CalendarWeekRow} from "@/utils/dates";

// --- Types ---

interface ModalTarget {
  period: "month" | "week" | "day";
  instanceNum: string;
  instance: string;
  label: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// --- SessionModal ---

const SessionModal: FC<{
  target: ModalTarget;
  onClose: () => void;
}> = ({target, onClose}) => {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/session?instance=${target.instance}`);
        if (!response.ok) {
          setError(true);
          return;
        }
        const data = await response.json();
        const parsed: Message[] = JSON.parse(data.message_list_json);
        setMessages(parsed);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [target.instance]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{target.label}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {error && <p className="text-gray-500 text-sm">Could not load session.</p>}
          {!loading && !error && messages && messages.length === 0 && (
            <p className="text-gray-400 text-sm">No messages in this session.</p>
          )}
          {!loading &&
            !error &&
            messages &&
            messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "p-3 rounded-lg bg-blue-50 ml-8 border border-blue-100"
                    : msg.role === "assistant"
                      ? "p-3 rounded-lg bg-gray-50 mr-8 border border-gray-200"
                      : "p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs"
                }
              >
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{msg.content}</ReactMarkdown>
              </div>
            ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <Link
            href={`/session/${target.period}/${target.instanceNum}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Open Full Session
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- CalendarHeader ---

const CalendarHeader: FC<{
  year: number;
  month: number;
  monthInstance: string;
  hasMonthSession: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (target: ModalTarget) => void;
}> = ({year, month, monthInstance, hasMonthSession, onPrev, onNext, onDotClick}) => {
  const label = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const instanceNum = dateToInstanceNum(new Date(year, month - 1), "month");

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg"
      >
        &larr;
      </button>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">{label}</h1>
        {hasMonthSession && (
          <button
            onClick={() =>
              onDotClick({
                period: "month",
                instanceNum,
                instance: monthInstance,
                label,
              })
            }
            className="w-2.5 h-2.5 rounded-full bg-blue-500 hover:bg-blue-600 cursor-pointer flex-shrink-0"
            title="Monthly session"
          />
        )}
      </div>
      <button
        onClick={onNext}
        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg"
      >
        &rarr;
      </button>
    </div>
  );
};

// --- WeekdayHeaders ---

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WeekdayHeaders: FC = () => (
  <div className="grid grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[48px_repeat(7,1fr)] gap-px mb-px">
    <div className="text-xs text-gray-400 text-center py-1 font-medium">Wk</div>
    {WEEKDAY_LABELS.map(d => (
      <div key={d} className="text-xs text-gray-500 text-center py-1 font-medium">
        {d}
      </div>
    ))}
  </div>
);

// --- DayCell ---

const DayCell: FC<{
  day: CalendarDay;
  hasSession: boolean;
  onDotClick: (target: ModalTarget) => void;
}> = ({day, hasSession, onDotClick}) => {
  const handleClick = () => {
    if (!hasSession || !day.isCurrentMonth) return;
    const label = day.date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    onDotClick({
      period: "day",
      instanceNum: day.dayInstanceNum,
      instance: `day${day.dayInstanceNum}`,
      label,
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex flex-col items-center justify-center py-1.5 sm:py-2 rounded
        ${day.isCurrentMonth ? "text-gray-800" : "text-gray-300"}
        ${day.isToday ? "bg-blue-50 ring-1 ring-blue-400" : ""}
        ${hasSession && day.isCurrentMonth ? "cursor-pointer hover:bg-gray-100" : ""}
      `}
    >
      <span className="text-sm sm:text-base leading-none">{day.dayOfMonth}</span>
      {hasSession && day.isCurrentMonth ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
      ) : (
        <span className="w-1.5 h-1.5 mt-1" />
      )}
    </div>
  );
};

// --- WeekCell ---

const WeekCell: FC<{
  row: CalendarWeekRow;
  hasSession: boolean;
  onDotClick: (target: ModalTarget) => void;
}> = ({row, hasSession, onDotClick}) => {
  const handleClick = () => {
    if (!hasSession) return;
    onDotClick({
      period: "week",
      instanceNum: row.weekInstanceNum,
      instance: `week${row.weekInstanceNum}`,
      label: `Week ${row.isoWeek}, ${row.isoWeekYear}`,
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex flex-col items-center justify-center rounded
        ${hasSession ? "cursor-pointer hover:bg-gray-100" : ""}
      `}
    >
      <span className="text-xs text-gray-400 leading-none">W{row.isoWeek}</span>
      {hasSession ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
      ) : (
        <span className="w-1.5 h-1.5 mt-0.5" />
      )}
    </div>
  );
};

// --- CalendarGrid ---

const CalendarGrid: FC<{
  grid: CalendarWeekRow[];
  existingSessions: Set<string>;
  onDotClick: (target: ModalTarget) => void;
}> = ({grid, existingSessions, onDotClick}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-2 pt-2">
      <WeekdayHeaders />
    </div>
    <div className="divide-y divide-gray-100">
      {grid.map(row => (
        <div
          key={row.weekInstanceNum}
          className="grid grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[48px_repeat(7,1fr)] gap-px px-2 py-0.5"
        >
          <WeekCell
            row={row}
            hasSession={existingSessions.has(`week${row.weekInstanceNum}`)}
            onDotClick={onDotClick}
          />
          {row.days.map(day => (
            <DayCell
              key={day.dayInstanceNum}
              day={day}
              hasSession={existingSessions.has(`day${day.dayInstanceNum}`)}
              onDotClick={onDotClick}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// --- CalendarPage ---

const CalendarPage: FC = () => {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [existingSessions, setExistingSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const grid = buildCalendarGrid(year, month);
  const monthInstance = `month${String(year).padStart(4, "0")}${String(month).padStart(2, "0")}`;

  const fetchSessions = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const keys = calendarInstanceKeys(y, m);
      const response = await fetch(`/api/sessions-index?instances=${keys.join(",")}`);
      if (response.ok) {
        const data = await response.json();
        setExistingSessions(new Set(data.existingInstances));
      }
    } catch {
      setExistingSessions(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(year, month);
  }, [year, month, fetchSessions]);

  const handlePrev = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleDotClick = (target: ModalTarget) => {
    setModalTarget(target);
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:max-w-xl">
      <div className="mb-4">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Home
        </button>
      </div>

      <CalendarHeader
        year={year}
        month={month}
        monthInstance={monthInstance}
        hasMonthSession={existingSessions.has(monthInstance)}
        onPrev={handlePrev}
        onNext={handleNext}
        onDotClick={handleDotClick}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <CalendarGrid
          grid={grid}
          existingSessions={existingSessions}
          onDotClick={handleDotClick}
        />
      )}

      {modalTarget && (
        <SessionModal target={modalTarget} onClose={() => setModalTarget(null)} />
      )}
    </div>
  );
};

export default CalendarPage;
