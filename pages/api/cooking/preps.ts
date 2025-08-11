import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;
  const where = week_id ? {week_id: parseInt(week_id as string)} : {};

  const preps = await prisma.prep.findMany({
    where,
    orderBy: {created_at: "desc"},
    include: {
      week: true,
      project: true,
    },
  });
  res.status(200).json(preps);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, project_id, plan_md} = req.body;
  const newPrep = await prisma.prep.create({
    data: {
      week_id,
      project_id: project_id || null,
      plan_md,
    },
  });
  res.status(201).json(newPrep);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, occurred_at, plan_md, outcome_md, result_pic_ids} = req.body;

  const updatedPrep = await prisma.prep.update({
    where: {id},
    data: {
      occurred_at: occurred_at ? new Date(occurred_at) : null,
      plan_md,
      outcome_md,
      result_pic_ids,
    },
  });
  res.status(200).json(updatedPrep);
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
    console.error("Prep API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
