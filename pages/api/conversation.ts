import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {messageListJson} = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        message_list_json: messageListJson, // not sure if works
      },
    });
    return res.status(201).json(conversation);
  }

  if (req.method === "GET") {
    const {id} = req.query;
    if (typeof id === "string") {
      const conversation = await prisma.conversation.findUnique({
        where: {id: parseInt(id)},
      });
      if (conversation) {
        return res.status(200).json(conversation);
      } else {
        return res.status(404).json({message: "Conversation not found"});
      }
    }
  }
  return res.status(405).json({message: "Method not allowed"});
}
