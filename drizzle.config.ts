import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/schemas/*",
  out: "./lib/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})