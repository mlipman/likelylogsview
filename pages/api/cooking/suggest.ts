import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const {week_id, user_query} = req.body;

    // Fetch contextual data for the week
    const week = await prisma.week.findUnique({
      where: {id: week_id},
      include: {
        starting_status: true,
        shops: true,
        preps: true,
        cooks: true,
      },
    });

    // Get available recipes and projects
    const recipes = await prisma.recipe.findMany({
      orderBy: {created_at: "desc"},
    });

    // const projects = await prisma.project.findMany({
    //   orderBy: { created_at: 'desc' },
    // });

    // Build context for the LLM
    const contextParts = [
      "You are Sgt Chef, a helpful cooking assistant. Based on the context below, suggest what the user should cook.",
      "",
      "CURRENT WEEK CONTEXT:",
      week?.starting_status?.carryover_items_md
        ? `Available ingredients: ${week.starting_status.carryover_items_md}`
        : "",
      week?.starting_status?.missing_staples_md
        ? `Missing staples: ${week.starting_status.missing_staples_md}`
        : "",
      "",
      "RECENT SHOPPING:",
      week?.shops
        ?.map(shop => (shop.purchased_items_text ? `• ${shop.purchased_items_text}` : ""))
        .filter(Boolean)
        .join("\n") || "No recent shopping recorded",
      "",
      "RECENT COOKING:",
      week?.cooks
        ?.map(cook => (cook.outcome_md ? `• ${cook.outcome_md}` : ""))
        .filter(Boolean)
        .join("\n") || "No recent cooking recorded",
      "",
      "AVAILABLE RECIPES:",
      recipes
        .slice(0, 5)
        .map(recipe => `• ${recipe.title}: ${recipe.content_md || "No description"}`)
        .join("\n") || "No recipes available",
      "",
      "USER QUERY:",
      user_query || "What should I cook?",
      "",
      "Please provide 3-5 specific, actionable cooking suggestions. For each suggestion, briefly explain why it makes sense given the current context.",
    ];

    const context = contextParts.filter(Boolean).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Sgt Chef, a helpful cooking assistant focused on practical meal suggestions based on available ingredients and recent activity.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggestion =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate suggestions right now.";

    res.status(200).json({
      suggestion,
      context_used: {
        week_id,
        has_starting_status: !!week?.starting_status,
        recent_shops: week?.shops?.length || 0,
        recent_cooks: week?.cooks?.length || 0,
        available_recipes: recipes.length,
      },
    });
  } catch (error) {
    console.error("Cooking suggestion API error:", error);
    res.status(500).json({error: "Failed to generate cooking suggestions"});
  } finally {
    await prisma.$disconnect();
  }
}
