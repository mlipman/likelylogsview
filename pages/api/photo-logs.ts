import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";
import {v2 as cloudinary} from "cloudinary";
import formidable from "formidable";
import {promises as fs} from "fs";
import {pathFromUploadUrl} from "../../utils/imageUtils";

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
      const photoLogs = await prisma.photo_log.findMany({
        orderBy: {created_at: "desc"},
      });
      return res.status(200).json(photoLogs);
    } catch (error) {
      console.error("Error fetching photo logs:", error);
      return res.status(500).json({error: "Failed to fetch photo logs"});
    }
  }

  if (req.method === "POST") {
    const form = formidable();
    try {
      const [fields, files] = await form.parse(req);
      
      const title = fields.title?.[0];
      const description = fields.description?.[0];
      const tags = fields.tags?.[0];
      const location = fields.location?.[0];
      const imageFile = files.image?.[0];

      if (!title) {
        return res.status(400).json({error: "Title is required"});
      }

      if (!imageFile) {
        return res.status(400).json({error: "Image is required"});
      }

      // Upload image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageFile.filepath, {
        folder: "photo-logs",
      });

      // Clean up temp file
      await fs.unlink(imageFile.filepath);

      // Create photo log entry
      const photoLog = await prisma.photo_log.create({
        data: {
          title,
          description: description || null,
          pic_id: pathFromUploadUrl(uploadResult.secure_url) || "",
          tags: tags || null,
          location: location || null,
        },
      });

      return res.status(201).json(photoLog);
    } catch (error) {
      console.error("Error creating photo log:", error);
      return res.status(500).json({error: "Failed to create photo log"});
    }
  }

  return res.status(405).json({error: "Method not allowed"});
}