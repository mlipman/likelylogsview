import * as cheerio from "cheerio";

// =============================================================================
// Types
// =============================================================================

interface HowToStep {
  "@type": "HowToStep";
  text: string;
}

interface HowToSection {
  "@type": "HowToSection";
  name: string;
  itemListElement: HowToStep[] | HowToStep;
}

interface NytJsonLdRecipe {
  "@type": "Recipe";
  name: string;
  description?: string;
  recipeIngredient?: string[];
  recipeInstructions?: (HowToStep | HowToSection)[];
  recipeYield?: string;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  author?: {name: string} | {name: string}[];
}

export interface ImportedRecipeData {
  title: string;
  content_md: string;
  source: string;
  url: string;
}

// =============================================================================
// URL Validation
// =============================================================================

export function validateNytUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "cooking.nytimes.com" && parsed.pathname.startsWith("/recipes/")
    );
  } catch {
    return false;
  }
}

// =============================================================================
// Fetch
// =============================================================================

export async function fetchNytPage(url: string): Promise<string> {
  const cookie = process.env.NYT_COOKIE;
  if (!cookie) {
    throw new Error(
      "NYT_COOKIE environment variable is not set. Copy your Cookie header from Chrome DevTools on cooking.nytimes.com and set it as NYT_COOKIE."
    );
  }

  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (response.status === 403) {
    throw new Error(
      "NYT returned 403 Forbidden. Your NYT_COOKIE has likely expired. Refresh it from Chrome DevTools."
    );
  }

  if (response.status === 404) {
    throw new Error(`Recipe not found at ${url}. Check that the URL is correct.`);
  }

  if (!response.ok) {
    throw new Error(`NYT returned HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

// =============================================================================
// JSON-LD Extraction
// =============================================================================

export function extractJsonLd(html: string): NytJsonLdRecipe {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    const text = $(scripts[i]).html();
    if (!text) continue;

    try {
      const data = JSON.parse(text);

      // Direct Recipe object
      if (data["@type"] === "Recipe") {
        return data as NytJsonLdRecipe;
      }

      // @graph array containing a Recipe
      if (Array.isArray(data["@graph"])) {
        const recipe = data["@graph"].find(
          (item: {["@type"]?: string}) => item["@type"] === "Recipe"
        );
        if (recipe) return recipe as NytJsonLdRecipe;
      }

      // Array at top level
      if (Array.isArray(data)) {
        const recipe = data.find(
          (item: {["@type"]?: string}) => item["@type"] === "Recipe"
        );
        if (recipe) return recipe as NytJsonLdRecipe;
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // If no Recipe JSON-LD found, likely a login/paywall page due to bad cookie
  const pageText = $.text().toLowerCase();
  if (pageText.includes("log in") || pageText.includes("subscribe") || scripts.length === 0) {
    throw new Error(
      "Could not access recipe data. Your NYT_COOKIE is likely invalid or expired. Refresh it from Chrome DevTools."
    );
  }

  throw new Error(
    "Could not find Recipe JSON-LD data on this page. The page structure may have changed."
  );
}

// =============================================================================
// ISO 8601 Duration Formatting
// =============================================================================

function formatDuration(iso: string): string {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) return iso;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.join(" ") || iso;
}

// =============================================================================
// Markdown Formatting
// =============================================================================

export function formatRecipeMarkdown(recipe: NytJsonLdRecipe): string {
  const sections: string[] = [];

  if (recipe.description) {
    sections.push(`> ${recipe.description}`);
  }

  // Metadata line
  const meta: string[] = [];
  if (recipe.recipeYield) meta.push(`**Yield:** ${recipe.recipeYield}`);
  if (recipe.totalTime) meta.push(`**Total Time:** ${formatDuration(recipe.totalTime)}`);
  if (recipe.prepTime) meta.push(`**Prep Time:** ${formatDuration(recipe.prepTime)}`);
  if (recipe.cookTime) meta.push(`**Cook Time:** ${formatDuration(recipe.cookTime)}`);
  if (meta.length > 0) {
    sections.push(meta.join(" | "));
  }

  // Ingredients
  if (recipe.recipeIngredient && recipe.recipeIngredient.length > 0) {
    const ingredientLines = recipe.recipeIngredient.map(item => `- ${item}`).join("\n");
    sections.push(`## Ingredients\n\n${ingredientLines}`);
  }

  // Instructions
  if (recipe.recipeInstructions && recipe.recipeInstructions.length > 0) {
    const instructionLines = formatInstructions(recipe.recipeInstructions);
    sections.push(`## Instructions\n\n${instructionLines}`);
  }

  return sections.join("\n\n");
}

function formatInstructions(instructions: (HowToStep | HowToSection)[]): string {
  // Check if sections have meaningful names worth preserving
  const namedSections = instructions.filter(
    item => item["@type"] === "HowToSection" && (item as HowToSection).name
  );
  const useGroupedFormat = namedSections.length > 1;

  if (useGroupedFormat) {
    return instructions
      .map(item => {
        if (item["@type"] === "HowToSection") {
          const section = item as HowToSection;
          const steps = Array.isArray(section.itemListElement)
            ? section.itemListElement
            : [section.itemListElement];
          const stepLines = steps
            .map((step, i) => `${i + 1}. ${step.text}`)
            .join("\n");
          return `### ${section.name}\n\n${stepLines}`;
        }
        return `1. ${(item as HowToStep).text}`;
      })
      .join("\n\n");
  }

  // Flatten everything into a single numbered list
  const allSteps = flattenSteps(instructions);
  return allSteps.map((text, i) => `${i + 1}. ${text}`).join("\n");
}

function flattenSteps(instructions: (HowToStep | HowToSection)[]): string[] {
  const steps: string[] = [];
  for (const item of instructions) {
    if (item["@type"] === "HowToStep") {
      steps.push(item.text);
    } else if (item["@type"] === "HowToSection") {
      const section = item as HowToSection;
      const children = Array.isArray(section.itemListElement)
        ? section.itemListElement
        : [section.itemListElement];
      for (const step of children) {
        steps.push(step.text);
      }
    }
  }
  return steps;
}

// =============================================================================
// Main Orchestrator
// =============================================================================

export async function importNytRecipe(url: string): Promise<ImportedRecipeData> {
  if (!validateNytUrl(url)) {
    throw new Error(
      `Invalid NYT Cooking URL. Expected format: https://cooking.nytimes.com/recipes/...`
    );
  }

  const html = await fetchNytPage(url);
  const jsonLd = extractJsonLd(html);
  const content_md = formatRecipeMarkdown(jsonLd);

  return {
    title: jsonLd.name,
    content_md,
    source: "NYT Cooking",
    url,
  };
}
