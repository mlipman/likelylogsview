import React, {useState, FormEvent, ChangeEvent} from "react";
import {Send} from "lucide-react";

interface ChatMessage {
  type: "user" | "llm";
  message: string;
}

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat history
    setChatHistory((prev) => [{type: "user", message: input}, ...prev]);
    setInput("");

    // TODO: Replace this with actual LLM API call
    const llmResponse = await mockLLMResponse(input);

    // Add LLM response to chat history
    setChatHistory((prev) => [{type: "llm", message: llmResponse}, ...prev]);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Mock LLM response (replace with actual API call)
  const mockLLMResponse = async (message: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
    return `LLM response to: "${message}"`;
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Send size={24} />
        </button>
      </form>
      <div className="flex-grow overflow-auto mb-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md p-2 rounded-lg ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatInterface;
