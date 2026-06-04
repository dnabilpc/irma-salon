import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Prevent creating multiple connection pools across serverless function restarts/invocations on Vercel
const globalForPg = global;
if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3, // Limit connections per serverless container instance to 3
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    });
}

const pool = globalForPg._pgPool;

export default pool;
