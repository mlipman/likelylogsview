import {PrismaClient} from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   global.prisma = prisma;
// }

// Non-content fields that exist on all entities
export const NON_CONTENT_FIELDS = ["id", "created_at", "updated_at"] as const;

export default prisma;
