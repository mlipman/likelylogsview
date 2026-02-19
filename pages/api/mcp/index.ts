import type {NextApiRequest, NextApiResponse} from "next";
import {mcpProtocolError, mcpSuccess, mcpError, toolToSchema} from "./utils";
import {recipeMcpTools} from "./recipes";
import {projectMcpTools} from "./projects";
import {weekMcpTools} from "./weeks";
import {shopMcpTools} from "./shops";
import {cookMcpTools} from "./cooks";
import {prepMcpTools} from "./preps";
import {sessionMcpTools} from "./sessions";
const allTools = [
  ...projectMcpTools,
  ...recipeMcpTools,
  ...weekMcpTools,
  ...shopMcpTools,
  ...cookMcpTools,
  ...prepMcpTools,
  ...sessionMcpTools,
];
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for MCP protocol
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({error: `Method ${req.method} Not Allowed`});
  }

  try {
    const {method, params, id: requestId} = req.body;

    // Handle MCP protocol methods manually
    if (method === "initialize") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "likelylogs-cooking",
            version: "1.0.0",
          },
        },
      });
    }

    if (method === "tools/list") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          tools: allTools.map(toolToSchema),
        },
      });
    }

    if (method === "initialized") {
      // Handle initialized notification - this is expected after initialize
      return res.status(200).json({
        jsonrpc: "2.0",
        id: requestId,
        result: {},
      });
    }

    if (method === "notifications/initialized") {
      // Handle initialized notification (alternative format)
      return res.status(200).end();
    }

    if (method === "tools/call") {
      const {name, arguments: args} = params;

      const tool = allTools.find(t => t.name === name);

      if (tool) {
        try {
          const result = await tool.handler(args);
          return res.status(200).json(mcpSuccess(requestId, result));
        } catch (error) {
          console.error("MCP tool error:", error);
          const message = error instanceof Error ? error.message : String(error);
          const response = mcpError(requestId, `Error: ${message}`);
          return res.status(200).json(response);
        }
      } else {
        return res
          .status(400)
          .json(mcpProtocolError(requestId, -32602, `Unknown tool: ${name}`));
      }
    }

    // Method not supported
    return res
      .status(400)
      .json(mcpProtocolError(requestId, -32601, `Method not found: ${method}`));
  } catch (error) {
    console.error("MCP API error:", error);
    const errorData = error instanceof Error ? error.message : String(error);
    return res
      .status(500)
      .json(mcpProtocolError(req.body.id || "", -32603, "Internal error", errorData));
  }
}
