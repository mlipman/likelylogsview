import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        const recipes = await prisma.recipe.findMany({
          orderBy: {created_at: "desc"},
        });
        res.status(200).json(recipes);
        break;

      case "POST":
        const {title, content_md, source, url} = req.body;
        const newRecipe = await prisma.recipe.create({
          data: {
            title,
            content_md,
            source,
            url,
          },
        });
        res.status(201).json(newRecipe);
        break;

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Recipe API error:", error);
    res.status(500).json({error: "Internal server error"});
  } finally {
    await prisma.$disconnect();
  }
}
