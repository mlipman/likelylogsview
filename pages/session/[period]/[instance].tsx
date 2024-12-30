import {FC, useState, KeyboardEvent, useEffect} from "react";
import {Send} from "lucide-react";
import styles from "@/styles/Session.module.css";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {useRouter} from "next/router";
import {
  startOfISOWeek,
  getDate,
  getYear,
  format,
  addDays,
  setISOWeek,
  setISOWeekYear,
} from "date-fns";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const InstanceSession: FC = () => {
  const router = useRouter();
  const {period, instance} = router.query;
  const [context, setContext] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    setLoading(false);
  }, [router.isReady, period, instance]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {role: "user", content: input};
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add fake response
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "This is a simulated response. The *actual* API integration will be implemented later.",
      },
    ]);
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const makeHeader = (
    periodInput: string | string[] | undefined,
    instanceInput: string | string[] | undefined
  ): string | null => {
    if (
      !periodInput ||
      !instanceInput ||
      Array.isArray(periodInput) ||
      Array.isArray(instanceInput)
    ) {
      return null;
    }

    if (periodInput === "month") {
      const year = parseInt(instanceInput.substring(0, 4));
      const month = parseInt(instanceInput.substring(4, 6)) - 1;
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return null;
      }
      const date = new Date(year, month);
      return date.toLocaleString("en-US", {month: "long", year: "numeric"});
    } else if (periodInput === "week") {
      const year = parseInt(instanceInput.substring(0, 4));
      const week = parseInt(instanceInput.substring(4, 6));
      if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
        return null;
      }
      const startDate = startOfISOWeek(
        setISOWeek(setISOWeekYear(new Date(), year), week)
      );
      const endDate = addDays(startDate, 6);
      const startMonth = format(startDate, "MMMM");
      const endMonth = format(endDate, "MMMM");
      const startYear = getYear(startDate);
      const endYear = getYear(endDate);
      const startDay = getDate(startDate);
      const endDay = getDate(endDate);

      if (startYear !== endYear) {
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
      } else if (startMonth !== endMonth) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
      } else {
        return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
      }
    } else if (periodInput === "day") {
      const year = parseInt(instanceInput.substring(0, 4));
      const day = parseInt(instanceInput.substring(4, 7));
      if (isNaN(year) || isNaN(day) || day < 1 || day > 366) {
        return null;
      }
      const date = new Date(year, 0);
      date.setDate(day);
      return date.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else {
      return null;
    }
  };

  const header = makeHeader(period, instance);

  return loading ? (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <div className={styles.container}>
      <h1 className={styles.header}>{header}</h1>
      <h2 className={styles.subheader}>
        {period}
        {instance}
      </h2>
      <div className={styles.contextArea}>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className={styles.contextTextarea}
          placeholder="Enter context here..."
        />
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messagesArea}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? styles.messageUser
                  : styles.messageAssistant
              }
            >
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className={styles.messageAssistant}>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Cmd + Enter to send)"
            className={styles.inputTextarea}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.sendButton}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstanceSession;
