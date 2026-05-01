import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
