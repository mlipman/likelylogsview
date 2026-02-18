import type {NextApiRequest, NextApiResponse} from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({message: "Method not allowed"});
  }

  const {instances} = req.query;
  if (typeof instances !== "string" || !instances.trim()) {
    return res.status(400).json({message: "instances query parameter required"});
  }

  const instanceList = instances.split(",").map(s => s.trim()).filter(Boolean);
  if (instanceList.length === 0) {
    return res.status(200).json({existingInstances: []});
  }

  try {
    const found = await prisma.session.findMany({
      where: {instance: {in: instanceList}},
      select: {instance: true},
    });
    const existingInstances = found.map(s => s.instance);
    return res.status(200).json({existingInstances});
  } catch (error) {
    console.error("Error fetching sessions index:", error);
    return res.status(500).json({message: "Internal server error"});
  }
}
