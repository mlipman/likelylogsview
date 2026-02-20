import type {NextApiRequest, NextApiResponse} from "next";
import {McpTool} from "../mcp/utils";
import {sessionMcpTools} from "../mcp/sessions";
import {recipeMcpTools} from "../mcp/recipes";
import {cookMcpTools} from "../mcp/cooks";
import {sessionService} from "../../../services/sessions";
import {dateToInstanceNum} from "../../../utils/dates";
import {addDays, getISOWeek, getISOWeekYear} from "date-fns";
import prisma from "../../../lib/prisma";
import {streamAnthropicChat} from "../../../lib/streaming";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Coach has access to session tools + read-only cooking tools
const coachTools: McpTool[] = [
  ...sessionMcpTools,
  // Include read-only cooking tools so coach can see recipes and cooks
  ...recipeMcpTools.filter(t => t.name === "view_all_recipes"),
  ...cookMcpTools.filter(t => t.name === "view_cooks"),
];

async function callTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = coachTools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`Coach Tool Error: Unknown tool: ${toolName}`);
  }

  const result = await tool.handler(args);
  return result;
}

function formatSessionForContext(
  label: string,
  instance: string,
  session: {message_list_json: string; weight_lbs: any} | null
): string {
  const parts: string[] = [];
  parts.push(`## ${label} (${instance})`);

  if (!session) {
    parts.push("No session found.");
    parts.push("");
    return parts.join("\n");
  }

  if (session.weight_lbs) {
    parts.push(`Weight: ${session.weight_lbs} lbs`);
  }

  const messages = JSON.parse(session.message_list_json) as {
    role: string;
    content: string;
  }[];
  if (messages.length > 0) {
    for (const msg of messages) {
      parts.push(`[${msg.role}]: ${msg.content}`);
    }
  } else {
    parts.push("No messages.");
  }

  parts.push("");
  return parts.join("\n");
}

async function buildCoachContext(): Promise<string> {
  // Use Chicago timezone for all date calculations
  const chicagoNow = new Date(
    new Date().toLocaleString("en-US", {timeZone: "America/Chicago"})
  );
  const now = chicagoNow;
  const yesterday = addDays(now, -1);

  const todayInstance = `day${dateToInstanceNum(now, "day")}`;
  const yesterdayInstance = `day${dateToInstanceNum(yesterday, "day")}`;
  const weekInstance = `week${getISOWeekYear(now)}${String(getISOWeek(now)).padStart(2, "0")}`;
  const monthInstance = `month${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  // e.g. "Thursday, February 19, 2026, 3:45:12 PM"
  const chicagoDateTimeStr = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const [
    todaySession,
    yesterdaySession,
    weekSession,
    monthSession,
    weightHistory,
    recentCooks,
  ] = await Promise.all([
    sessionService.findByInstance(todayInstance),
    sessionService.findByInstance(yesterdayInstance),
    sessionService.findByInstance(weekInstance),
    sessionService.findByInstance(monthInstance),
    sessionService.getWeightHistory(14),
    prisma.cook.findMany({
      orderBy: {created_at: "desc"},
      take: 5,
      include: {recipe: {select: {title: true}}},
    }),
  ]);

  const parts: string[] = [];

  parts.push("## Current Date & Time");
  parts.push(`${chicagoDateTimeStr} (Chicago)`);
  parts.push(`Day: ${todayInstance} | Week: ${weekInstance} | Month: ${monthInstance}`);
  parts.push("");

  parts.push(formatSessionForContext("Today", todayInstance, todaySession));
  parts.push(formatSessionForContext("Yesterday", yesterdayInstance, yesterdaySession));
  parts.push(formatSessionForContext("This Week", weekInstance, weekSession));
  parts.push(formatSessionForContext("This Month", monthInstance, monthSession));

  // Weight history
  if (weightHistory.length > 0) {
    parts.push("## Weight History (recent)");
    for (const h of weightHistory) {
      parts.push(`${h.instance}: ${h.weight_lbs} lbs`);
    }
    const latest = Number(weightHistory[0].weight_lbs);
    const goal = 180;
    const remaining = latest - goal;
    parts.push(
      `\nCurrent: ${latest} lbs | Goal: ${goal} lbs | To lose: ${remaining.toFixed(1)} lbs`
    );
    parts.push("");
  }

  // Recent cooks from Sgt Chef
  if (recentCooks.length > 0) {
    parts.push("## Recent Home Cooking (from Sgt Chef)");
    for (const cook of recentCooks) {
      const title = cook.recipe?.title || "Freestyle";
      const date = cook.occurred_at
        ? cook.occurred_at.toISOString().split("T")[0]
        : "no date";
      parts.push(`- ${title} (${date})${cook.outcome_md ? `: ${cook.outcome_md}` : ""}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

const COACH_SYSTEM_PROMPT = `You are an accountability coach for Michael, who is working towards specific health goals.
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

Other facts: Michael is 34 years old. 5 ft 10 in. Married for 3 years to his wife Rachel who is pregnant.
They live in Chicago.

Michael wants to cook more at home and has a separate project and llm based assistant to help
with that. There might be more functionality for you to pull data from there.

By far the most impactful method michael has found for losing weight is tracking calories.

Use add_session_message sparingly — only for genuinely important factual records: specific foods
eaten with calorie estimates, exercise completed, or weight logged. Do not add session notes for
general conversation, acknowledgments, check-ins without concrete data, or to confirm you heard
something. Do not add a note unless there is a concrete fact worth persisting. Prioritize
recording in the day session; use week or month sessions only for summaries that span those
periods. Other than saved notes, this chat is transient.

If you have meta suggestions about how to improve this prompt or how to better employ your
role as a coach, that is also a valid topic of conversation.

Here is the current context:

`;

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext} = req.body;

    const coachContext = await buildCoachContext();
    const systemPrompt = COACH_SYSTEM_PROMPT + coachContext;

    // Filter out system messages and map to Anthropic format
    const messages = (messagesWithContext as Message[])
      .filter(msg => msg.role !== "system")
      .map(msg => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      }));

    await streamAnthropicChat({
      systemPrompt,
      messages,
      tools: coachTools,
      res,
      callTool,
    });
  } catch (error) {
    console.error("Coach chat error:", error);
    // If headers haven't been sent yet, we can still return JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        error: `Failed to process coach chat request: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    // Otherwise the error was already streamed via SSE
  }
}
