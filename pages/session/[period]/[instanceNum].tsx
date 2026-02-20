import {FC, useState, KeyboardEvent, useEffect} from "react";
import {Send} from "lucide-react";
import styles from "@/styles/Session.module.css";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {useRouter} from "next/router";
import {childPages, makeHeader} from "@/utils/dates";
import type {Period} from "@/utils/dates";
import Link from "next/link";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Context {
  data: string;
}

const InstanceSession: FC = () => {
  const router = useRouter();
  const {period, instanceNum} = router.query; // eg {week, 202451}
  const [context, setContext] = useState<Context>({data: ""});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [_, setSaving] = useState(false);
  const [askChat, setAskChat] = useState(false);
  const [weightLbs, setWeightLbs] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);

  const getAIResponse = async (
    systemMessage: Message,
    originalMessages: Message[],
    userMessage: Message
  ): Promise<Message> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messagesWithContext: [systemMessage, ...originalMessages, userMessage],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      return {
        role: "assistant",
        content: data.content,
      };
    } catch (error) {
      return {
        role: "assistant",
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {role: "user", content: input};
    const originalMessages = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Save user message with server-side timestamp
    const stampedMessage = await saveNewMessage(userMessage);
    const userWithTimestamp = stampedMessage || userMessage;

    let messages_to_add: Message[] = [];

    if (askChat) {
      setMessageLoading(true);
      const systemMessage: Message = {role: "system", content: context.data};
      const aiResponse = await getAIResponse(
        systemMessage,
        originalMessages,
        userMessage
      );
      messages_to_add = [aiResponse];
      setMessageLoading(false);
    }

    const newMessages = [...originalMessages, userWithTimestamp, ...messages_to_add];
    setMessages(newMessages);

    if (messages_to_add.length > 0) {
      await saveSession(newMessages);
    }
  };

  // removes the message and the following assistant message if it exists
  const removeMessage = async (index: number) => {
    setMessages(prev => {
      const nextMessage = prev[index + 1];

      if (nextMessage && nextMessage.role === "assistant") {
        return [...prev.slice(0, index), ...prev.slice(index + 2)];
      }
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const saveNewMessage = async (message: Message): Promise<Message | null> => {
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          instance: `${period}${instanceNum}`,
          context_json: JSON.stringify(context),
          new_message: {role: message.role, content: message.content},
        }),
      });
      const data = await response.json();
      if (data.stamped_message) {
        return data.stamped_message as Message;
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveSession = async (messagesToSave: Message[] = messages) => {
    // add error handling
    if (context.data === "" && messagesToSave.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          instance: `${period}${instanceNum}`,
          message_list_json: JSON.stringify(messagesToSave),
          context_json: JSON.stringify(context),
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const saveWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0 || weightSaving) return;

    setWeightSaving(true);
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          instance: `${period}${instanceNum}`,
          message_list_json: JSON.stringify(messages),
          context_json: JSON.stringify(context),
          weight_lbs: weight,
        }),
      });
      setWeightLbs(String(weight));
    } catch (error) {
      console.error("Failed to save weight:", error);
    } finally {
      setWeightSaving(false);
    }
  };

  const handleWeightKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveWeight();
    }
  };

  const fetchSession = async (instance: string) => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/session?instance=${instance}`);
      if (!response.ok) {
        setContext({data: ""});
        setMessages([]);
        setWeightLbs(null);
        setWeightInput("");
        return;
      }
      const sessionData = await response.json();
      const messagesFromApi = JSON.parse(sessionData.message_list_json);
      const contextFromApi = JSON.parse(sessionData.context_json);
      setMessages(messagesFromApi);
      setContext(contextFromApi);
      if (sessionData.weight_lbs != null) {
        setWeightLbs(String(sessionData.weight_lbs));
        setWeightInput(String(sessionData.weight_lbs));
      } else {
        setWeightLbs(null);
        setWeightInput("");
      }
    } catch (err) {
      setWeightLbs(null);
      setWeightInput("");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchSession(`${period}${instanceNum}`);
  }, [router.isReady, period, instanceNum]);

  const header = makeHeader(period, instanceNum);
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const row1Links = childPages(period as Period, instanceNum as string);
  // if month: 4 or 5 links. week x, x+1.. .
  // if week, 7 links (2 lines?), one per day.

  // also three links for previous, home, and next
  // and one to go up a level

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>{header}</h1>
      <h2 className={styles.subheader}>
        {period}
        {instanceNum}
      </h2>

      <div className={styles.boxGrid}>
        {row1Links.map((row1link, index) => (
          <Link href={row1link.url} className={styles.boxLink} key={index}>
            {row1link.title}
          </Link>
        ))}
      </div>

      {/* Weight Input */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <label className="text-sm font-medium text-gray-700 w-16">
          Weight
        </label>
        <input
          type="number"
          step="0.1"
          value={weightInput}
          onChange={e => setWeightInput(e.target.value)}
          onKeyDown={handleWeightKeyDown}
          placeholder="lbs"
          className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={saveWeight}
          disabled={weightSaving || !weightInput.trim()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {weightSaving ? "Saving..." : "Save"}
        </button>
        {weightLbs && (
          <span className="text-sm text-gray-500">
            Recorded: {weightLbs} lbs
          </span>
        )}
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messagesArea}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user" ? styles.messageUser : styles.messageAssistant
              }
            >
              <button
                onClick={() => removeMessage(index)}
                className={`${styles.smallCornerButton} cursor-pointer`}
              >
                ×
              </button>
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
          {messageLoading && (
            <div className={styles.messageAssistant}>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Cmd + Enter to send)"
            className={styles.inputTextarea}
          />

          <div className={styles.controlsArea}>
            <button
              onClick={() => setAskChat(!askChat)}
              className={`${styles.feedbackToggle} ${askChat ? styles.feedbackToggleActive : ""}`}
            >
              {askChat ? "✓ Getting External Feedback" : "+ Get External Feedback"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={messageLoading}
              className={styles.sendButton}
            >
              <Send size={20} />
              <span className={styles.sendButtonText}>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceSession;
