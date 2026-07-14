import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Prevent creating multiple connection pools across serverless function restarts/invocations on Vercel
const globalForPg = global;
if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // NOTE: This backend runs as a persistent Express server (not serverless).
        // A higher max allows more concurrent requests to be served without connection queue buildup.
        // Supabase free tier supports up to 60 direct connections; we cap at 20 to leave headroom.
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
}

const pool = globalForPg._pgPool;

// Add error listener on idle clients in the pool to prevent unhandled process crashes
pool.on('error', (err) => {
    console.error('[Database Pool] Unexpected error on idle client:', err.message);
});

export default pool;
