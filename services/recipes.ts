import {Recipe, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type RecipeContent = Omit<Recipe, (typeof NON_CONTENT_FIELDS)[number]>;

export class RecipeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findMany(): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      orderBy: {created_at: "desc"},
    });
  }

  async findById(id: number): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: {id},
    });
  }

  async create(data: RecipeContent): Promise<Recipe> {
    return this.prisma.recipe.create({
      data,
    });
  }

  async update(id: number, data: RecipeContent): Promise<Recipe> {
    return this.prisma.recipe.update({
      where: {id},
      data,
    });
  }

  async delete(id: number): Promise<Recipe> {
    return this.prisma.recipe.delete({
      where: {id},
    });
  }

  /**
   * Format recipes for MCP string output
   */
  allRecipes(recipes: Recipe[]): string {
    if (recipes.length === 0) {
      return "No recipes found.";
    }

    return `Found ${recipes.length} recipes:\n\n${recipes
      .map(recipe => recipeToString(recipe))
      .join("\n")}`;
  }
}

// Recipe utility functions for string conversion

/**
 * Convert a single recipe to a formatted string
 */
export function recipeToString(recipe: Recipe): string {
  return `**${recipe.title}**\n${
    recipe.source ? `Source: ${recipe.source}\n` : ""
  }${recipe.url ? `URL: ${recipe.url}\n` : ""}${
    recipe.content_md ? `Content:\n${recipe.content_md}\n` : ""
  }ID: ${recipe.id}\nCreated: ${recipe.created_at}\nUpdated: ${recipe.updated_at}\n---\n`;
}

// Export a singleton instance
export const recipeService = new RecipeService();
