import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "path";
import * as schema from "./schema";

const localDbPath = path.join(process.cwd(), "world.db");
const client = createClient({
  url: process.env.DATABASE_URL || `file:${localDbPath}`,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
export const db = drizzle(client, { schema });
export type DB = typeof db;
