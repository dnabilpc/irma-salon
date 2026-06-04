// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tryonRoutes from './routes/tryonRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import vtoRoutes from './routes/vtoRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
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

        // Update payment_method check constraint in transactions table
        await pool.query(`
            ALTER TABLE transactions 
            DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
            
            ALTER TABLE transactions 
            ADD CONSTRAINT transactions_payment_method_check 
            CHECK (payment_method IN ('cash', 'qris', 'midtrans', 'payment_gateway'));
        `);
        console.log('[Migration] transactions.payment_method check constraint updated.');
    } catch (err) {
        console.error('[Migration] Failed:', err.message);
    }
}

dotenv.config();

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

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "healthy", message: "Try-on backend is active!" });
});

// Initialize services on startup
runMigrations();
initWhatsapp();
initScheduler();

app.listen(PORT, () => {
    console.log(`Backend for Web Irma Salon is running on http://localhost:${PORT}`);
});