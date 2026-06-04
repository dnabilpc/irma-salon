import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool?: Pool };

export const db =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3, // Limit connections per serverless container instance to 3
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

globalForPg._pgPool = db; // Save in globalThis to reuse across serverless requests