import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schemas";

export const db = drizzle({
  connection: process.env.DATABASE_URL || "",
  schema: schema,
  ws: ws,
});