// backend/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tryonRoutes from './routes/tryonRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import vtoRoutes from './routes/vtoRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import openingTimeRoutes from './routes/openingTimeRoutes.js';
import closingTimeRoutes from './routes/closingTimeRoutes.js';
import { initWhatsapp } from './services/whatsappService.js';
import { initScheduler } from './services/reminderCron.js';
import { startVtoWorker } from './controllers/tryonController.js';
import pool from './services/db.js';

/**
 * Auto-migration: safely add `status` column to the `user` table.
 * Runs once on startup; safe to call multiple times.
 */
async function runMigrations() {
    try {
        await pool.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        `);
        // Ensure any existing users remain ACTIVE
        await pool.query(`
            UPDATE "user" SET status = 'ACTIVE'
            WHERE status IS NULL OR status = ''
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status)
        `);
        console.log('[Migration] user.status column ready.');

        // Add VTO usage and reset tracking columns
        await pool.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS vto_usage INTEGER NOT NULL DEFAULT 0
        `);
        await pool.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS vto_reset_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        `);
        console.log('[Migration] user.vto columns ready.');

        // Add is_price_variable column to salon_services table
        await pool.query(`
            ALTER TABLE salon_services
            ADD COLUMN IF NOT EXISTS is_price_variable BOOLEAN NOT NULL DEFAULT FALSE
        `);
        console.log('[Migration] salon_services.is_price_variable column ready.');

        // Update payment_method check constraint in transactions table
        await pool.query(`
            ALTER TABLE transactions 
            DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
            
            ALTER TABLE transactions 
            ADD CONSTRAINT transactions_payment_method_check 
            CHECK (payment_method IN ('cash', 'qris'));
        `);
        console.log('[Migration] transactions.payment_method check constraint updated.');

        // Add created_at column to transactions table if it doesn't exist
        await pool.query(`
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        `);
        console.log('[Migration] transactions.created_at column ready.');

        // Rename midtrans_status to status, drop other midtrans_* columns, and map statuses
        await pool.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                      AND table_name = 'transactions' 
                      AND column_name = 'midtrans_status'
                ) THEN
                    ALTER TABLE transactions RENAME COLUMN midtrans_status TO status;
                END IF;
            END $$;

            UPDATE transactions SET status = 'pending' WHERE status IS NULL;

            ALTER TABLE transactions 
            ALTER COLUMN status SET DEFAULT 'pending';

            ALTER TABLE transactions 
            ALTER COLUMN status SET NOT NULL;

            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_transaction_id;
            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_fraud_status;
            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_payment_type;
            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_settlement_time;
            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_signature_key;
            ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_pdf_url;

            UPDATE transactions SET status = 'lunas' WHERE status = 'settlement' OR status = 'capture';
        `);
        console.log('[Migration] transactions table Midtrans attributes removed and status column initialized.');

        // Add booking reminder tracking columns
        await pool.query(`
            ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS reminder_1d_sent BOOLEAN NOT NULL DEFAULT FALSE
        `);
        await pool.query(`
            ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS reminder_3h_sent BOOLEAN NOT NULL DEFAULT FALSE
        `);
        // Add payment_proof_sent column to transactions table if it doesn't exist
        await pool.query(`
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS payment_proof_sent BOOLEAN NOT NULL DEFAULT FALSE
        `);
        console.log('[Migration] transactions.payment_proof_sent column ready.');

        // Rename model_3d_file_link to model_2d_file_link in outfit_catalogues table
        try {
            await pool.query(`
                ALTER TABLE outfit_catalogues 
                RENAME COLUMN model_3d_file_link TO model_2d_file_link;
            `);
            console.log('[Migration] Renamed model_3d_file_link to model_2d_file_link in outfit_catalogues.');
        } catch (err) {
            // Ignore error if column has already been renamed
            if (!err.message.includes('does not exist')) {
                console.error('[Migration] Failed to rename model_3d_file_link:', err.message);
            }
        }

        // Ensure opening_time.id has GENERATED BY DEFAULT AS IDENTITY
        try {
            const checkIdentity = await pool.query(`
                SELECT column_name, is_identity 
                FROM information_schema.columns 
                WHERE table_name = 'opening_time' AND column_name = 'id'
            `);
            if (checkIdentity.rows.length > 0 && checkIdentity.rows[0].is_identity !== 'YES') {
                await pool.query(`
                    ALTER TABLE opening_time 
                    ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY
                `);
                await pool.query(`
                    SELECT setval(
                        pg_get_serial_sequence('opening_time', 'id'), 
                        COALESCE((SELECT MAX(id) FROM opening_time), 1)
                    )
                `);
                console.log('[Migration] opening_time.id auto-increment sequence configured.');
            }
        } catch (err) {
            console.error('[Migration] Failed to configure opening_time.id identity:', err.message);
        }

        // Create vto_tasks table
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS vto_tasks (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
                    person_image_url TEXT NOT NULL,
                    clothes_image_url TEXT NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    result_image_url TEXT,
                    garment_description TEXT,
                    error_message TEXT,
                    outfit_name VARCHAR(255),
                    user_notified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            // Add columns to existing table if they don't exist
            await pool.query(`
                ALTER TABLE vto_tasks ADD COLUMN IF NOT EXISTS outfit_name VARCHAR(255);
                ALTER TABLE vto_tasks ADD COLUMN IF NOT EXISTS user_notified BOOLEAN DEFAULT FALSE;
            `);
            console.log('[Migration] vto_tasks table and columns ready.');
        } catch (err) {
            console.error('[Migration] Failed to create or alter vto_tasks table:', err.message);
        }

        // Offline transactions & penalties migration
        await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'salon',
            ADD COLUMN IF NOT EXISTS notes TEXT;
        `);

        // VTO Settings initialization
        await pool.query(`
            INSERT INTO settings (key, value)
            VALUES 
                ('vto_milestones_config', '[{"rentals_count": 1, "bonus_limit": 2}, {"rentals_count": 3, "bonus_limit": 4}, {"rentals_count": 6, "bonus_limit": 6}, {"rentals_count": 10, "bonus_limit": 10}]'),
                ('vto_bonus_expiry_days', '30')
            ON CONFLICT (key) DO NOTHING;
        `);

        // Gender & Target Age Category migration
        await pool.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'unspecified';

            ALTER TABLE outfit_catalogues 
            ADD COLUMN IF NOT EXISTS target_gender VARCHAR(20) DEFAULT 'unisex',
            ADD COLUMN IF NOT EXISTS target_age VARCHAR(20) DEFAULT 'semua_umur';
        `);
        console.log('[Migration] Gender, target_gender, target_age, offline transactions, and VTO settings ready.');

        // ── Multi-Item Cart Migrations ───────────────────────────────────────
        // 1. rental_orders: parent "cart order" for grouping multiple rentals in 1 transaction
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rental_orders (
                id             SERIAL PRIMARY KEY,
                user_id        TEXT REFERENCES "user"(id) ON DELETE SET NULL,
                created_at     TIMESTAMPTZ DEFAULT NOW(),
                notes          TEXT,
                customer_name  VARCHAR(255),
                customer_phone VARCHAR(50)
            )
        `);
        console.log('[Migration] rental_orders table ready.');

        // 2. rentals: add rental_order_id FK (nullable for backward compat with single-item rentals)
        await pool.query(`
            ALTER TABLE rentals
            ADD COLUMN IF NOT EXISTS rental_order_id INTEGER REFERENCES rental_orders(id) ON DELETE SET NULL
        `);
        console.log('[Migration] rentals.rental_order_id column ready.');

        // 3. transactions: add rental_order_id FK (nullable; new cart checkouts use this, legacy use rental_id)
        await pool.query(`
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS rental_order_id INTEGER REFERENCES rental_orders(id) ON DELETE SET NULL
        `);
        console.log('[Migration] transactions.rental_order_id column ready.');

        // 4. booking_details: add booking_datetime per item (each service can have its own schedule)
        await pool.query(`
            ALTER TABLE booking_details
            ADD COLUMN IF NOT EXISTS booking_datetime TIMESTAMPTZ
        `);
        // Back-fill existing booking_details rows from parent bookings.booking_datetime
        await pool.query(`
            UPDATE booking_details bd
            SET booking_datetime = b.booking_datetime
            FROM bookings b
            WHERE b.id = bd.booking_id
              AND bd.booking_datetime IS NULL
        `);
        console.log('[Migration] booking_details.booking_datetime column ready (back-filled from bookings).');
        // ── End Multi-Item Cart Migrations ──────────────────────────────────
    } catch (err) {
        console.error('[Migration] Failed:', err.message);
    }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount our routes
app.use('/api', tryonRoutes);
app.use('/api', whatsappRoutes);
app.use('/api', authRoutes);
app.use('/api', notificationRoutes);
app.use('/api', vtoRoutes);
app.use('/api', bookingRoutes);
app.use('/api', rentalRoutes);
app.use('/api', registrationRoutes);
app.use('/api', paymentRoutes);
app.use('/api', adminRoutes);
app.use('/api', openingTimeRoutes);
app.use('/api', closingTimeRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ message: "This is Salon Irma Backend!" });
});

// Initialize services on startup
runMigrations();
initWhatsapp();
initScheduler();
startVtoWorker();

app.listen(PORT, () => {
    console.log(`Backend for Web Irma Salon is running on http://localhost:${PORT}`);
});