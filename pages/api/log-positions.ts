import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {logId, position} = req.body;
    await prisma.log.updateMany({
      where: {position},
      data: {position: null},
    });
    const updatedLog = await prisma.log.update({
      where: {id: Number(logId)},
      data: {position},
    });
    return res.status(200).json(updatedLog);
  }
  return res.status(405).json({error: `Method ${req.method} Not Allowed`});
}
