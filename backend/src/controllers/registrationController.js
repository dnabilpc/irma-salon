// backend/src/controllers/registrationController.js
import crypto from 'crypto';
import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';

/**
 * Normalizes phone number format (converts 08... or 8... to 628...)
 */
function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

/**
 * Registers a new customer with PENDING status.
 * Receives a pre-hashed password from the Next.js Server Action.
 * POST /api/auth/register
 */
export async function registerCustomer(req, res) {
    const { name, email, phone_number, hashedPassword } = req.body;

    if (!name || !email || !hashedPassword) {
        return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    try {
        // Check if email already registered
        const existingUser = await pool.query(
            `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email sudah terdaftar. Gunakan email lain atau login.' });
        }

        // Check if phone number already registered
        if (phone_number) {
            const normalizedPhoneVal = normalizePhone(phone_number);
            const existingPhone = await pool.query(
                `SELECT id FROM "user" 
                 WHERE phone_number IS NOT NULL 
                   AND CASE 
                     WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '0%' 
                       THEN '62' || SUBSTRING(regexp_replace(phone_number, '\\D', '', 'g') FROM 2)
                     WHEN regexp_replace(phone_number, '\\D', '', 'g') LIKE '8%' 
                       THEN '62' || regexp_replace(phone_number, '\\D', '', 'g')
                     ELSE regexp_replace(phone_number, '\\D', '', 'g')
                   END = $1 
                 LIMIT 1`,
                [normalizedPhoneVal]
            );

            if (existingPhone.rows.length > 0) {
                return res.status(409).json({ error: 'Nomor WhatsApp sudah terdaftar pada akun lain.' });
            }
        }

        const userId = crypto.randomUUID();
        const accountId = crypto.randomUUID();
        const now = new Date();

        // Insert user with PENDING status
        await pool.query(
            `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, phone_number, status)
             VALUES ($1, $2, $3, false, $4, $4, 'CUSTOMER', $5, 'PENDING')`,
            [userId, name, email, now, phone_number || null]
        );

        // Insert credential account record (compatible with better-auth schema)
        await pool.query(
            `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'credential', $4, $5, $5)`,
            [accountId, userId, email, hashedPassword, now]
        );

        return res.status(201).json({ success: true, userId });
    } catch (err) {
        console.error('[registerCustomer]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

/**
 * Returns all users with PENDING registration status.
 * GET /api/admin/registrations/pending
 */
export async function getPendingRegistrations(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone_number, "createdAt"
             FROM "user"
             WHERE status = 'PENDING' AND role = 'CUSTOMER'
             ORDER BY "createdAt" DESC`
        );

        return res.json({ registrations: result.rows });
    } catch (err) {
        console.error('[getPendingRegistrations]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Returns all ACTIVE customers.
 * GET /api/admin/registrations/customers
 */
export async function getActiveCustomers(req, res) {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.phone_number, u."createdAt",
                    COUNT(DISTINCT b.id) AS total_booking,
                    COUNT(DISTINCT r.id) AS total_sewa
             FROM "user" u
             LEFT JOIN bookings b ON b.user_id = u.id
             LEFT JOIN rentals r ON r.user_id = u.id
             WHERE u.status = 'ACTIVE' AND u.role = 'CUSTOMER'
             GROUP BY u.id
             ORDER BY u."createdAt" DESC`
        );

        return res.json({ customers: result.rows });
    } catch (err) {
        console.error('[getActiveCustomers]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Returns all REJECTED registrations.
 * GET /api/admin/registrations/rejected
 */
export async function getRejectedRegistrations(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone_number, "createdAt", "updatedAt"
             FROM "user"
             WHERE status = 'REJECTED' AND role = 'CUSTOMER'
             ORDER BY "updatedAt" DESC`
        );

        return res.json({ registrations: result.rows });
    } catch (err) {
        console.error('[getRejectedRegistrations]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Approves a pending customer registration and sends WhatsApp notification.
 * PATCH /api/admin/registrations/:id/approve
 */
export async function approveRegistration(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE "user"
             SET status = 'ACTIVE', "updatedAt" = NOW()
             WHERE id = $1 AND status = 'PENDING'
             RETURNING id, name, email, phone_number`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pendaftaran tidak ditemukan atau sudah diproses.' });
        }

        const user = result.rows[0];

        // Send WhatsApp notification to the approved customer
        if (user.phone_number) {
            const phone = normalizePhone(user.phone_number);
            const message =
                `Halo *${user.name}*! 🎉\n\n` +
                `Pendaftaran akun Anda di *Rumah Cantik Irma* telah *disetujui*.\n\n` +
                `Sekarang Anda dapat login menggunakan email yang terdaftar dan mulai menikmati layanan kami.\n\n` +
                `Terima kasih telah mendaftar! ✨`;
            try {
                await sendWaMessage(phone, message);
            } catch (waErr) {
                console.warn('[approveRegistration] WhatsApp notification failed:', waErr.message);
                // Don't fail the request if WA fails
            }
        }

        return res.json({ success: true, user });
    } catch (err) {
        console.error('[approveRegistration]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Rejects a pending customer registration.
 * PATCH /api/admin/registrations/:id/reject
 */
export async function rejectRegistration(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE "user"
             SET status = 'REJECTED', "updatedAt" = NOW()
             WHERE id = $1 AND status = 'PENDING'
             RETURNING id, name, email`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pendaftaran tidak ditemukan atau sudah diproses.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[rejectRegistration]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Returns pending counts for admin sidebar dashboard.
 * GET /api/admin/dashboard/sidebar-counts
 */
export async function getSidebarCounts(req, res) {
    try {
        // 1. Pending registrations count
        const registrationsRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM "user" WHERE status = 'PENDING' AND role = 'CUSTOMER'`
        );
        const registrationsCount = registrationsRes.rows[0].count;

        // 2. Pending bookings count
        const bookingsRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM bookings WHERE status = 'PENDING'`
        );
        const bookingsCount = bookingsRes.rows[0].count;

        // 3. Pending rentals count
        const rentalsRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM rentals WHERE rental_status = 'pending'`
        );
        const rentalsCount = rentalsRes.rows[0].count;

        // 4. Pending cash/qris payments count (transactions that are pay-at-salon and not yet confirmed as lunas)
        const paymentsRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM transactions t
             WHERE t.payment_method IN ('cash', 'qris')
               AND (t.midtrans_status IS NULL OR t.midtrans_status != 'settlement')`
        );
        const paymentsCount = paymentsRes.rows[0].count;

        return res.json({
            bookings: bookingsCount,
            rentals: rentalsCount,
            customers: registrationsCount,
            payments: paymentsCount
        });
    } catch (err) {
        console.error('[getSidebarCounts]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
