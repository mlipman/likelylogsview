import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";
import {getCloudinaryUrls} from "../../utils/imageUtils";

const prisma = new PrismaClient();

// to do: load up existing postions. place based on number.
// enrich.
// chat with logs

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const {id, enrich} = req.query;
    if (id && enrich == null) {
      const log = await prisma.log.findUnique({
        where: {id: Number(id)},
      });

      if (!log) {
        return res.status(404).json({error: "Log not found"});
      }

      return res.status(200).json(log);
    }

    if (Array.isArray(id)) {
      return res.status(400).json({error: "Unsupported"});
    }
    // put this in a better place
    if (id && enrich) {
      const fetchedMeal = await prisma.log.findUnique({
        where: {id: Number(id)},
      });
      if (fetchedMeal == null) {
        return res.status(400);
      }
      const text =
        "please describe the food in the image and give your best estimate of a calorie count";

      const mealImageUrls = fetchedMeal.pic_id1
        ? getCloudinaryUrls(fetchedMeal.pic_id1)
        : null;

      const message = {
        role: "user",
        content: [
          {type: "text", text},
          {type: "image_url", image_url: {url: mealImageUrls?.srcUrl}},
        ],
      };
      // cleanup to be done: api endpoints. flows.
      console.log("32");
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
        }
      );
      const data = await response.json();
      return res
        .status(200)
        .json({messageContent: data.choices[0].message.content});
    }

    const logs = await prisma.log.findMany({
      orderBy: {created_at: "desc"},
    });
    return res.status(200).json(logs);
  }

  if (req.method === "PUT") {
    const {position, contents} = req.body;

    if (position == null || contents == null) {
      return res.status(400).json({error: "Missing position or contents"});
    }

    const updatedLog = await prisma.log.upsert({
      where: {position: Number(position)},
      create: {contents, position},
      update: {contents, position},
    });

    return res.status(200).json(updatedLog);
  }

  return res.status(405).json({error: `Method ${req.method} Not Allowed`});
}
