# Accountability Coach Feature Plan

## Context

Adding a health/fitness accountability coach to the session logging app. Michael is at 205 lbs, targeting 180 lbs at ~1 lb/week. The coach tracks meals, exercise, and weight through free-text session entries (not structured tables). Goals are set in weekly/monthly sessions as free text. The coach is powered by Anthropic API calls with session context loaded automatically, and can write back to sessions via tools. Twilio SMS check-ins at 5 fixed times daily to nudge based on goals.

## Design Philosophy

Sessions are the source of truth. They contain free text — meal descriptions, exercise notes, goals, reflections — plus a structured weight field. The coach chat is a transient conversation that loads recent sessions as context. The LLM interprets goals and logs from free text rather than querying structured tables. This matches the project's semi-structured data philosophy.

## Data Model

**One change to existing model. No new tables.**

### Add `weight_lbs` to `session`

```prisma
model session {
  instance         String   @unique
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  message_list_json String
  context_json     String
  weight_lbs       Decimal? // Weight in pounds
}
```

Usage by period:

- **Day**: Actual weigh-in for that day
- **Week**: 7-day average (set manually)
- **Month**: Ending 7-day average (set manually)

All other health data (meals, exercise, calorie estimates, goals) lives as free text in `message_list_json`.

## Coach Architecture

### How the coach works

1. User opens `/coach` page — a chat interface
2. System loads context: today's daily session, this week's session, this month's session, yesterday's daily session
3. All session `message_list_json` entries + `weight_lbs` values are injected into the system prompt
4. User chats with the coach (Anthropic API call with tool calling)
5. The coach can **add messages to sessions** via an `add_session_message` tool — this is how it persists observations, calorie estimates, summaries, etc.
6. The coach conversation itself is NOT persisted (it's transient). The durable record is what gets written to sessions.

### Coach tools (MCP)

- `add_session_message` — Append a message to a session's message_list_json. Args: `instance` (string), `message` (string). Used by the coach to record calorie estimates, observations, summaries.
- `view_session` — Read a session's messages and weight. Args: `instance` (string). For looking at days other than what's auto-loaded.
- `view_weight_history` — Read weight_lbs from recent daily sessions. Args: `count` (number, default 14). Returns date + weight pairs for trend analysis.

These tools are registered in the MCP server alongside cooking tools, so they're also usable from Claude Desktop.

### System prompt

```
You are an accountability coach for Michael, who is working towards specific health goals.
Your style is direct and honest. You push hard for accountability — you don't sugarcoat and you
don't let excuses slide. Losing weight is hard and for the past few years Michael has been
trying without finding the missing piece to reliably lose tens of pounds and keep it off.
However he has succeeded before. About 8 years ago he gained almost 60 pounds over the course
of a couple years and with lots of tracking, lots of cooking, and lots of saying no
he lost it all slowly and surely and went from over 240 lbs to under 180 lbs.
He's now starting at 205 lbs in mid february 2026 and has a goal to lose one pound per week
until his first child is born in mid august where he wants to be at 180 lbs.

Michael is writing this prompt and is asking you to be the accountability partner he needs.
He controls his actions but your suggestions and your ability to take some of the cognitive
load will go a long way towards achieving success.
He doesn't want you to give in and enable his failure to lose weight, but it's important
to be kind. You should emulate a great coach who is empathetic but still pushes
their student to do what the student couldn't do on their own.

Key facts:
- Current weight goal: 180 lbs (target: ~1 lb/week loss)
- Daily calorie target: adjustable, but probably targeting 1800/day
- Exercise goal: will vary. see daily, weekly, monthly updates.


At time of writing Michael's main exercise is a 40 minute bike ride to and from
work (80 minutes round trip) that he does between 1 and 3 times per week.
He also wants to add in gym sessions at work, either cardio or weights.
In the past he had a lot of success running 5k on the treadmill, especially
working towards getting from like 28 minute 5ks to a 20 minute 5k twice,
each one over a few months.

Michael wants to cook more at home and has a separate project and llm based assistant to help
with that. There might be more functionality for you to pull data from there.

By far the most impactful method michael has found for losing weight is tracking calories.

Use add_session_message to write a message that will show up in future records. Other than that,
this chat is transient.

If you have meta suggestions about how to improve this prompt or how to better employ your
role as a coach, that is also a valid topic of conversation.

{dynamic context: today's session, yesterday's session, this week's session, this month's session, weight history}
```

### Context building (`buildCoachContext`)

Loads and formats into the system prompt:

1. **Today's daily session** — full message_list_json + weight_lbs
2. **Yesterday's daily session** — full message_list_json + weight_lbs
3. **This week's session** — full message_list_json + weight_lbs (goals live here)
4. **This month's session** — full message_list_json + weight_lbs (goals live here)
5. **Weight history** — weight_lbs from last 14 daily sessions that have a weight set
6. **Recent cooks from Sgt Chef** — last few cooks for nutrition cross-reference (via `cookService`)

## Implementation Phases

### Phase 1: Schema + Session Tools

**Files to modify:**

- `prisma/schema.prisma` — Add `weight_lbs Decimal?` to `session` model
- `pages/api/session.ts` — Handle `weight_lbs` in POST upsert. Also fix the existing issue of creating its own PrismaClient (should use shared singleton from `lib/prisma.ts`)
- `pages/api/mcp/index.ts` — Register new session MCP tools

**Files to create:**

- `services/sessions.ts` — Session service with: `findByInstance`, `upsert`, `appendMessage`, `setWeight`, `getWeightHistory(count)`. The `appendMessage` method parses `message_list_json`, appends, and saves.
- `pages/api/mcp/sessions.ts` — MCP tools: `add_session_message`, `view_session`, `view_weight_history`

**Then run:** `npx prisma db push && npx prisma generate`, restart dev server

### Phase 2: Coach Chat API

**Files to create:**

- `pages/api/coach/chat.ts` — Coach chat endpoint with:
  - `buildCoachContext()` function (loads sessions + weight history + recent cooks)
  - Coach system prompt constant
  - Same Anthropic API calling pattern as `pages/api/chat.ts` (`fetchAnthropicResponse` + tool calling loop)
  - Tools available: session tools + cooking read-only tools (view_all_recipes, view_cooks, etc.)

**Key reference:** `pages/api/chat.ts` lines 184-237 for `fetchAnthropicResponse`, lines 264-343 for the tool calling loop. These patterns get cloned into the coach chat endpoint.

### Phase 3: Coach Page UI

**Files to create:**

- `pages/coach.tsx` — Coach page with:
  - **Dashboard area**: today's weight (from session), today's session messages (rendered as log entries), quick weight input
  - **Chat area**: transient coach conversation, input box, send button
  - Chat renders `ConversationItem[]` responses (text + tool call results)
  - Weight input calls `set_session_weight` tool or directly PUTs to session API

**Files to modify:**

- `pages/index.tsx` — Add "Coach" button to home page navigation

**Patterns to reuse:**

- Chat UI from `pages/cooking/index.tsx` (sendChatMessage pattern, ConversationItem rendering)
- `components/ImageUpload.tsx` for meal photos (future enhancement)
- `utils/dates.ts` — `dateToInstanceNum` for computing today's/yesterday's instance strings

### Phase 4: Session Page Weight UI

**Files to modify:**

- `pages/session/[period]/[instanceNum].tsx` — Add weight input field. For daily sessions: numeric input to set today's weight. For weekly/monthly: same field for averages. Saves via session API. Display current weight if set.

### Phase 5: SMS via Twilio

**New dependency:** `twilio` npm package

**Environment variables:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `MY_PHONE_NUMBER`, `CRON_SECRET`

**Files to create:**

- `vercel.json` — Cron configuration for 5 daily check-ins (Central Time):

  ```json
  {
    "crons": [
      {"path": "/api/cron/coach-checkin", "schedule": "0 13 * * *"},
      {"path": "/api/cron/coach-checkin", "schedule": "0 16 * * *"},
      {"path": "/api/cron/coach-checkin", "schedule": "0 19 * * *"},
      {"path": "/api/cron/coach-checkin", "schedule": "0 23 * * *"},
      {"path": "/api/cron/coach-checkin", "schedule": "0 2 * * *"}
    ]
  }
  ```

  (7am CT = 13 UTC, 10am = 16 UTC, 1pm = 19 UTC, 5pm = 23 UTC, 8pm = 2 UTC next day)
  Note: CT is UTC-6 in winter (CST) and UTC-5 in summer (CDT). These times target CST. May need seasonal adjustment or a timezone-aware approach.

- `pages/api/cron/coach-checkin.ts` — Cron endpoint:

  1. Verify `CRON_SECRET` auth header
  2. Load today's daily session, this week's session, this month's session
  3. Call Anthropic API with a "should I text?" prompt: system prompt includes the sessions + goals, asks the LLM to decide whether a text is warranted and what to say
  4. If LLM says yes, send SMS via Twilio
  5. If LLM says no, do nothing
  6. The LLM should respect "don't text me until X" type notes in sessions

- `pages/api/coach/sms-webhook.ts` — Inbound SMS handler:
  1. Validate Twilio request signature
  2. Extract message body
  3. Run through coach chat (buildCoachContext + LLM + tools)
  4. Send coach response back as SMS via Twilio
  5. Use `add_session_message` to persist the exchange to today's daily session

### Phase 6: Polish (future, not part of this implementation)

- Weight trend chart on coach page (recharts)
- Photo-based calorie estimation via Anthropic vision API
- Calendar integration showing health logging activity
- Weekly/monthly auto-summaries generated by coach

## Key Architectural Decisions

| Decision                      | Choice                            | Rationale                                                                   |
| ----------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| Data model                    | weight_lbs on session + free text | Simpler; LLM interprets free text; add structure later if needed            |
| No MealLog/ExerciseLog tables | Free text in sessions             | Avoids premature structuring; matches project philosophy                    |
| Coach chat persistence        | Transient (not saved)             | Durable data written to sessions via tools; coach conversation is ephemeral |
| Coach endpoint                | Separate from Sgt Chef            | Different system prompt, context, and tool set                              |
| Cron frequency                | 5x daily at fixed times           | ~$0.05/day; good coverage of key moments                                    |
| SMS decisions                 | LLM-based                         | Goals are free text so need LLM to interpret them                           |

## Critical Reference Files

- `prisma/schema.prisma` — Add weight_lbs field (line 38-44, session model)
- `services/recipes.ts` — Service class pattern to follow
- `pages/api/session.ts` — Existing session CRUD to extend with weight_lbs
- `pages/api/mcp/utils.ts` — McpTool type, `stringArgument`, `idArgument`, `toolToSchema`
- `pages/api/mcp/index.ts` — Where to register new tools
- `pages/api/chat.ts` — `fetchAnthropicResponse` (line 184) + tool loop (line 264) to replicate
- `pages/cooking/index.tsx` — Chat UI pattern to replicate for coach page
- `utils/dates.ts` — `dateToInstanceNum` for computing session instance strings
- `lib/prisma.ts` — Shared Prisma singleton + `NON_CONTENT_FIELDS`

## Verification

1. **Phase 1**: `npx prisma db push && npx prisma generate && npm run build`. Test session weight via curl. Test MCP tools via Claude Desktop (`add_session_message`, `set_session_weight`, `view_weight_history`).
2. **Phase 2**: `npm run build`. Test coach chat via curl POST to `/api/coach/chat`. Verify context includes sessions and weight history.
3. **Phase 3**: `npm run dev`. Open `/coach` page, chat with coach, verify weight input works, verify tool calls persist to sessions.
4. **Phase 4**: Test weight input on session pages for day/week/month.
5. **Phase 5**: Deploy to Vercel. Configure Twilio webhook. Send test SMS and verify round-trip.
