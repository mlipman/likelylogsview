/**
 * MCP tools for Recipe entity
 */

import {recipeService, recipeToString, RecipeContent} from "../../../services/recipes";
import {importNytRecipe} from "../../../services/nytImport";
import {McpTool, stringArgument, idArgument} from "./utils";
import {EntityStatus} from "@prisma/client";

const viewAllRecipes: McpTool = {
  name: "view_all_recipes",
  description: "View all cooking recipes from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const recipes = await recipeService.findMany();
    return recipeService.allRecipes(recipes);
  },
};

const createRecipe: McpTool = {
  name: "create_recipe",
  description: "Create a new cooking recipe in the Sgt Chef app",
  arguments: [
    stringArgument("title", "The recipe title", true),
    stringArgument("summary", "A brief summary of the recipe", false),
    stringArgument("content_md", "The recipe content in markdown format", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
    stringArgument("source", "The source of the recipe", false),
    stringArgument("url", "URL to the original recipe", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
  ],
  handler: async (args: {
    title: string;
    summary?: string;
    content_md?: string;
    details?: string;
    source?: string;
    url?: string;
    status?: string;
  }): Promise<string> => {
    const {title, summary, content_md, details, source, url, status} = args;
    const data: RecipeContent = {
      title,
      summary: summary || null,
      content_md: content_md || null,
      details: details || null,
      source: source || null,
      url: url || null,
      status: (status as EntityStatus) || EntityStatus.proposed,
    };
    const newRecipe = await recipeService.create(data);
    return `Successfully created recipe:\n\n${recipeToString(newRecipe)}`;
  },
};

const updateRecipe: McpTool = {
  name: "update_recipe",
  description:
    "Update an existing cooking recipe in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("title", "The recipe title", false),
    stringArgument("summary", "A brief summary of the recipe", false),
    stringArgument("content_md", "The recipe content in markdown format", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
    stringArgument("source", "The source of the recipe", false),
    stringArgument("url", "URL to the original recipe", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
  ],
  handler: async (args: {
    id: number;
    title?: string;
    summary?: string;
    content_md?: string;
    details?: string;
    source?: string;
    url?: string;
    status?: string;
  }): Promise<string> => {
    const {id, title, summary, content_md, details, source, url, status} = args;
    const currentRecipe = await recipeService.findById(id);
    if (!currentRecipe) {
      throw new Error(`Recipe with ID ${id} not found`);
    }

    const data: RecipeContent = {
      title: title != null ? title : currentRecipe.title,
      summary: summary != null ? summary || null : currentRecipe.summary,
      content_md: content_md != null ? content_md : currentRecipe.content_md,
      details: details != null ? details || null : currentRecipe.details,
      source: source != null ? source : currentRecipe.source,
      url: url != null ? url : currentRecipe.url,
      status: status != null ? (status as EntityStatus) : currentRecipe.status,
    };

    const updatedRecipe = await recipeService.update(id, data);
    return `Successfully updated recipe:\n\n${recipeToString(updatedRecipe)}`;
  },
};

const deleteRecipe: McpTool = {
  name: "delete_recipe",
  description: "Delete a cooking recipe from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedRecipe = await recipeService.delete(id);
    return `Successfully deleted recipe:\n\n${recipeToString(deletedRecipe)}`;
  },
};

const importNytRecipeTool: McpTool = {
  name: "import_nyt_recipe",
  description:
    "Import a recipe from NYT Cooking by URL. Fetches the page, extracts structured recipe data, and creates a new recipe in the Sgt Chef app.",
  arguments: [
    stringArgument("url", "NYT Cooking recipe URL (https://cooking.nytimes.com/recipes/...)", true),
  ],
  handler: async (args: {url: string}): Promise<string> => {
    const {url} = args;
    const importedData = await importNytRecipe(url);
    const data: RecipeContent = {
      title: importedData.title,
      summary: null,
      content_md: importedData.content_md,
      details: null,
      source: importedData.source,
      url: importedData.url,
      status: EntityStatus.proposed,
    };
    const newRecipe = await recipeService.create(data);
    return `Successfully imported and created recipe:\n\n${recipeToString(newRecipe)}`;
  },
};

export const recipeMcpTools: McpTool[] = [
  viewAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  importNytRecipeTool,
];
