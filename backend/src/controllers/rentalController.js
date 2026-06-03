// backend/src/controllers/rentalController.js
import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';

// ── Shared Helper to get Admin Phone ────────────────────────────────────────
async function getAdminPhone() {
    try {
        const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'salon_whatsapp' LIMIT 1");
        if (settingsRes.rows.length > 0 && settingsRes.rows[0].value) {
            return settingsRes.rows[0].value;
        }
    } catch (err) {
        console.error("Failed to query settings for admin phone:", err);
    }

    try {
        const adminRes = await pool.query(
            `SELECT phone_number FROM "user" 
             WHERE role = 'ADMIN' AND phone_number IS NOT NULL AND phone_number != '' 
             LIMIT 1`
        );
        if (adminRes.rows.length > 0) {
            return adminRes.rows[0].phone_number;
        }
    } catch (err) {
        console.error("Failed to query user for admin phone:", err);
    }
    return null;
}

// ── WhatsApp Notification Triggers ──────────────────────────────────────────
async function triggerRentalCreationNotification(
    rentalId,
    userId,
    outfitName,
    startDateStr,
    durationDays,
    amount,
    deposit
) {
    try {
        const userRes = await pool.query(
            `SELECT name, phone_number, email FROM "user" WHERE id = $1 LIMIT 1`,
            [userId]
        );
        if (userRes.rows.length === 0) return;
        const customer = userRes.rows[0];

        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const formatD = (d) => d.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const formattedStart = formatD(startDate);
        const formattedEnd = formatD(endDate);

        const amountRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
        const depositRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(deposit);

        if (customer.phone_number) {
            const customerMsg = `Halo *${customer.name}*,\n\nTerima kasih! Pemesanan sewa baju Anda di *Rumah Cantik Irma* telah berhasil dibuat dan berstatus *PENDING*:\n\n` +
                `👗 *Baju Sewa:* ${outfitName}\n` +
                `📅 *Tanggal Mulai:* ${formattedStart}\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n` +
                `⏳ *Durasi:* ${durationDays} hari\n` +
                `💵 *Biaya Sewa:* ${amountRupiah}\n` +
                `💰 *Deposit:* ${depositRupiah}\n\n` +
                `Silakan lakukan pembayaran deposit atau pelunasan untuk memproses pemesanan Anda. Terima kasih! ✨`;
            await sendWaMessage(customer.phone_number, customerMsg);
        }

        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg = `📢 *NOTIFIKASI SEWA BAJU BARU* 📢\n\n` +
                `Pelanggan *${customer.name}* (${customer.phone_number || customer.email}) telah memesan sewa baju baru:\n\n` +
                `🆔 *Sewa ID:* #${rentalId}\n` +
                `👗 *Baju Sewa:* ${outfitName}\n` +
                `📅 *Tanggal:* ${formattedStart} s.d ${formattedEnd} (${durationDays} hari)\n` +
                `💵 *Biaya Sewa:* ${amountRupiah}\n` +
                `💰 *Deposit:* ${depositRupiah}\n\n` +
                `Silakan cek admin panel untuk memproses sewa.`;
            await sendWaMessage(adminPhone, adminMsg);
        }
    } catch (err) {
        console.error("Error sending rental creation notification:", err);
    }
}

async function triggerRentalStatusNotification(rentalId, status, deposit_refund) {
    try {
        const rentalRes = await pool.query(
            `SELECT
                 r.id,
                 u.name as customer_name,
                 u.phone_number as customer_phone,
                 oc.outfit_name,
                 r.start_date,
                 r.duration_days,
                 r.amount_to_be_paid,
                 r.deposit_paid
             FROM rentals r
             JOIN "user" u ON r.user_id = u.id
             JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
             WHERE r.id = $1`,
            [rentalId]
        );

        if (rentalRes.rows.length === 0) return;
        const row = rentalRes.rows[0];
        if (!row.customer_phone) return;

        const startDate = new Date(row.start_date);
        const endDate = new Date(startDate.getTime() + row.duration_days * 24 * 60 * 60 * 1000);

        const formatD = (d) => d.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const formattedStart = formatD(startDate);
        const formattedEnd = formatD(endDate);

        const amountRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.amount_to_be_paid);
        const depositRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.deposit_paid);
        const refundRupiah = deposit_refund !== undefined && deposit_refund !== null
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(deposit_refund)
            : "";

        let message = "";

        if (status === "only_deposit") {
            message = `Halo *${row.customer_name}*,\n\nPembayaran deposit untuk sewa baju Anda di *Rumah Cantik Irma* telah berhasil diterima!:\n\n` +
                `👗 *Baju Sewa:* ${row.outfit_name}\n` +
                `📅 *Tanggal Mulai:* ${formattedStart}\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n` +
                `⏳ *Durasi:* ${row.duration_days} hari\n` +
                `💵 *Biaya Sewa:* ${amountRupiah}\n` +
                `💰 *Deposit paid:* ${depositRupiah}\n\n` +
                `Silakan ambil baju sewa Anda sesuai dengan tanggal mulai sewa. Terima kasih! 👗`;
        } else if (status === "ongoing") {
            message = `Halo *${row.customer_name}*,\n\nBaju sewa Anda: *${row.outfit_name}* telah berhasil diambil! Mohon jaga baju sewa tersebut dengan baik:\n\n` +
                `📅 *Tanggal Ambil:* ${formattedStart}\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n` +
                `⏳ *Durasi:* ${row.duration_days} hari\n\n` +
                `Selamat mengenakan! Mohon dikembalikan tepat waktu ya. Terima kasih! 💖`;
        } else if (status === "done") {
            message = `Halo *${row.customer_name}*,\n\nTransaksi sewa baju Anda: *${row.outfit_name}* telah *SELESAI*:\n\n` +
                `📅 *Batas Kembali:* ${formattedEnd}\n` +
                `💰 *Deposit dikembalikan:* ${refundRupiah || "-"}\n\n` +
                `Baju sewa telah kami terima kembali dengan baik. Terima kasih telah menyewa di Rumah Cantik Irma! ✨`;
        } else if (status === "terlambat") {
            message = `Halo *${row.customer_name}*,\n\nStatus sewa baju Anda: *${row.outfit_name}* saat ini terdeteksi *TERLAMBAT*:\n\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n\n` +
                `Mohon segera mengembalikan baju sewa tersebut ke Rumah Cantik Irma untuk menghindari denda yang terus bertambah. Terima kasih.`;
        } else if (status === "cancelled") {
            message = `Halo *${row.customer_name}*,\n\nTransaksi sewa baju Anda: *${row.outfit_name}* untuk tanggal *${formattedStart}* telah *DIBATALKAN*. Terima kasih.`;
        }

        if (message) {
            await sendWaMessage(row.customer_phone, message);
        }
    } catch (err) {
        console.error("Error in triggerRentalStatusNotification:", err);
    }
}

async function triggerRentalCancelNotification(rentalId) {
    try {
        const rentalRes = await pool.query(
            `SELECT
                 r.id,
                 u.name as customer_name,
                 u.phone_number as customer_phone,
                 u.email as customer_email,
                 oc.outfit_name,
                 r.start_date,
                 r.duration_days
             FROM rentals r
             JOIN "user" u ON r.user_id = u.id
             JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
             WHERE r.id = $1`,
            [rentalId]
        );

        if (rentalRes.rows.length === 0) return;
        const row = rentalRes.rows[0];

        const startDate = new Date(row.start_date);
        const formatD = (d) => d.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const formattedStart = formatD(startDate);

        // 1. Notify Customer
        if (row.customer_phone) {
            const customerMsg = `Halo *${row.customer_name}*,\n\nPemesanan sewa baju Anda: *${row.outfit_name}* untuk jadwal *${formattedStart}* telah berhasil *DIBATALKAN*. Terima kasih.`;
            await sendWaMessage(row.customer_phone, customerMsg);
        }

        // 2. Notify Admin
        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg = `🚨 *NOTIFIKASI PEMBATALAN SEWA BAJU* 🚨\n\n` +
                `Pelanggan *${row.customer_name}* (${row.customer_phone || row.customer_email}) telah membatalkan sewa baju berikut:\n\n` +
                `🆔 *Sewa ID:* #${rentalId}\n` +
                `👗 *Baju Sewa:* ${row.outfit_name}\n` +
                `📅 *Tanggal Mulai:* ${formattedStart}\n\n` +
                `Status sewa telah diperbarui menjadi cancelled.`;
            await sendWaMessage(adminPhone, adminMsg);
        }
    } catch (err) {
        console.error("Error in triggerRentalCancelNotification:", err);
    }
}

// ── GET RENTALS FOR ADMIN ──────────────────────────────────────────────────
export async function getRentalsForAdmin(req, res) {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    try {
        const status = req.query.status ?? "ALL";
        const search = req.query.search;
        const page = parseInt(req.query.page ?? "1", 10);
        const limit = parseInt(req.query.limit ?? "20", 10);
        const offset = (page - 1) * limit;

        const conditions = [];
        const params = [];

        if (status && status !== "ALL") {
            params.push(status);
            conditions.push(`r.rental_status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.name ILIKE $${params.length} OR oc.outfit_name ILIKE $${params.length})`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await pool.query(
            `SELECT COUNT(*)
             FROM rentals r
             JOIN "user" u            ON u.id  = r.user_id
             JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
             ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await pool.query(
            `SELECT
               r.id,
               u.name                                                          AS customer_name,
               u.phone_number                                                  AS customer_phone,
               oc.outfit_name,
               cat.category_name,
               r.start_date::text                                              AS start_date,
               (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
               r.duration_days,
               r.amount_to_be_paid,
               r.deposit_paid,
               r.deposit_refund,
               r.rental_status,
               r.rental_status                                                 AS status,
               t.id                                                            AS transaction_id,
               COALESCE(t.payment_method, 'cash')                             AS payment_method
             FROM rentals r
             JOIN "user" u              ON u.id   = r.user_id
             JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
             JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
             LEFT JOIN transactions t   ON t.rental_id = r.id
             ${where}
             ORDER BY r.id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        res.json({ rows: result.rows, total });
    } catch (err) {
        console.error("[getRentalsForAdmin]", err);
        res.status(500).json({ error: "Gagal memuat data sewa." });
    }
}

// ── GET RENTALS FOR CUSTOMER ───────────────────────────────────────────────
export async function getRentalsForCustomer(req, res) {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ error: "Silakan login." });
    }

    try {
        const result = await pool.query(
            `SELECT
               r.id,
               u.name                                                          AS customer_name,
               u.phone_number                                                  AS customer_phone,
               oc.outfit_name,
               cat.category_name,
               r.start_date::text                                              AS start_date,
               (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
               r.duration_days,
               r.amount_to_be_paid,
               r.deposit_paid,
               r.deposit_refund,
               r.rental_status,
               r.rental_status                                                 AS status,
               t.id                                                            AS transaction_id,
               COALESCE(t.payment_method, 'cash')                             AS payment_method
             FROM rentals r
             JOIN "user" u              ON u.id   = r.user_id
             JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
             JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
             LEFT JOIN transactions t   ON t.rental_id = r.id
             WHERE r.user_id = $1
             ORDER BY r.id DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("[getRentalsForCustomer]", err);
        res.status(500).json({ error: "Gagal memuat riwayat sewa." });
    }
}

// ── CREATE RENTAL (Customer) ──────────────────────────────────────────────
export async function createRental(req, res) {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID is missing." });
    }

    const { outfit_catalogues_id, start_date, duration_days, deposit_paid } = req.body;

    if (!outfit_catalogues_id || !start_date || !duration_days) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }

    // Validasi tanggal tidak boleh di masa lalu
    if (new Date(start_date) < new Date(new Date().toDateString())) {
        return res.status(400).json({ error: "Tanggal mulai tidak boleh di masa lalu" });
    }

    try {
        // Ambil data baju
        const outfitResult = await pool.query(
            `SELECT id, outfit_name, price FROM outfit_catalogues WHERE id = $1`,
            [outfit_catalogues_id]
        );
        if (!outfitResult.rows.length) {
            return res.status(404).json({ error: "Baju tidak ditemukan" });
        }

        const outfit = outfitResult.rows[0];
        const pricePerDay = parseFloat(outfit.price);
        const amount_to_be_paid = pricePerDay * duration_days;
        const actualDeposit = deposit_paid ?? 0;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insert rental
            const rentalResult = await client.query(
                `INSERT INTO rentals
                   (user_id, outfit_catalogues_id, start_date, duration_days,
                    amount_to_be_paid, deposit_paid, rental_status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                 RETURNING id`,
                [userId, outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, actualDeposit]
            );
            const rentalId = rentalResult.rows[0].id;

            // Insert transaksi
            await client.query(
                `INSERT INTO transactions
                   (user_id, rental_id, subtotal, total_amount, payment_method)
                 VALUES ($1, $2, $3, $3, 'cash')`,
                [userId, rentalId, amount_to_be_paid]
            );

            // Fetch user info for WA notification
            const userRes = await client.query(
                `SELECT name, phone_number, email FROM "user" WHERE id = $1`,
                [userId]
            );
            const dbUser = userRes.rows[0];

            // Tambahkan notifikasi sistem untuk Admin
            await client.query(
                `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
                 VALUES ('booking', 'Sewa Baju Baru', $1, $2, FALSE, NOW())`,
                [`Sewa baru dari ${dbUser.name} – ${outfit.outfit_name}`, rentalId]
            );

            await client.query("COMMIT");

            // Kirim notifikasi WhatsApp ke Pelanggan & Admin di background
            triggerRentalCreationNotification(
                rentalId, 
                userId, 
                outfit.outfit_name, 
                start_date, 
                duration_days, 
                amount_to_be_paid, 
                actualDeposit
            ).catch(err => 
                console.error("Failed to send rental creation WA notification:", err)
            );

            res.status(201).json({ rentalId });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("[createRental]", err);
        res.status(500).json({ error: "Terjadi kesalahan sistem. Silakan coba lagi." });
    }
}

// ── UPDATE RENTAL STATUS (Admin) ───────────────────────────────────────────
export async function updateRentalStatus(req, res) {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    const { id } = req.params;
    const { status, deposit_refund } = req.body;

    const valid = ["pending", "only_deposit", "ongoing", "terlambat", "done", "cancelled"];
    if (!valid.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid." });
    }

    try {
        let query;
        let queryParams;

        if (status === "done" && deposit_refund !== undefined && deposit_refund !== null) {
            query = `UPDATE rentals SET rental_status = $1, deposit_refund = $2 WHERE id = $3 RETURNING id, user_id`;
            queryParams = [status, deposit_refund, id];
        } else {
            query = `UPDATE rentals SET rental_status = $1 WHERE id = $2 RETURNING id, user_id`;
            queryParams = [status, id];
        }

        const result = await pool.query(query, queryParams);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan." });
        }

        // Kirim notifikasi WhatsApp ke Pelanggan di background
        triggerRentalStatusNotification(id, status, deposit_refund).catch((err) =>
            console.error("Failed to send rental status WA notification:", err)
        );

        // ── Reset VTO saat transaksi selesai ──
        if (status === "done") {
            const userId = result.rows[0].user_id;
            pool.query(
                `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
                [userId]
            ).catch((err) =>
                console.error("[updateRentalStatus] VTO reset failed:", err)
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error("[updateRentalStatus]", err);
        res.status(500).json({ error: "Gagal mengubah status." });
    }
}

// ── CANCEL RENTAL (Customer) ───────────────────────────────────────────────
export async function cancelRental(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: "Silakan login." });
    }

    try {
        const check = await pool.query(
            `SELECT id, rental_status FROM rentals WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        if (!check.rows.length) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan." });
        }
        if (check.rows[0].rental_status !== "pending") {
            return res.status(400).json({ error: "Hanya sewa berstatus pending yang dapat dibatalkan." });
        }

        await pool.query(
            `UPDATE rentals SET rental_status = 'cancelled' WHERE id = $1`,
            [id]
        );

        // Fetch user name
        const userRes = await pool.query(
            `SELECT name FROM "user" WHERE id = $1`,
            [userId]
        );
        const userName = userRes.rows[0]?.name || "Pelanggan";

        // Tambahkan notifikasi sistem untuk Admin
        await pool.query(
            `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
             VALUES ('booking', 'Sewa Baju Dibatalkan', $1, $2, FALSE, NOW())`,
            [`Sewa Baju #${id} telah dibatalkan oleh pelanggan ${userName}`, id]
        );

        // Kirim notifikasi pembatalan sewa ke Pelanggan dan Admin via WhatsApp
        triggerRentalCancelNotification(id).catch((err) =>
            console.error("Failed to send rental cancellation WA notification:", err)
        );

        res.json({ success: true });
    } catch (err) {
        console.error("[cancelRental]", err);
        res.status(500).json({ error: "Gagal membatalkan sewa." });
    }
}

// ── SYNC LATE RENTALS (Admin) ──────────────────────────────────────────────
export async function syncLateRentals(req, res) {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    try {
        const result = await pool.query(
            `UPDATE rentals
             SET rental_status = 'terlambat'
             WHERE rental_status = 'ongoing'
               AND (start_date + duration_days * INTERVAL '1 day')::date < CURRENT_DATE
             RETURNING id`
        );

        if (result.rows.length > 0) {
            for (const row of result.rows) {
                await pool.query(
                    `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
                     VALUES ('return', 'Keterlambatan Pengembalian', $1, $2, FALSE, NOW())`,
                    [`Sewa Baju #${row.id} terlambat dikembalikan`, row.id]
                );
            }
        }

        res.json({ success: true, updated: result.rows.length });
    } catch (err) {
        console.error("[syncLateRentals]", err);
        res.status(500).json({ error: "Gagal sync status terlambat." });
    }
}

// ── GET RENTAL BY ID (Customer / Admin) ────────────────────────────────────
export async function getRentalById(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const rentalId = parseInt(id, 10);
    if (isNaN(rentalId)) return res.status(400).json({ error: "ID tidak valid" });

    try {
        const result = await pool.query(
            `SELECT
               r.id,
               r.user_id,
               u.name           AS customer_name,
               u.email          AS customer_email,
               r.outfit_catalogues_id,
               oc.outfit_name,
               oc.image_url     AS outfit_image,
               oc.size,
               cat.category_name,
               r.start_date::text AS start_date,
               r.duration_days,
               (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
               r.amount_to_be_paid,
               r.deposit_paid,
               r.deposit_refund,
               r.rental_status,
               t.id             AS transaction_id,
               t.payment_method,
               t.total_amount,
               t.midtrans_status
             FROM rentals r
             JOIN "user" u          ON u.id  = r.user_id
             JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
             JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
             LEFT JOIN transactions t ON t.rental_id = r.id
             WHERE r.id = $1`,
            [rentalId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan" });
        }

        const rental = result.rows[0];

        // Customer only sees their own
        if (req.user.role !== "ADMIN" && rental.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json(rental);
    } catch (err) {
        console.error("[getRentalById]", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
