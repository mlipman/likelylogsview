import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        const weeks = await prisma.week.findMany({
          orderBy: {created_at: "desc"},
          include: {
            shops: true,
            preps: true,
            cooks: true,
            starting_status: true,
          },
        });
        res.status(200).json(weeks);
        break;

      case "POST":
        const {year, week} = req.body;
        const newWeek = await prisma.week.create({
          data: {
            year,
            week,
          },
        });
        res.status(201).json(newWeek);
        break;

      case "PUT":
        const {id, year: updateYear, week: updateWeek} = req.body;
        const updatedWeek = await prisma.week.update({
          where: {id},
          data: {
            year: updateYear,
            week: updateWeek,
          },
        });
        res.status(200).json(updatedWeek);
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Week API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
