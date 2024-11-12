import type {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Get all persons
    const persons = await prisma.person.findMany();
    return res.status(200).json(persons);
  }

  if (req.method === "POST") {
    // Create new person
    const {name, age} = req.body;
    const person = await prisma.person.create({
      data: {
        name,
        age: parseInt(age),
      },
    });
    return res.status(201).json(person);
  }

  if (req.method === "PUT") {
    // Update person
    const {id, name, age} = req.body;
    const person = await prisma.person.update({
      where: {id: parseInt(id)},
      data: {
        name,
        age: parseInt(age),
      },
    });
    return res.status(200).json(person);
  }

  if (req.method === "DELETE") {
    // Delete person
    const {id} = req.query;
    await prisma.person.delete({
      where: {id: parseInt(id as string)},
    });
    return res.status(204).end();
  }

  return res.status(405).json({message: "Method not allowed"});
}
