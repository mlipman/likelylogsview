import {Project, PrismaClient} from "@prisma/client";
import prisma, {NON_CONTENT_FIELDS} from "../lib/prisma";

// Use Prisma-generated types to avoid duplication
export type ProjectContent = Omit<Project, (typeof NON_CONTENT_FIELDS)[number]>;

export class ProjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  findMany(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: {created_at: "desc"},
    });
  }

  findById(id: number): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: {id},
    });
  }

  create(data: ProjectContent): Promise<Project> {
    return this.prisma.project.create({
      data,
    });
  }

  update(id: number, data: ProjectContent): Promise<Project> {
    return this.prisma.project.update({
      where: {id},
      data,
    });
  }

  delete(id: number): Promise<Project> {
    return this.prisma.project.delete({
      where: {id},
    });
  }

  /**
   * Format projects for MCP string output (excludes details)
   */
  allProjects(projects: Project[]): string {
    if (projects.length === 0) {
      return "No projects found.";
    }

    return `Found ${projects.length} cooking projects:\n\n${projects
      .map(project => projectToSummaryString(project))
      .join("\n")}`;
  }
}

// Project utility functions for string conversion

/**
 * Convert a single project to a summary string (excludes details)
 * Used in list/MCP responses
 */
export function projectToSummaryString(project: Project): string {
  const parts = [`**${project.title}**`];

  parts.push(`Status: ${project.status}`);
  if (project.summary) parts.push(`Summary: ${project.summary}`);
  if (project.source) parts.push(`Source: ${project.source}`);
  if (project.url) parts.push(`URL: ${project.url}`);
  if (project.content_md) parts.push(`Content:\n${project.content_md}`);

  parts.push(`ID: ${project.id}`);
  parts.push(`Created: ${project.created_at}`);
  parts.push(`Updated: ${project.updated_at}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

/**
 * Convert a single project to a full string including details
 * Used for individual entity views
 */
export function projectToString(project: Project): string {
  const parts = [projectToSummaryString(project).replace(/\n---\n$/, '')];

  if (project.details) parts.push(`Details:\n${project.details}`);
  parts.push('---');

  return parts.join('\n') + '\n';
}

// Export a singleton instance
export const projectService = new ProjectService();
