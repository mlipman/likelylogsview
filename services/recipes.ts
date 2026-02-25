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
   * Format recipes for MCP string output (excludes details)
   */
  allRecipes(recipes: Recipe[]): string {
    if (recipes.length === 0) {
      return "No recipes found.";
    }

    return `Found ${recipes.length} recipes:\n\n${recipes
      .map(recipe => recipeToSummaryString(recipe))
      .join("\n")}`;
  }
}

// Recipe utility functions for string conversion

/**
 * Convert a single recipe to a summary string (excludes details)
 * Used in list/MCP responses
 */
export function recipeToSummaryString(recipe: Recipe): string {
  const parts = [`**${recipe.title}**`];

  parts.push(`Status: ${recipe.status}`);
  if (recipe.summary) parts.push(`Summary: ${recipe.summary}`);
  if (recipe.source) parts.push(`Source: ${recipe.source}`);
  if (recipe.url) parts.push(`URL: ${recipe.url}`);
  if (recipe.content_md) parts.push(`Content:\n${recipe.content_md}`);

  parts.push(`ID: ${recipe.id}`);
  parts.push(`Created: ${recipe.created_at}`);
  parts.push(`Updated: ${recipe.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

/**
 * Convert a single recipe to a full string including details
 * Used for individual entity views
 */
export function recipeToString(recipe: Recipe): string {
  const parts = [recipeToSummaryString(recipe).replace(/\n---\n$/, '')];

  if (recipe.details) parts.push(`Details:\n${recipe.details}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const recipeService = new RecipeService();
