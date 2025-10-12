/**
 * MCP (Model Context Protocol) types and utilities
 */

// =============================================================================
// Core Protocol Types
// =============================================================================

/**
 * Standard MCP JSON-RPC 2.0 response format
 */
export interface McpResponse {
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
 * MCP tool schema for tools/list endpoint
 */
export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
    required: string[];
    additionalProperties: false;
  };
}

// =============================================================================
// Application Definitions of Tools and Arguments
// This is the format used by files in the application to expose and define
// their function signatures.
// =============================================================================

export interface McpTool {
  name: string;
  description: string;
  arguments: McpArgument[];
  handler: McpToolHandler;
}

export interface McpArgument {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "number" | "boolean";
}

/**
 * MCP tool handler function signature - returns plain string.
 * The arguments that are the input to this function are found
 * in the arguments field of the McpTool
 */
export type McpToolHandler = (args: any) => Promise<string>;
// Argument Factory Functions

export const idArgument = (): McpArgument => ({
  name: "id",
  type: "number",
  required: true,
  description: "unique identifier",
});

export const stringArgument = (
  name: string,
  description: string,
  required: boolean
): McpArgument => ({
  name,
  type: "string",
  description,
  required,
});

// =============================================================================
// Schema Utilities
// =============================================================================

type McpInputProperty = {
  type: "string" | "number" | "boolean";
  description: string;
};

type McpInputProperties = Record<string, McpInputProperty>;

/**
 * Convert MCP tool definition to schema format for tools/list
 */
export const toolToSchema = (tool: McpTool): McpToolSchema => {
  const {name, description} = tool;
  const properties = tool.arguments.reduce<McpInputProperties>((record, arg) => {
    record[arg.name] = {
      type: arg.type,
      description: arg.description,
    };
    return record;
  }, {});
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      additionalProperties: false,
      required: tool.arguments.filter(a => a.required).map(a => a.name),
    },
  };
};

// =============================================================================
// Response Factory Functions
// =============================================================================

/**
 * Create a successful MCP response
 */
export function mcpSuccess(requestId: string, text: string): McpResponse {
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
export function mcpError(requestId: string, message: string): McpResponse {
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
export function mcpProtocolError(
  requestId: string,
  code: number,
  message: string,
  data?: string
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
