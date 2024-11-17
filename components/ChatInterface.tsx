import React, {useState, useEffect} from "react";
import {Send} from "lucide-react";
import {Message} from "../pages/coach"; // Importing Message type from coach.tsx
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface ChatInterfaceProps {
  initialMessages: Message[]; // Props to take in a list of messages
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({initialMessages}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // this makes sure that if initialMessages changes due to things outside this
  // component, such as its parent, then we still update state
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {role: "user" as const, content: input};
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
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
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveConversation = async () => {
    console.log("raw", messages);
    const conversationJson = JSON.stringify(messages);
    console.log("Conversation JSON:", conversationJson);
    await fetch("api/conversation", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({messageListJson: JSON.stringify(messages)}),
    });
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === "user"
                ? "bg-blue-100 ml-12"
                : "bg-gray-100 mr-12"
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 p-4 rounded-lg mr-12 animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px] max-h-[200px]"
        />
        <button
          type="button"
          onClick={saveConversation}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Save Conversation
        </button>
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
