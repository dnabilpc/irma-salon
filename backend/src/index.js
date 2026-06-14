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
        console.log('[Migration] bookings reminder columns ready.');

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

app.listen(PORT, () => {
    console.log(`Backend for Web Irma Salon is running on http://localhost:${PORT}`);
});