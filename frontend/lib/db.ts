import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool?: Pool };

export const db =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg._pgPool = db;
}