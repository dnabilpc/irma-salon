// backend/src/controllers/authController.js
import crypto from 'crypto';
import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';

/**
 * Normalizes phone number format (converts 08... or 8... to 628...)
 */
function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.substring(1);
    } else if (cleaned.startsWith("8")) {
        cleaned = "62" + cleaned;
    }
    return cleaned;
}

/**
 * Initiates Forgot Password OTP generation and dispatch via WhatsApp
 */
export async function forgotPasswordOTP(req, res) {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number parameter is required.' });
    }

    try {
        const cleaned = normalizePhone(phone);
        
        // Check if user exists
        const userRes = await pool.query(
            `SELECT id, name FROM "user" WHERE phone_number = $1 OR phone_number = $2 LIMIT 1`,
            [phone, cleaned]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Nomor WhatsApp tidak terdaftar.' });
        }

        const user = userRes.rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const identifier = `password_reset:${cleaned}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Delete previous OTP tokens
        await pool.query(
            `DELETE FROM verification WHERE identifier = $1`,
            [identifier]
        );

        // Save OTP to verification table
        const id = crypto.randomUUID();
        await pool.query(
            `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [id, identifier, otp, expiresAt]
        );

        // Send OTP via WhatsApp
        const message = `Halo *${user.name}*,\n\nBerikut adalah kode OTP untuk melakukan reset password akun Anda di *Rumah Cantik Irma*:\n\n🔑 Kode OTP: *${otp}*\n\nKode ini berlaku selama *10 menit*. Mohon untuk tidak membagikan kode ini kepada siapapun demi keamanan akun Anda.`;
        
        await sendWaMessage(cleaned, message);
        
        return res.json({ success: true });
    } catch (err) {
        console.error('[forgotPasswordOTP]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

/**
 * Verifies a password reset OTP code
 */
export async function verifyOTP(req, res) {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP parameters are required.' });
    }

    try {
        const cleaned = normalizePhone(phone);
        const identifier = `password_reset:${cleaned}`;

        const verificationRes = await pool.query(
            `SELECT "expiresAt" FROM verification WHERE identifier = $1 AND value = $2 LIMIT 1`,
            [identifier, otp]
        );

        if (verificationRes.rows.length === 0) {
            return res.status(400).json({ error: 'Kode OTP salah atau tidak valid.' });
        }

        const expiry = new Date(verificationRes.rows[0].expiresAt);
        if (expiry < new Date()) {
            await pool.query(`DELETE FROM verification WHERE identifier = $1`, [identifier]);
            return res.status(400).json({ error: 'Kode OTP telah kedaluwarsa. Silakan ajukan ulang.' });
        }

        // Get user ID
        const userRes = await pool.query(
            `SELECT id FROM "user" WHERE phone_number = $1 OR phone_number = $2 LIMIT 1`,
            [phone, cleaned]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        return res.json({ success: true, userId: userRes.rows[0].id });
    } catch (err) {
        console.error('[verifyOTP]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Directly resets user password inside credentials account table
 */
export async function resetPasswordDB(req, res) {
    const { userId, hashedPassword, phone } = req.body;
    if (!userId || !hashedPassword) {
        return res.status(400).json({ error: 'userId and hashedPassword parameters are required.' });
    }

    try {
        // Update password
        const updateRes = await pool.query(
            `UPDATE account 
             SET password = $1, "updatedAt" = NOW() 
             WHERE "userId" = $2 AND "providerId" = 'credential'
             RETURNING id`,
            [hashedPassword, userId]
        );

        if (updateRes.rows.length === 0) {
            return res.status(400).json({ error: 'Gagal memperbarui password.' });
        }

        // Delete verification code if phone was supplied
        if (phone) {
            const cleaned = normalizePhone(phone);
            await pool.query(
                `DELETE FROM verification WHERE identifier = $1`,
                [`password_reset:${cleaned}`]
            );
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[resetPasswordDB]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
