import type {NextApiRequest, NextApiResponse} from "next";
import OpenAI from "openai";
import {ChatCompletion, CompletionChoice} from "openai/resources";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {singleMessageText} = req.body as {singleMessageText: string};
    const imageUrl =
      "https://res.cloudinary.com/dllptigzk/image/upload/v1731521561/logs/koahnvnx2x5xf6vzy4kk.jpg";

    const message = {
      role: "user",
      content: [
        {type: "text", text: singleMessageText},
        {type: "image_url", image_url: {url: imageUrl}},
      ],
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [message],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    // old: fetch returns response. response.json is data
    // data.error?.message if response not ok
    // data.choices[0].message.content

    // new:
    // messges have a role and content.
    // choice has a message which has a role and contnet
    const completion: ChatCompletion = await client.chat.completions.create({
      messages: [{role: "user", content: "Say this is a test"}],
      model: "gpt-3.5-turbo",
    });
    const a = completion.choices[0].message.content;

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
