import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";
import {v2 as cloudinary} from "cloudinary";
import formidable from "formidable";
import {promises as fs} from "fs";

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const logs = await prisma.log.findMany({
        orderBy: {createdAt: "desc"},
      });
      return res.status(200).json(logs);
    } catch (error) {
      console.error("Detailed error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch logs",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const form = formidable();
      const [fields, files] = await form.parse(req);
      const content = fields.content?.[0];
      const imageFile = files.image?.[0];

      if (!imageFile || !content) {
        return res.status(400).json({error: "Missing image or content"});
      }

      const cloudinaryResponse = await cloudinary.uploader.upload(
        imageFile.filepath,
        {
          folder: "logs",
        }
      );

      const log = await prisma.log.create({
        data: {
          contents: content,
          pic1: cloudinaryResponse.secure_url,
        },
      });

      await fs.unlink(imageFile.filepath);
      return res.status(201).json(log);
    } catch (error) {
      console.error("Error in POST /api/logs:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Error processing upload",
      });
    }
  }

  return res.status(405).json({error: `Method ${req.method} Not Allowed`});
}
