import type {NextApiRequest, NextApiResponse} from "next";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
  error?: {
    message: string;
  };
}

/*
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

async function fetchOpenAIResponse(
  messagesWithContext: Message[]
): Promise<OpenAIResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messagesWithContext,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data: OpenAIResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to get response from OpenAI");
  }

  return data;
}
*/

async function fetchAnthropicResponse(
  messagesWithContext: Message[]
): Promise<AnthropicResponse> {
  const messages = messagesWithContext.map(msg => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      messages: messages,
      max_tokens: 3000,
    }),
  });

  const data: AnthropicResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to get response from Anthropic");
  }

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext} = req.body;

    const response = await fetchAnthropicResponse(messagesWithContext);

    return res.status(200).json({
      content: response.content[0].text,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: `Failed to process chat request: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
