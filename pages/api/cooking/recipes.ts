import type {NextApiRequest, NextApiResponse} from "next";
import {recipeService} from "../../../services/recipes";

async function handleGet(res: NextApiResponse) {
  const recipes = await recipeService.findMany();
  res.status(200).json(recipes);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {title, summary, content_md, details, source, url, status} = req.body;
  const newRecipe = await recipeService.create({
    title,
    summary,
    content_md,
    details,
    source,
    url,
    status,
  });
  res.status(201).json(newRecipe);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, title, summary, content_md, details, source, url, status} = req.body;
  const updatedRecipe = await recipeService.update(id, {
    title,
    summary,
    content_md,
    details,
    source,
    url,
    status,
  });
  res.status(200).json(updatedRecipe);
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
    console.error("Recipe API error:", error);
    res.status(500).json({error: "Internal server error"});
  }
}
