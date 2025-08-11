# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Our plan is in PLAN.md

## Development Commands

- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`
- **Database operations**:
  - `npx prisma db push` to update database schema
  - `npx prisma generate` to regenerate Prisma client
  - Always restart `npm run dev` after database changes

## Architecture Overview

This is a Next.js application with a PostgreSQL database using Prisma ORM.
The current focus for this development session is the cooking app including the pages and api endpoints under /cooking

### Key Components:

- **Database Models**: to be added / changed
- **API Routes**: Located in `pages/api/`
- **Image Handling**: Cloudinary integration for photo uploads and storage

### Important Patterns:

- Database connection uses Prisma Client (`lib/prisma.ts`)
- Image utilities handle Cloudinary URL generation (`utils/imageUtils.ts`)
- API endpoints follow RESTful patterns with proper error handling
- TypeScript strict mode enabled with comprehensive type checking

### Environment Variables Required:

- `DEV_DB_URL`: PostgreSQL database connection string
- `OPEN_AI_KEY`: OpenAI API key for chat functionality
- Cloudinary configuration for image handling

### Important Context:

I (michael) am a software engineer who cares deeply about clean code, especially on data model and business logic.
I'm not super familiar with typescript, but it's very important to me that we adhere strictly to using types basically everywhere.
The data model in terms of db tables is also super important to me and I will be reviewing every model and every field deeply.
I want to develop this project with AI coding tools like claude code to make adding new pages and routine functionality much faster,
but I still want to have a deep understanding of the theory of the product in the Peter Naur sense of programming as theory building.
For front-end styling and layout, I'm totally happy to vibe code and leave that to the coding agent.
This app should work well on both phone and laptop. It should look very nice and professional with a high effort clean looking aestecic design,
but nothing over the top like parallax scrolling or silly effects. Functional and pleasant to use and look at.
This app is a personal project meant to be used only by me.

### ts Style:

Here's a sample to match the linter.

```
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
```

### sgt chef overview and notes

the cooking app is called sgt chef (like a private chef that's been promoted)
and the idea is to relieve a lot of the cognitive load that can make cooking and meal prep difficult.
it comes at this with a few novel insights:
first, an app that can access AI models can do way more with natural language and semi-structured data compared with
applications from a few years ago that relied on strict rules for features like "what can i cook with the ingredients in my fridge"
so a common user entry point can be as simple as "what should i cook"
and then the app will fetch a bunch of contextual info about the user's current state of ingredients and recipes and preferences,
send it to an llm and get back a list of options. each option might be a on-the-fly created recipe or a choice from a pre-created list
the user can browse the choices, select one and optionally provide natural language feedback to refine that.
at some point, the user will move from planning mode to active mode, which in this case means they start cooking.
the main interaction at this point is to let the user record the results, so for cooking a meal this means text or images about what they made
how it went and if they liked it.

so in sum, this app will store semi-structured data. support interactions where that data is fetched and sent to an llm for other semi-structured output.
let the user interact with that output and the llm.

the user has two main modes: plan and act. plan is browsing and chatting to decide what they want to do. act is doing it and recording how it went.

the plan and act paradigm exists across three main functions: Shop, Prep, and Cook.

Shop is going to the store and buying groceries. the output of plan is a shopping list. the output of act is a Shop, ie having bought a bunch of groceries.
Prep is doing a cooking project that produces ingredients to be used at another time. the output of plan is essentially a recipe, or a list of ingredients, steps, and techiniques.
the output of act is basically an ingredient that can be used to cook a meal.
Cook is producing a meal to be eaten. the output of plan could be a traditional recipe with very defined ingredients and times etc or a no-recipe-recipe,
where it's general techniques and suggestions. the output of act is the meal, recorded as pictures or text about how it tasted etc.

there are broadly two types of ~models - ones that are long lived and ones that are tied to a week.

Long Lived Models
Staples: this will be hardcoded in the app as text, not recorded in the db because it will not frequently change.
Recipes: at some point we will want easy ways to add new recipes. the simplest is just pasting/typing in a block of markdown text. future ideas: input a yt link or nyt cooking link and have the system auto expand it into a full fledged recipe.
a Recipe is an input to a Cook. meaning it's something that will produce a meal to be eaten.
whereas the anaolog for a Prep is a Project. A Project is similar to a Recipe but could be like make pizza dough, or roast some veggies, or braise a chuck roast.

so the long lived models are Recipes and Projects (plus a hard coded Staples textblock)

maybe a future project will add in some sort of Reviews or Preferences model, but let's avoid that for now

Short Lived Models
we will also have things that are tied to a specific week.
Shop, Prep, and Cook are all things that are tied to a week. they will also have an occurred_at timestamp so we can be more specific,
but the main operational unit of the program will be a week (Saturday throught Friday) so all Shops, Preps, and Cooks will be tied to exactly one week.
As mentioned above, a Cook probably starts with a Recipe. Or some deriviative, maybe while you're in planning phase you're remixing multiple Recipes with
notes and adjustments and chat messages to create a Cook Plan which is just text idk but maybe has some Cook devleopment_history which is a more verbose log
of the recipes considered and chat messages. This does not have to be perfectly relational. I want to leverage the idea that we should store lots of data in free text
and rely on our ability to use llms to process that if needed. I also have 0 problem duplicating the text from a Recipe onto a Cook in fact I prefer that to a
very normalized paradigm where the Cook would only have a recipe_id. And in the same way a Prep has a connection to a Project.
The last model that is tied to a week is a StartingStatus. This is a state of ingredients as of thursday or friday of the previous week that will inform
the upcoming week. There are two main types of updates in a StartingStatus: carryover, ie leftover from shops, cooks or preps from the previous week or before
that are still available. In other words extra assets that can be used. and secondly deficiencies which are staples that i usually have but am low or out of this week.
