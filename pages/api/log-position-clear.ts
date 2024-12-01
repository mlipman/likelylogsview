import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {position} = req.body;
    await prisma.log.update({
      where: {position},
      data: {position: null},
    });
    return res.status(200).json({});
  }
  return res.status(405).json({error: `Method ${req.method} Not Allowed`});
}
