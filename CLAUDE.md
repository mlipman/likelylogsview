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

This is a Next.js application with a PostgreSQL database using Prisma ORM. The app appears to be a logging/journaling system with AI chat capabilities.

### Key Components:
- **Database Models**: `log`, `conversation`, `session` (defined in `prisma/schema.prisma`)
- **API Routes**: Located in `pages/api/` including logs, chat, photos, conversation endpoints
- **Frontend Pages**: Session-based navigation (`/session/[period]/[instanceNum]`), logs view, coach chat
- **Image Handling**: Cloudinary integration for photo uploads and storage

### Core Functionality:
- **Logging System**: Users can create logs with text content and optional images
- **AI Chat Interface**: ChatInterface component for conversational interactions with OpenAI
- **Session Management**: Time-based sessions (day/week/month) with instance numbers
- **Image Processing**: Cloudinary for image storage with blur placeholders and URL generation

### Important Patterns:
- Database connection uses Prisma Client (`lib/prisma.ts`)
- Image utilities handle Cloudinary URL generation (`utils/imageUtils.ts`)
- Date utilities manage session periods and instance numbers (`utils/dates.ts`)
- API endpoints follow RESTful patterns with proper error handling
- TypeScript strict mode enabled with comprehensive type checking

### Environment Variables Required:
- `DEV_DB_URL`: PostgreSQL database connection string
- `OPEN_AI_KEY`: OpenAI API key for chat functionality
- Cloudinary configuration for image handling