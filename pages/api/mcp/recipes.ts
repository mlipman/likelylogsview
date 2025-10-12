/**
 * MCP tools for Recipe entity
 */

import {recipeService, recipeToString, RecipeContent} from "../../../services/recipes";
import {McpTool, stringArgument, idArgument} from "./utils";

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
    stringArgument("content_md", "The recipe content in markdown format", false),
    stringArgument("source", "The source of the recipe", false),
    stringArgument("url", "URL to the original recipe", false),
  ],
  handler: async (args: {
    title: string;
    content_md?: string;
    source?: string;
    url?: string;
  }): Promise<string> => {
    const {title, content_md, source, url} = args;
    const data: RecipeContent = {
      title,
      content_md: content_md || null,
      source: source || null,
      url: url || null,
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
    stringArgument("content_md", "The recipe content in markdown format", false),
    stringArgument("source", "The source of the recipe", false),
    stringArgument("url", "URL to the original recipe", false),
  ],
  handler: async (args: {
    id: number;
    title?: string;
    content_md?: string;
    source?: string;
    url?: string;
  }): Promise<string> => {
    const {id, title, content_md, source, url} = args;
    const currentRecipe = await recipeService.findById(id);
    if (!currentRecipe) {
      throw new Error(`Recipe with ID ${id} not found`);
    }

    const data: RecipeContent = {
      title: title != null ? title : currentRecipe.title,
      content_md: content_md != null ? content_md : currentRecipe.content_md,
      source: source != null ? source : currentRecipe.source,
      url: url != null ? url : currentRecipe.url,
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

export const recipeMcpTools: McpTool[] = [
  viewAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
];
