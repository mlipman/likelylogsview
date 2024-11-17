import {FC, useState} from "react";
import {GetServerSideProps} from "next";
import ChatInterface from "../components/ChatInterface";

interface MyThingProps {
  data: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}
const Coach: FC<MyThingProps> = ({data}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = async (number: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversation?id=${number}`);
      if (!response.ok) {
        throw new Error(`Conversation ${number} not found`);
      }
      const conversationData = await response.json();
      const newMessages = JSON.parse(conversationData.messageListJson);
      setMessages(newMessages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Welcome 2 to MyThing Page</h1>
      <p className="mb-4">{data}</p>
      <div className="mb-4">
        {[6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => fetchConversation(num)}
            className="mr-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {num}
          </button>
        ))}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-600">Loading conversation...</div>
          </div>
        ) : (
          <ChatInterface initialMessages={messages} />
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (_context) => {
  // Fetch your data here
  const data = "This is some server-side fetched data.";

  return {props: {data}};
};

export default Coach;
