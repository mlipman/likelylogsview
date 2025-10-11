import type {NextApiRequest, NextApiResponse} from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for MCP protocol
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({error: `Method ${req.method} Not Allowed`});
  }

  try {
    const {method, params, id} = req.body;

    // Handle MCP protocol methods manually
    if (method === "initialize") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id,
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
        id,
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
          ],
        },
      });
    }

    if (method === "initialized") {
      // Handle initialized notification - this is expected after initialize
      return res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: {},
      });
    }

    if (method === "notifications/initialized") {
      // Handle initialized notification (alternative format)
      return res.status(200).end();
    }

    if (method === "tools/call") {
      const {name, arguments: _args} = params;

      if (name === "view_projects") {
        try {
          // Mirror the exact functionality from pages/api/cooking/projects.ts
          const projects = await prisma.project.findMany({
            orderBy: {created_at: "desc"},
          });

          return res.status(200).json({
            jsonrpc: "2.0",
            id,
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
            id,
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

      return res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`,
        },
      });
    }

    // Method not supported
    return res.status(400).json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  } catch (error) {
    console.error("MCP API error:", error);
    return res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
