import type {NextApiRequest, NextApiResponse} from "next";
import {toolToSchema, McpTool} from "../mcp/utils";
import {sessionMcpTools} from "../mcp/sessions";
import {recipeMcpTools} from "../mcp/recipes";
import {cookMcpTools} from "../mcp/cooks";
import {sessionService} from "../../../services/sessions";
import {dateToInstanceNum} from "../../../utils/dates";
import {addDays, getISOWeek, getISOWeekYear} from "date-fns";
import prisma from "../../../lib/prisma";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ConversationItem {
  type: "text" | "tool_call";
  content?: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
}

interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
    name?: string;
    input?: any;
    id?: string;
  }>;
  stop_reason?: string;
  error?: {
    message: string;
  };
}

// Coach has access to session tools + read-only cooking tools
const coachTools: McpTool[] = [
  ...sessionMcpTools,
  // Include read-only cooking tools so coach can see recipes and cooks
  ...recipeMcpTools.filter(t => t.name === "view_all_recipes"),
  ...cookMcpTools.filter(t => t.name === "view_cooks"),
];

async function callTool(toolName: string, args: any = {}): Promise<any> {
  const tool = coachTools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`Coach Tool Error: Unknown tool: ${toolName}`);
  }

  try {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    console.error("Coach tool error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Coach Tool Error: ${message}`);
  }
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
  const now = new Date();
  const yesterday = addDays(now, -1);

  const todayInstance = `day${dateToInstanceNum(now, "day")}`;
  const yesterdayInstance = `day${dateToInstanceNum(yesterday, "day")}`;
  const weekInstance = `week${getISOWeekYear(now)}${String(getISOWeek(now)).padStart(2, "0")}`;
  const monthInstance = `month${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

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

Use add_session_message to write a message that will show up in future records. Other than that,
this chat is transient.

If you have meta suggestions about how to improve this prompt or how to better employ your
role as a coach, that is also a valid topic of conversation.

Here is the current context:

`;

async function fetchAnthropicResponse(
  systemPrompt: string,
  messagesWithContext: Message[]
): Promise<AnthropicResponse> {
  console.log("🤖 Coach LLM request...", {
    messageCount: messagesWithContext.length,
    lastMessage:
      messagesWithContext[messagesWithContext.length - 1]?.content?.substring(0, 100) +
      "...",
  });

  const messages = messagesWithContext.map(msg => ({
    role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      messages: messages,
      max_tokens: 10000,
      tools: coachTools.map(tool => {
        const schema = toolToSchema(tool);
        return {
          name: schema.name,
          description: schema.description,
          input_schema: schema.inputSchema,
        };
      }),
    }),
  });

  const data: AnthropicResponse = await response.json();

  if (!response.ok) {
    console.error("❌ Coach LLM request failed:", data.error?.message);
    throw new Error(data.error?.message || "Failed to get response from Anthropic");
  }

  console.log("✅ Coach LLM response received", {
    stopReason: data.stop_reason,
    contentItems: data.content.length,
    contentTypes: data.content.map(item => item.type),
  });

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messagesWithContext} = req.body;
    const conversationItems: ConversationItem[] = [];

    const coachContext = await buildCoachContext();
    const systemPrompt = COACH_SYSTEM_PROMPT + coachContext;

    // Filter out system messages from the client
    const userMessages = messagesWithContext.filter(
      (msg: Message) => msg.role !== "system"
    );

    let currentMessages = [...userMessages];

    // Tool calling loop
    let loopCount = 0;
    while (true) {
      loopCount++;
      console.log(`Coach conversation loop ${loopCount}`);

      const response = await fetchAnthropicResponse(systemPrompt, currentMessages);

      let hasToolUse = false;
      let textContent = "";

      for (const contentItem of response.content) {
        if (contentItem.type === "tool_use" && contentItem.name) {
          hasToolUse = true;

          console.log("🔧 Coach executing tool:", {
            name: contentItem.name,
            input: contentItem.input,
            id: contentItem.id,
          });

          const toolResult = await callTool(contentItem.name, contentItem.input || {});

          console.log("✅ Coach tool completed:", {
            name: contentItem.name,
            outputLength: JSON.stringify(toolResult).length,
          });

          conversationItems.push({
            type: "tool_call",
            tool_name: contentItem.name,
            tool_input: contentItem.input || {},
            tool_output: toolResult,
          });

          currentMessages.push({
            role: "assistant",
            content: JSON.stringify({
              type: "tool_use",
              name: contentItem.name,
              input: contentItem.input,
              id: contentItem.id,
            }),
          });

          currentMessages.push({
            role: "user",
            content: JSON.stringify({
              type: "tool_result",
              tool_use_id: contentItem.id,
              content: toolResult.content || [{type: "text", text: String(toolResult)}],
            }),
          });
        } else if (contentItem.type === "text" && contentItem.text) {
          textContent += contentItem.text;
        }
      }

      if (textContent.trim()) {
        conversationItems.push({
          type: "text",
          content: textContent.trim(),
        });
      }

      if (!hasToolUse || response.stop_reason === "end_turn") {
        console.log("Coach conversation complete", {
          totalLoops: loopCount,
          conversationItems: conversationItems.length,
          stopReason: response.stop_reason,
        });
        break;
      }
    }

    if (conversationItems.length === 0) {
      conversationItems.push({
        type: "text",
        content: "I couldn't process your request properly.",
      });
    }

    return res.status(200).json({
      conversation: conversationItems,
    });
  } catch (error) {
    console.error("Coach chat error:", error);
    return res.status(500).json({
      error: `Failed to process coach chat request: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
