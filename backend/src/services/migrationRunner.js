import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs pending migrations from the backend/migrations folder.
 * Supports SQL (.sql) files and JavaScript (.js) files.
 * @param {import('pg').Pool} pool 
 */
export async function runMigrations(pool) {
    console.log('[Migration] Starting migration runner...');
    
    // 1. Create migration metadata table if not exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    // 2. Scan the migrations directory
    const migrationsDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        console.log(`[Migration] Created migrations directory at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
        .sort(); // Sort alphanumerically to run in exact order (e.g. 001_..., 002_...)

    // 3. Get already executed migrations
    const { rows } = await pool.query('SELECT name FROM schema_migrations');
    const runMigrations = new Set(rows.map(r => r.name));

    // 4. Run pending migrations
    for (const file of files) {
        if (runMigrations.has(file)) {
            continue;
        }

        console.log(`[Migration] Running pending migration: ${file}`);
        const filePath = path.join(migrationsDir, file);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (file.endsWith('.sql')) {
                const sqlContent = fs.readFileSync(filePath, 'utf-8');
                if (sqlContent.trim()) {
                    await client.query(sqlContent);
                }
            } else if (file.endsWith('.js')) {
                // Dynamically import ES Module javascript migration
                const migrationModule = await import(`file://${filePath}`);
                if (typeof migrationModule.default === 'function') {
                    await migrationModule.default(client);
                } else if (typeof migrationModule.migrate === 'function') {
                    await migrationModule.migrate(client);
                } else {
                    throw new Error(`Migration ${file} must export a default function or a 'migrate' function.`);
                }
            }

            // Record execution in DB metadata
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`[Migration] Success: ${file}`);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`[Migration] Failed on migration file "${file}":`, err.message);
            throw err; // Stop application start on migration failure
        } finally {
            client.release();
        }
    }

    console.log('[Migration] All migrations are up to date.');
}
