import {FC, useState, KeyboardEvent, useEffect} from "react";
import {Send} from "lucide-react";
import styles from "../styles/Session.module.css";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {useRouter} from "next/router";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Session: FC = () => {
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

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>{today}</h1>
      <h2 className={styles.subheader}>{instance}</h2>
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

export default Session;
