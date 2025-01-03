import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {instance, message_list_json, context_json} = req.body;
    const session = await prisma.session.upsert({
      where: {instance},
      update: {message_list_json, context_json},
      create: {instance, message_list_json, context_json},
    });
    return res.status(201).json(session);
  }

  if (req.method === "GET") {
    const {instance} = req.query;
    if (typeof instance === "string") {
      const session = await prisma.session.findUnique({
        where: {instance},
      });
      if (session) {
        return res.status(200).json(session);
      } else {
        return res.status(404).json({message: "Conversation not found"});
      }
    }
  }
  return res.status(405).json({message: "Method not allowed"});
}
