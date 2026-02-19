import type {NextApiRequest, NextApiResponse} from "next";
import {sessionService} from "../../services/sessions";
import {Prisma} from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const {instance, message_list_json, context_json, weight_lbs} = req.body;
    const session = await sessionService.upsert(
      instance,
      message_list_json,
      context_json,
      weight_lbs != null ? new Prisma.Decimal(weight_lbs) : undefined
    );
    return res.status(201).json(session);
  }

  if (req.method === "GET") {
    const {instance} = req.query;
    if (typeof instance === "string") {
      const session = await sessionService.findByInstance(instance);
      if (session) {
        return res.status(200).json(session);
      } else {
        return res.status(404).json({message: "Conversation not found"});
      }
    }
  }
  return res.status(405).json({message: "Method not allowed"});
}
