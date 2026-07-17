import 'dotenv/config';
import pg from 'pg';
import { runMigrations } from './services/migrationRunner.js';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        await runMigrations(pool);
        console.log('[CLI] Migrations completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[CLI] Migrations failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
