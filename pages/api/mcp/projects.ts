/**
 * MCP tools for Project entity
 */

import {projectService, projectToString, ProjectContent} from "../../../services/projects";
import {McpTool, stringArgument, idArgument} from "./utils";
import {EntityStatus} from "@prisma/client";

const viewAllProjects: McpTool = {
  name: "view_projects",
  description: "View all cooking projects (prep templates) from the Sgt Chef app",
  arguments: [],
  handler: async (): Promise<string> => {
    const projects = await projectService.findMany();
    return projectService.allProjects(projects);
  },
};

const createProject: McpTool = {
  name: "create_project",
  description: "Create a new cooking project in the Sgt Chef app",
  arguments: [
    stringArgument("title", "The project title", true),
    stringArgument("summary", "A brief summary of the project", false),
    stringArgument("content_md", "The project content in markdown format", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
    stringArgument("source", "The source of the project", false),
    stringArgument("url", "URL to the original project", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
  ],
  handler: async (args: {
    title: string;
    summary?: string;
    content_md?: string;
    details?: string;
    source?: string;
    url?: string;
    status?: string;
  }): Promise<string> => {
    const {title, summary, content_md, details, source, url, status} = args;
    const data: ProjectContent = {
      title,
      summary: summary || null,
      content_md: content_md || null,
      details: details || null,
      source: source || null,
      url: url || null,
      status: (status as EntityStatus) || EntityStatus.proposed,
    };
    const newProject = await projectService.create(data);
    return `Successfully created project:\n\n${projectToString(newProject)}`;
  },
};

const updateProject: McpTool = {
  name: "update_project",
  description:
    "Update an existing cooking project in the Sgt Chef app. If you don't provide a field it will remain unchanged",
  arguments: [
    idArgument(),
    stringArgument("title", "The project title", false),
    stringArgument("summary", "A brief summary of the project", false),
    stringArgument("content_md", "The project content in markdown format", false),
    stringArgument("details", "Additional details (only shown on entity page)", false),
    stringArgument("source", "The source of the project", false),
    stringArgument("url", "URL to the original project", false),
    stringArgument("status", "Status: proposed, committed, completed, or abandoned", false),
  ],
  handler: async (args: {
    id: number;
    title?: string;
    summary?: string;
    content_md?: string;
    details?: string;
    source?: string;
    url?: string;
    status?: string;
  }): Promise<string> => {
    const {id, title, summary, content_md, details, source, url, status} = args;
    const currentProject = await projectService.findById(id);
    if (!currentProject) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const data: ProjectContent = {
      title: title != null ? title : currentProject.title,
      summary: summary != null ? summary || null : currentProject.summary,
      content_md: content_md != null ? content_md : currentProject.content_md,
      details: details != null ? details || null : currentProject.details,
      source: source != null ? source : currentProject.source,
      url: url != null ? url : currentProject.url,
      status: status != null ? (status as EntityStatus) : currentProject.status,
    };

    const updatedProject = await projectService.update(id, data);
    return `Successfully updated project:\n\n${projectToString(updatedProject)}`;
  },
};

const deleteProject: McpTool = {
  name: "delete_project",
  description: "Delete a cooking project from the Sgt Chef app",
  arguments: [idArgument()],
  handler: async (args: {id: number}): Promise<string> => {
    const {id} = args;
    const deletedProject = await projectService.delete(id);
    return `Successfully deleted project:\n\n${projectToString(deletedProject)}`;
  },
};

export const projectMcpTools: McpTool[] = [
  viewAllProjects,
  createProject,
  updateProject,
  deleteProject,
];
