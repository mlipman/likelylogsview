# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
