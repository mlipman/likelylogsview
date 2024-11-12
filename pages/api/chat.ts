import type {NextApiRequest, NextApiResponse} from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messages} = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Updated model name
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Failed to get response from OpenAI"
      );
    }

    return res.status(200).json({
      message: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: "Failed to process chat request",
    });
  }
}
