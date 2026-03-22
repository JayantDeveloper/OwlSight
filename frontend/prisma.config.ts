import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
  migrate: {
    async adapter() {
      const url = process.env.DATABASE_URL ?? "file:./dev.db";
      return new PrismaLibSql({ url });
    },
  },
});
