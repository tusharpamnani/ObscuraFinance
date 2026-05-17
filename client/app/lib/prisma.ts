import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use PrismaClient with @prisma/adapter-pg for direct PostgreSQL TCP connection.
// The Neon serverless HTTP adapter (PrismaNeonHttp) uses fetch() which
// fails in WSL due to IPv6 routing issues. Direct TCP works fine.
// Prisma 7 requires either an adapter or accelerateUrl.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}