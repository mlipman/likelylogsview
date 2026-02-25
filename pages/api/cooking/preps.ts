import type {NextApiRequest, NextApiResponse} from "next";
import {prepService} from "../../../services/preps";

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;

  if (week_id) {
    const preps = await prepService.findManyByWeek(parseInt(week_id as string));
    res.status(200).json(preps);
  } else {
    const preps = await prepService.findMany();
    res.status(200).json(preps);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, project_id, title, summary, local_date, occurred_at, status, plan_md, outcome_md, result_pic_ids, details} = req.body;

  const newPrep = await prepService.create({
    week_id,
    project_id,
    title,
    summary,
    local_date,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    status,
    plan_md,
    outcome_md,
    result_pic_ids,
    details,
  });
  res.status(201).json(newPrep);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, week_id, project_id, title, summary, local_date, occurred_at, status, plan_md, outcome_md, result_pic_ids, details} = req.body;

  const updatedPrep = await prepService.update(id, {
    week_id,
    project_id,
    title,
    summary,
    local_date,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    status,
    plan_md,
    outcome_md,
    result_pic_ids,
    details,
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
  }
}
