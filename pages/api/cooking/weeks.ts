import type {NextApiRequest, NextApiResponse} from "next";
import {weekService} from "../../../services/weeks";

async function handleGet(res: NextApiResponse) {
  const weeks = await weekService.findManyWithRelations();
  res.status(200).json(weeks);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {year, week, carryover_items_md, missing_staples_md, plan_md} = req.body;
  const newWeek = await weekService.create({
    year,
    week,
    carryover_items_md: carryover_items_md || null,
    missing_staples_md: missing_staples_md || null,
    plan_md: plan_md || null,
  });
  res.status(201).json(newWeek);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, year, week, carryover_items_md, missing_staples_md, plan_md} = req.body;
  const updatedWeek = await weekService.update(id, {
    year,
    week,
    carryover_items_md: carryover_items_md ?? null,
    missing_staples_md: missing_staples_md ?? null,
    plan_md: plan_md ?? null,
  });
  res.status(200).json(updatedWeek);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        await handleGet(res);
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
    console.error("Week API error:", error);
    res.status(500).json({error: "Internal server error"});
  }
}