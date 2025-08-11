import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;
  const where = week_id ? {week_id: parseInt(week_id as string)} : {};

  const cooks = await prisma.cook.findMany({
    where,
    orderBy: {created_at: "desc"},
    include: {
      week: true,
      recipe: true,
    },
  });
  res.status(200).json(cooks);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, recipe_id, plan_md, outcome_md, result_pic_ids} = req.body;
  const occurred_at = new Date();

  const newCook = await prisma.cook.create({
    data: {
      week_id,
      recipe_id,
      occurred_at,
      plan_md,
      outcome_md,
      result_pic_ids,
    },
  });
  res.status(201).json(newCook);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, week_id, recipe_id, occurred_at, plan_md, outcome_md, result_pic_ids} =
    req.body;

  const updatedCook = await prisma.cook.update({
    where: {id},
    data: {
      week_id,
      recipe_id,
      occurred_at,
      plan_md,
      outcome_md,
      result_pic_ids,
    },
  });
  res.status(200).json(updatedCook);
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
    console.error("Cook API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
