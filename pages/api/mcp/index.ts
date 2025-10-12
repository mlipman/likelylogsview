import type {NextApiRequest, NextApiResponse} from "next";
import prisma from "../../../lib/prisma";
import {recipeService, recipeToString} from "../../../services/recipes";

/**
 * MCP (Model Context Protocol) utility functions for consistent responses
 */

interface McpResponse {
  jsonrpc: "2.0";
  id: string;
  result?: {
    content: Array<{
      type: "text";
      text: string;
    }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Create a successful MCP response
 */
function mcpSuccess(requestId: string, text: string): McpResponse {
  return {
    jsonrpc: "2.0",
    id: requestId,
    result: {
      content: [
        {
          type: "text",
          text,
        },
      ],
    },
  };
}

/**
 * Create an error MCP response (using result format with isError flag)
 */
function mcpError(requestId: string, message: string): McpResponse {
  return {
    jsonrpc: "2.0",
    id: requestId,
    result: {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
      isError: true,
    },
  };
}

/**
 * Create a protocol-level error MCP response
 */
function mcpProtocolError(
  requestId: string,
  code: number,
  message: string,
  data?: any
): McpResponse {
  return {
    jsonrpc: "2.0",
    id: requestId,
    error: {
      code,
      message,
      data,
    },
  };
}

/**
 * Wrapper function that handles try/catch and returns appropriate MCP response
 */
async function mcpHandler(
  requestId: string,
  operation: () => Promise<string>
): Promise<McpResponse> {
  try {
    const text = await operation();
    return mcpSuccess(requestId, text);
  } catch (error) {
    console.error("MCP operation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return mcpError(requestId, `Error: ${message}`);
  }
}

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
            {
              name: "view_all_recipes",
              description: "View all cooking recipes from the Sgt Chef app",
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
            {
              name: "create_recipe",
              description: "Create a new cooking recipe in the Sgt Chef app",
              inputSchema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The recipe title",
                  },
                  content_md: {
                    type: "string",
                    description: "The recipe content in markdown format",
                  },
                  source: {
                    type: "string",
                    description: "The source of the recipe (optional)",
                  },
                  url: {
                    type: "string",
                    description: "URL to the original recipe (optional)",
                  },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
            {
              name: "update_recipe",
              description: "Update an existing cooking recipe in the Sgt Chef app",
              inputSchema: {
                type: "object",
                properties: {
                  id: {
                    type: "number",
                    description: "The recipe ID to update",
                  },
                  title: {
                    type: "string",
                    description: "The recipe title",
                  },
                  content_md: {
                    type: "string",
                    description: "The recipe content in markdown format",
                  },
                  source: {
                    type: "string",
                    description: "The source of the recipe",
                  },
                  url: {
                    type: "string",
                    description: "URL to the original recipe",
                  },
                },
                required: ["id"],
                additionalProperties: false,
              },
            },
            {
              name: "delete_recipe",
              description: "Delete a cooking recipe from the Sgt Chef app",
              inputSchema: {
                type: "object",
                properties: {
                  id: {
                    type: "number",
                    description: "The recipe ID to delete",
                  },
                },
                required: ["id"],
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

      if (name === "view_all_recipes") {
        const response = await mcpHandler(requestId, async () => {
          const recipes = await recipeService.findMany();
          return recipeService.allRecipes(recipes);
        });
        return res.status(200).json(response);
      }

      if (name === "create_recipe") {
        const {title, content_md, source, url} = args;
        const response = await mcpHandler(requestId, async () => {
          const newRecipe = await recipeService.create({title, content_md, source, url});
          return `Successfully created recipe:\n\n${recipeToString(newRecipe)}`;
        });
        return res.status(200).json(response);
      }

      if (name === "update_recipe") {
        const {id: recipeId, title, content_md, source, url} = args;
        const response = await mcpHandler(requestId, async () => {
          const updatedRecipe = await recipeService.update(recipeId, {
            title,
            content_md,
            source,
            url,
          });
          return `Successfully updated recipe:\n\n${recipeToString(updatedRecipe)}`;
        });
        return res.status(200).json(response);
      }

      if (name === "delete_recipe") {
        const {id: recipeId} = args;
        const response = await mcpHandler(requestId, async () => {
          const deletedRecipe = await recipeService.delete(recipeId);
          return `Successfully deleted recipe:\n\n${recipeToString(deletedRecipe)}`;
        });
        return res.status(200).json(response);
      }

      return res
        .status(400)
        .json(mcpProtocolError(requestId, -32602, `Unknown tool: ${name}`));
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
