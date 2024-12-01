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
    bodyParser: false, // handles forms
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({error: "Only POST supported, meant for forms"});
  }
  const form = formidable();
  const [fields, files] = await form.parse(req);
  const content = fields.content?.[0];
  const imageFile = files.image?.[0];
  if (!content) {
    return res.status(400).json({error: "Missing content"});
  }
  const imageUrl = imageFile
    ? (await cloudinary.uploader.upload(imageFile.filepath, {folder: "logs"}))
        .secure_url
    : null;

  if (imageFile) {
    await fs.unlink(imageFile.filepath);
  }
  const log = await prisma.log.create({
    data: {
      contents: content,
      pic_id1: pathFromUploadUrl(imageUrl),
    },
  });
  return res.status(201).json(log);
}
