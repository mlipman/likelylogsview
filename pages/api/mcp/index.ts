import type {NextApiRequest, NextApiResponse} from "next";
import prisma from "../../../lib/prisma";
import {mcpProtocolError, mcpSuccess, mcpError, McpTool, toolToSchema} from "./utils";
import {recipeMcpTools} from "./recipes";

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
          tools: [
            {
              name: "view_projects",
              description:
                "View all cooking projects (prep templates) from the Sgt Chef app",
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
            ...recipeMcpTools.map(toolToSchema),
          ],
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

      if (name === "view_projects") {
        try {
          // Mirror the exact functionality from pages/api/cooking/projects.ts
          const projects = await prisma.project.findMany({
            orderBy: {created_at: "desc"},
          });

          return res.status(200).json({
            jsonrpc: "2.0",
            id: requestId,
            result: {
              content: [
                {
                  type: "text",
                  text: `Found ${projects.length} cooking projects:\n\n${projects
                    .map(project => {
                      return `**${project.title}**\n${
                        project.source ? `Source: ${project.source}\n` : ""
                      }${project.url ? `URL: ${project.url}\n` : ""}${
                        project.content_md ? `Content:\n${project.content_md}\n` : ""
                      }\n---\n`;
                    })
                    .join("\n")}`,
                },
              ],
            },
          });
        } catch (error) {
          console.error("Error fetching projects:", error);
          return res.status(200).json({
            jsonrpc: "2.0",
            id: requestId,
            result: {
              content: [
                {
                  type: "text",
                  text: "Error fetching projects from database",
                },
              ],
              isError: true,
            },
          });
        }
      }

      // Check the various files for a tool of that name
      let tool = recipeMcpTools.find(t => t.name === name);

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
