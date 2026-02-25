import type {NextApiRequest, NextApiResponse} from "next";
import {importNytRecipe} from "../../../../services/nytImport";
import {recipeService} from "../../../../services/recipes";
import {EntityStatus} from "@prisma/client";

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {url} = req.body;

  if (!url) {
    res.status(400).json({error: "url is required"});
    return;
  }

  const importedData = await importNytRecipe(url);
  const newRecipe = await recipeService.create({
    title: importedData.title,
    summary: null,
    content_md: importedData.content_md,
    details: null,
    source: importedData.source,
    url: importedData.url,
    status: EntityStatus.proposed,
  });
  res.status(201).json(newRecipe);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "POST":
        await handlePost(req, res);
        break;

      default:
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Recipe import API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({error: message});
  }
}
