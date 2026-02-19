/**
 * MCP tools for Session entity - used by coach and MCP server
 */

import {sessionService} from "../../../services/sessions";
import {McpTool, stringArgument} from "./utils";

const addSessionMessage: McpTool = {
  name: "add_session_message",
  description:
    "Append a message to a session's log. Used to persist observations, calorie estimates, or summaries that should show up in future context.",
  arguments: [
    stringArgument("instance", "The session instance key (e.g. day2026049, week202608, month202602)", true),
    stringArgument("message", "The message text to append", true),
  ],
  handler: async (args: {instance: string; message: string}): Promise<string> => {
    const {instance, message} = args;
    const updated = await sessionService.appendMessage(instance, message);
    const messages = JSON.parse(updated.message_list_json);
    return `Message appended to session ${instance}. Session now has ${messages.length} messages.`;
  },
};

const viewSession: McpTool = {
  name: "view_session",
  description: "Read a session's messages and weight",
  arguments: [
    stringArgument("instance", "The session instance key (e.g. day2026049, week202608, month202602)", true),
  ],
  handler: async (args: {instance: string}): Promise<string> => {
    const {instance} = args;
    const session = await sessionService.findByInstance(instance);
    if (!session) {
      return `No session found for instance: ${instance}`;
    }
    return sessionService.sessionToString(session);
  },
};

const viewWeightHistory: McpTool = {
  name: "view_weight_history",
  description: "Read weight_lbs from recent daily sessions that have a weight set. Returns date + weight pairs for trend analysis.",
  arguments: [
    {
      name: "count",
      type: "number",
      required: false,
      description: "Number of recent weigh-ins to return (default 14)",
    },
  ],
  handler: async (args: {count?: number}): Promise<string> => {
    const count = args.count || 14;
    const history = await sessionService.getWeightHistory(count);
    if (history.length === 0) {
      return "No weight history found.";
    }
    const lines = history.map(h => `${h.instance}: ${h.weight_lbs} lbs`);
    return `Weight history (${history.length} entries, most recent first):\n${lines.join("\n")}`;
  },
};

export const sessionMcpTools: McpTool[] = [
  addSessionMessage,
  viewSession,
  viewWeightHistory,
];
