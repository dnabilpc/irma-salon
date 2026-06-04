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

/**
 * Uploads a base64 image string to Supabase Storage and returns the public URL.
 * @param {string} base64Str - Data URL string (e.g. data:image/png;base64,...)
 * @param {string} userId - User ID to prevent duplicate/anonymous file names
 * @returns {Promise<string|null>} Public URL of the uploaded image, or null if failed
 */
async function uploadToSupabaseStorage(base64Str, userId) {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
        return null;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    const bucketName = encodeURIComponent(process.env.SUPABASE_BUCKET || 'irma-salon');

    if (!supabaseUrl || !supabaseKey) {
        console.error('[Supabase Storage] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
        return null;
    }

    try {
        const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format.');
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        let ext = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';

        const fileName = `${userId}-${Date.now()}.${ext}`;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': contentType,
                'x-upsert': 'true'
            },
            body: buffer
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase upload failed: ${response.statusText} (${errText})`);
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
        console.log(`[Supabase Storage] Successfully uploaded image for user ${userId}. URL: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error('[Supabase Storage] Upload error:', error);
        return null;
    }
}

/**
 * Updates user profile details (name, phone_number, and optional base64 image)
 */
export async function updateProfile(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }

    const { name, phone_number, image } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nama wajib diisi.' });
    }

    try {
        // Check if phone number already registered on another account
        if (phone_number) {
            const normalizedPhoneVal = normalizePhone(phone_number);
            const existingPhone = await pool.query(
                `SELECT id FROM "user" 
                 WHERE phone_number IS NOT NULL 
                   AND id != $1
                   AND CASE 
                     WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '0%' 
                       THEN '62' || SUBSTRING(regexp_replace(phone_number, '\\D', '', 'g') FROM 2)
                     WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '8%' 
                       THEN '62' || regexp_replace(phone_number, '\\D', '', 'g')
                     ELSE regexp_replace(phone_number, '\\D', '', 'g')
                   END = $2 
                 LIMIT 1`,
                [userId, normalizedPhoneVal]
            );

            if (existingPhone.rows.length > 0) {
                return res.status(409).json({ error: 'Nomor WhatsApp sudah terdaftar pada akun lain.' });
            }
        }

        let imageUrlToSave = image;
        if (image && image.startsWith('data:image/')) {
            const uploadedUrl = await uploadToSupabaseStorage(image, userId);
            if (uploadedUrl) {
                imageUrlToSave = uploadedUrl;
            } else {
                return res.status(500).json({ error: 'Gagal mengunggah foto profil ke Supabase Storage.' });
            }
        }

        let query = `UPDATE "user" SET name = $1, phone_number = $2`;
        const params = [name, phone_number || null];
        let paramCounter = 3;

        if (image !== undefined) {
            query += `, image = $${paramCounter}`;
            params.push(imageUrlToSave || null);
            paramCounter++;
        }

        query += `, "updatedAt" = NOW() WHERE id = $${paramCounter} RETURNING id, name, email, phone_number, image`;
        params.push(userId);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        return res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('[updateProfile]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

/**
 * Resolves registered email address by phone number.
 * GET /api/auth/resolve-email
 */
export async function resolveEmailByPhone(req, res) {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'Parameter nomor telepon wajib diisi.' });
    }

    try {
        const cleaned = normalizePhone(phone);
        const result = await pool.query(
            `SELECT email FROM "user" 
             WHERE phone_number IS NOT NULL 
               AND CASE 
                 WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '0%' 
                   THEN '62' || SUBSTRING(regexp_replace(phone_number, '\\D', '', 'g') FROM 2)
                 WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '8%' 
                   THEN '62' || regexp_replace(phone_number, '\\D', '', 'g')
                 ELSE regexp_replace(phone_number, '\\D', '', 'g')
               END = $1 
             LIMIT 1`,
            [cleaned]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nomor WhatsApp tidak terdaftar.' });
        }

        return res.json({ email: result.rows[0].email });
    } catch (err) {
        console.error('[resolveEmailByPhone]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
