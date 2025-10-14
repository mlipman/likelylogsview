import type {NextApiRequest, NextApiResponse} from "next";
import {cookService} from "../../../services/cooks";

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;

  if (week_id) {
    const cooks = await cookService.findManyByWeek(parseInt(week_id as string));
    res.status(200).json(cooks);
  } else {
    const cooks = await cookService.findMany();
    res.status(200).json(cooks);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, recipe_id, occurred_at, plan_md, outcome_md, result_pic_ids} = req.body;

  const newCook = await cookService.create({
    week_id,
    recipe_id,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    plan_md,
    outcome_md,
    result_pic_ids,
  });
  res.status(201).json(newCook);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, week_id, recipe_id, occurred_at, plan_md, outcome_md, result_pic_ids} = req.body;

  const updatedCook = await cookService.update(id, {
    week_id,
    recipe_id,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    plan_md,
    outcome_md,
    result_pic_ids,
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
  }
}