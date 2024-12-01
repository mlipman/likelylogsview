import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

// to do: load up existing postions. place based on number.
// enrich.
// chat with logs

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
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
