import type {NextApiRequest, NextApiResponse} from "next";
import {projectService} from "../../../services/projects";

async function handleGet(res: NextApiResponse) {
  const projects = await projectService.findMany();
  res.status(200).json(projects);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {title, content_md, source, url} = req.body;
  const newProject = await projectService.create({
    title,
    content_md,
    source,
    url,
  });
  res.status(201).json(newProject);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {id, title, content_md, source, url} = req.body;
  const updatedProject = await projectService.update(id, {
    title,
    content_md,
    source,
    url,
  });
  res.status(200).json(updatedProject);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        await handleGet(res);
        break;

      case "POST":
        await handlePost(req, res);
        break;

      case "PUT":
        await handlePut(req, res);
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Project API error:", error);
    res.status(500).json({error: "Internal server error"});
  }
}
