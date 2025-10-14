import type {NextApiRequest, NextApiResponse} from "next";
import {startingStatusService} from "../../../services/starting-statuses";

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;

  if (week_id) {
    const startingStatus = await startingStatusService.findByWeekId(parseInt(week_id as string));
    res.status(200).json(startingStatus);
  } else {
    const startingStatuses = await startingStatusService.findMany();
    res.status(200).json(startingStatuses);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {week_id, carryover_items_md, missing_staples_md, notes_md} = req.body;

  const newStartingStatus = await startingStatusService.create({
    week_id,
    carryover_items_md,
    missing_staples_md,
    notes_md,
  });
  res.status(201).json(newStartingStatus);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, week_id, carryover_items_md, missing_staples_md, notes_md} = req.body;

  const updatedStartingStatus = await startingStatusService.update(id, {
    week_id,
    carryover_items_md,
    missing_staples_md,
    notes_md,
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
  }
}
