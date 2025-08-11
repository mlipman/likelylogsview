import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        const {week_id} = req.query;
        const where = week_id ? {week_id: parseInt(week_id as string)} : {};

        const shops = await prisma.shop.findMany({
          where,
          orderBy: {created_at: "desc"},
          include: {
            week: true,
          },
        });
        res.status(200).json(shops);
        break;

      case "POST":
        const {week_id: weekId, planned_items_text, planning_notes} = req.body;
        const newShop = await prisma.shop.create({
          data: {
            week_id: weekId,
            planned_items_text,
            planning_notes,
          },
        });
        res.status(201).json(newShop);
        break;

      case "PUT":
        const {
          id,
          occurred_at,
          purchased_items_text,
          store_name,
          total_cost,
          receipt_pic_id,
          shopping_notes,
        } = req.body;
        const updatedShop = await prisma.shop.update({
          where: {id},
          data: {
            occurred_at: occurred_at ? new Date(occurred_at) : null,
            purchased_items_text,
            store_name,
            total_cost,
            receipt_pic_id,
            shopping_notes,
          },
        });
        res.status(200).json(updatedShop);
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Shop API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
