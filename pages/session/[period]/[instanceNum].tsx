import {FC, useState, KeyboardEvent, useEffect, useCallback} from "react";
import {Send} from "lucide-react";
import styles from "@/styles/Session.module.css";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {useRouter} from "next/router";
import {makeHeader} from "@/utils/dateHeader";

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
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {role: "user", content: input};
    const systemMessage: Message = {role: "system", content: context.data};
    const originalMessages = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setMessageLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messagesWithContext: [
            systemMessage,
            ...originalMessages,
            userMessage,
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setMessageLoading(false);
    }
  };

  // removes the message and the following one if it exists
  const removeMessage = async (index: number) => {
    setMessages((prev) => [...prev.slice(0, index), ...prev.slice(index + 2)]);
  };

  const saveSession = useCallback(async () => {
    // add error handling
    setSaving(true);
    await fetch("/api/session", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        instance: `${period}${instanceNum}`,
        message_list_json: JSON.stringify(messages),
        context_json: JSON.stringify(context),
      }),
    });
    setSaving(false);
  }, [period, instanceNum, messages, context]);

  useEffect(() => {
    if (!pageLoading) {
      saveSession();
    }
  }, [messages, saveSession, pageLoading]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // todo tomorrow: post session, integrate with chatgpt api
  const fetchSession = async (instance: string) => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/session?instance=${instance}`);
      if (!response.ok) {
        setContext({data: "notfound"});
        setMessages([]);
      }
      const sessionData = await response.json();
      const messagesFromApi = JSON.parse(sessionData.message_list_json);
      const contextFromApi = JSON.parse(sessionData.context_json);
      setMessages(messagesFromApi);
      setContext(contextFromApi);
    } catch (err) {
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

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>{header}</h1>
      <h2 className={styles.subheader}>
        {period}
        {instanceNum}
      </h2>
      <div className={styles.contextArea}>
        <div className="relative">
          <textarea
            value={context.data}
            onChange={(e) => setContext({data: e.target.value})}
            className={styles.contextTextarea}
            placeholder="Enter context here..."
          />
          {saving ? (
            <div className={styles.smallCornerButton}>Saving...</div>
          ) : (
            <button
              onClick={() => saveSession()}
              className={`${styles.smallCornerButton} cursor-pointer`}
            >
              Save
            </button>
          )}
        </div>
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
            disabled={messageLoading}
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
