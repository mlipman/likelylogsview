import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;
  const where = week_id ? {week_id: parseInt(week_id as string)} : {};

  const startingStatuses = await prisma.startingStatus.findMany({
    where,
    orderBy: {created_at: "desc"},
    include: {
      week: true,
    },
  });
  res.status(200).json(startingStatuses);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, carryover_items_md, missing_staples_md, notes_md} = req.body;
  const newStartingStatus = await prisma.startingStatus.create({
    data: {
      week_id,
      carryover_items_md,
      missing_staples_md,
      notes_md,
    },
  });
  res.status(201).json(newStartingStatus);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, carryover_items_md, missing_staples_md, notes_md} = req.body;
  const updatedStartingStatus = await prisma.startingStatus.update({
    where: {id},
    data: {
      carryover_items_md,
      missing_staples_md,
      notes_md,
    },
  });
  res.status(200).json(updatedStartingStatus);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        await handleGet(req, res);
        break;
      case "POST":
        await handlePost(req, res);
        break;
      case "PUT":
        await handlePut(req, res);
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("StartingStatus API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
