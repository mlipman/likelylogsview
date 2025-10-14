import type {NextApiRequest, NextApiResponse} from "next";
import {shopService} from "../../../services/shops";

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {week_id} = req.query;

  if (week_id) {
    const shops = await shopService.findManyByWeek(parseInt(week_id as string));
    res.status(200).json(shops);
  } else {
    const shops = await shopService.findMany();
    res.status(200).json(shops);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    week_id,
    occurred_at,
    planned_items_text,
    planning_notes,
    purchased_items_text,
    store_name,
    total_cost,
    receipt_pic_id,
    shopping_notes,
  } = req.body;

  const newShop = await shopService.create({
    week_id,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    planned_items_text,
    planning_notes,
    purchased_items_text,
    store_name,
    total_cost,
    receipt_pic_id,
    shopping_notes,
  });
  res.status(201).json(newShop);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {
    id,
    week_id,
    occurred_at,
    planned_items_text,
    planning_notes,
    purchased_items_text,
    store_name,
    total_cost,
    receipt_pic_id,
    shopping_notes,
  } = req.body;

  const updatedShop = await shopService.update(id, {
    week_id,
    occurred_at: occurred_at ? new Date(occurred_at) : null,
    planned_items_text,
    planning_notes,
    purchased_items_text,
    store_name,
    total_cost,
    receipt_pic_id,
    shopping_notes,
  });
  res.status(200).json(updatedShop);
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
    console.error("Shop API error:", error);
    res.status(500).json({error: "Internal server error"});
  }
}