// backend/src/controllers/rentalController.js
import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';
import { sendInvoiceReceipt } from './paymentController.js';
import { generateInvoiceCode, generateRentalCode } from '../utils/transaction.js';

// ── Shared Helper to get Admin Phone ────────────────────────────────────────
async function getAdminPhone() {
    try {
        const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'salon_whatsapp' LIMIT 1");
        if (settingsRes.rows.length > 0 && settingsRes.rows[0].value) {
            const val = settingsRes.rows[0].value.trim();
            // Fallback to user table if the settings value is the default dummy placeholder
            if (val && val !== '628123456789' && val !== '08123456789' && val !== '8123456789') {
                return val;
            }
        }
    } catch (err) {
        console.error("Failed to query settings for admin phone:", err);
    }

    try {
        const adminRes = await pool.query(
            `SELECT phone_number FROM "user" 
             WHERE role = 'admin' AND phone_number IS NOT NULL AND phone_number != '' 
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
    amount
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

        if (customer.phone_number) {
            const customerMsg = `Halo *${customer.name}*,\n\nTerima kasih! Pemesanan sewa baju Anda di *Irma Wedding Salon* telah berhasil dibuat dan berstatus *PENDING*:\n\n` +
                `👗 *Baju Sewa:* ${outfitName}\n` +
                `📅 *Tanggal Mulai:* ${formattedStart}\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n` +
                `⏳ *Durasi:* ${durationDays} hari\n` +
                `💵 *Biaya Sewa:* ${amountRupiah}\n\n` +
                `Jaminan sewa (KTP asli) diserahkan langsung di salon saat pengambilan baju. Silakan selesaikan pelunasan biaya sewa Anda untuk memproses pemesanan. Terima kasih! ✨`;
            await sendWaMessage(customer.phone_number, customerMsg);
        }

        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg = `📢 *NOTIFIKASI SEWA BAJU BARU* 📢\n\n` +
                `Pelanggan *${customer.name}* (${customer.phone_number || customer.email}) telah memesan sewa baju baru:\n\n` +
                `🆔 *Sewa ID:* #${rentalId}\n` +
                `👗 *Baju Sewa:* ${outfitName}\n` +
                `📅 *Tanggal:* ${formattedStart} s.d ${formattedEnd} (${durationDays} hari)\n` +
                `💵 *Biaya Sewa:* ${amountRupiah}\n\n` +
                `Jaminan sewa (KTP asli) diselesaikan langsung di salon.\n` +
                `Silakan cek admin panel untuk memproses sewa.`;
            await sendWaMessage(adminPhone, adminMsg);
        }
    } catch (err) {
        console.error("Error sending rental creation notification:", err);
    }
}

async function triggerRentalStatusNotification(rentalId, status) {
    try {
        const rentalRes = await pool.query(
            `SELECT
                 r.id,
                 u.name as customer_name,
                 u.phone_number as customer_phone,
                 oc.outfit_name,
                 r.start_date,
                 r.duration_days,
                 r.amount_to_be_paid
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

        let message = "";

        if (status === "ongoing") {
            message = `Halo *${row.customer_name}*,\n\nBaju sewa Anda: *${row.outfit_name}* telah berhasil diambil! Mohon jaga baju sewa tersebut dengan baik:\n\n` +
                `📅 *Tanggal Ambil:* ${formattedStart}\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n` +
                `⏳ *Durasi:* ${row.duration_days} hari\n\n` +
                `Selamat mengenakan! Mohon dikembalikan tepat waktu ya. Terima kasih! 💖`;
        } else if (status === "done") {
            message = `Halo *${row.customer_name}*,\n\nTransaksi sewa baju Anda: *${row.outfit_name}* telah *SELESAI*:\n\n` +
                `📅 *Batas Kembali:* ${formattedEnd}\n\n` +
                `Baju sewa telah kami terima kembali dengan baik. Terima kasih telah menyewa di Irma Wedding Salon! ✨`;
        } else if (status === "terlambat") {
            message = `Halo *${row.customer_name}*,\n\nStatus sewa baju Anda: *${row.outfit_name}* saat ini terdeteksi *TERLAMBAT*:\n\n` +
                `📅 *Batas Pengembalian:* ${formattedEnd}\n\n` +
                `Mohon segera mengembalikan baju sewa tersebut ke Irma Wedding Salon untuk menghindari denda yang terus bertambah. Terima kasih.`;
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
    if (req.user.role !== 'admin') {
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

        let limitClause = "";
        let queryParams = [...params];
        if (limit > 0) {
            limitClause = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            queryParams.push(limit, offset);
        }

        const result = await pool.query(
            `SELECT
               r.id,
               r.code                                                          AS rental_code,
               r.created_at,
               r.outfit_catalogues_id,
               u.name                                                          AS customer_name,
               u.phone_number                                                  AS customer_phone,
               oc.outfit_name,
               cat.category_name,
               r.start_date::text                                              AS start_date,
               (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
               r.duration_days,
               r.amount_to_be_paid,
               r.rental_status,
               r.rental_status                                                 AS status,
               t.id                                                            AS transaction_id,
               COALESCE(t.payment_method, 'cash')                             AS payment_method,
               t.payment_proof_sent,
               t.payment_proof_url,
               t.status                                                        AS payment_status
             FROM rentals r
             JOIN "user" u              ON u.id   = r.user_id
             JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
             JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
             LEFT JOIN transactions t   ON t.rental_id = r.id
             ${where}
             ORDER BY r.created_at DESC
             ${limitClause}`,
            queryParams
        );

        // Calculate global stats
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total,
                COUNT(CASE WHEN rental_status = 'ongoing' THEN 1 END)::int AS ongoing,
                COUNT(CASE WHEN rental_status = 'terlambat' THEN 1 END)::int AS terlambat
            FROM rentals
        `);
        
        const revenueRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0)::numeric AS revenue
            FROM transactions
            WHERE rental_id IS NOT NULL AND status = 'lunas'
        `);

        const stats = {
            total: statsRes.rows[0].total,
            ongoing: statsRes.rows[0].ongoing,
            terlambat: statsRes.rows[0].terlambat,
            revenue: parseFloat(revenueRes.rows[0].revenue) || 0
        };

        res.json({ rows: result.rows, total, stats });
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
               r.outfit_catalogues_id,
               u.name                                                          AS customer_name,
               u.phone_number                                                  AS customer_phone,
               oc.outfit_name,
               cat.category_name,
               r.start_date::text                                              AS start_date,
               (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
               r.duration_days,
               r.amount_to_be_paid,
               r.rental_status,
               r.rental_status                                                 AS status,
               COALESCE(t.uuid::text, t.id::text)                              AS transaction_id,
               COALESCE(t.payment_method, 'cash')                             AS payment_method,
               COALESCE(t.status, 'pending')                                   AS payment_status
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

    const { outfit_catalogues_id, start_date, duration_days, payment_method = 'cash' } = req.body;

    if (!outfit_catalogues_id || !start_date || !duration_days) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }

    const validMethods = ['cash', 'qris'];
    if (!validMethods.includes(payment_method)) {
        return res.status(400).json({ error: "Metode pembayaran tidak valid. Penyewaan hanya menerima cash atau qris." });
    }

    // Validasi tanggal tidak boleh di masa lalu
    if (new Date(start_date) < new Date(new Date().toDateString())) {
        return res.status(400).json({ error: "Tanggal mulai tidak boleh di masa lalu" });
    }

    try {
        // Cek tumpang tindih sewa aktif pada tanggal yang diajukan
        const overlapRes = await pool.query(
            `SELECT COUNT(*) FROM rentals
             WHERE outfit_catalogues_id = $1
               AND rental_status NOT IN ('cancelled')
               AND start_date <= $2::date + $3 * INTERVAL '1 day'
               AND start_date + duration_days * INTERVAL '1 day' >= $2::date`,
            [outfit_catalogues_id, start_date, duration_days]
        );
        const overlappingCount = parseInt(overlapRes.rows[0].count, 10);

        // Ambil data baju
        const outfitResult = await pool.query(
            `SELECT id, outfit_name, price, stock FROM outfit_catalogues WHERE id = $1`,
            [outfit_catalogues_id]
        );
        if (!outfitResult.rows.length) {
            return res.status(404).json({ error: "Baju tidak ditemukan" });
        }

        const outfit = outfitResult.rows[0];
        const stock = outfit.stock !== null ? parseInt(outfit.stock, 10) : 1;

        if (overlappingCount >= stock) {
            return res.status(400).json({
                error: `Stok baju tidak tersedia untuk tanggal tersebut karena sudah penuh disewa. (Stok: ${stock}, Tersewa: ${overlappingCount})`
            });
        }

        const pricePerDay = parseFloat(outfit.price);
        const amount_to_be_paid = pricePerDay * duration_days;

        const totalAmount = amount_to_be_paid;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const rentalCode = generateRentalCode();
            // Insert rental
            const rentalResult = await client.query(
                `INSERT INTO rentals
                   (user_id, outfit_catalogues_id, start_date, duration_days,
                    amount_to_be_paid, rental_status, code)
                 VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                 RETURNING id, code`,
                [userId, outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, rentalCode]
            );
            const rentalId = rentalResult.rows[0].id;

            // Fetch user info for WA notification
            const userRes = await client.query(
                `SELECT name, phone_number, email FROM "user" WHERE id = $1`,
                [userId]
            );
            const dbUser = userRes.rows[0];

            const invoiceCode = generateInvoiceCode();
            // Insert transaksi
            const txResult = await client.query(
                `INSERT INTO transactions
                   (user_id, rental_id, subtotal, total_amount, payment_method, status, uuid)
                 VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                 RETURNING id, uuid`,
                [userId, rentalId, amount_to_be_paid, totalAmount, payment_method, invoiceCode]
            );
            const transactionId = txResult.rows[0].uuid;

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
                amount_to_be_paid
            ).catch(err => 
                console.error("Failed to send rental creation WA notification:", err)
            );

            res.status(201).json({ 
                rentalId, 
                transactionId,
                token: null, 
                redirect_url: null 
            });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("[createRental]", err);
        res.status(500).json({ error: err.message || "Terjadi kesalahan sistem. Silakan coba lagi." });
    }
}

// ── UPDATE RENTAL STATUS (Admin) ───────────────────────────────────────────
export async function updateRentalStatus(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    const { id } = req.params;
    const { status, confirm_payment } = req.body;

    const valid = ["pending", "ongoing", "terlambat", "done", "cancelled"];
    if (!valid.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid." });
    }

    try {
        // Fetch current rental details to check start_date
        const checkRes = await pool.query(
            `SELECT start_date, rental_status, rental_order_id FROM rentals WHERE id = $1`,
            [id]
        );
        if (!checkRes.rows.length) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan." });
        }
        const rental = checkRes.rows[0];

        // Format today's date in local time YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Format start_date in YYYY-MM-DD
        const startDateStr = rental.start_date instanceof Date
            ? rental.start_date.toISOString().split('T')[0]
            : new Date(rental.start_date).toISOString().split('T')[0];

        // Block setting to ongoing/done if the start date hasn't arrived yet
        if (startDateStr > todayStr) {
            if (status === 'ongoing') {
                return res.status(400).json({
                    error: "Baju belum dapat diambil/dipinjam sebelum tanggal peminjaman dimulai."
                });
            }
            if (status === 'done') {
                return res.status(400).json({
                    error: "Baju tidak dapat ditandai sebagai dikembalikan sebelum tanggal peminjaman dimulai."
                });
            }
        }

        if (status === "cancelled") {
            const paidRes = await pool.query(
                `SELECT t.status AS payment_status 
                 FROM rentals r
                 LEFT JOIN transactions t ON t.rental_id = r.id OR t.rental_order_id = r.rental_order_id
                 WHERE r.id = $1 AND t.status = 'lunas'`,
                [id]
            );
            if (paidRes.rows.length > 0) {
                return res.status(400).json({ error: "Sewa pakaian tidak dapat dibatalkan karena sudah dibayar (Lunas)." });
            }
        }

        const query = `UPDATE rentals SET rental_status = $1 WHERE id = $2 RETURNING id, user_id`;
        const queryParams = [status, id];

        const result = await pool.query(query, queryParams);

        // If confirm_payment is requested, set transaction status to lunas & send invoice WA
        if (confirm_payment && (status === "ongoing" || status === "done")) {
            let txRes;
            if (rental.rental_order_id) {
                txRes = await pool.query(
                    `UPDATE transactions SET status = 'lunas' WHERE rental_order_id = $1 RETURNING id`,
                    [rental.rental_order_id]
                );
            } else {
                txRes = await pool.query(
                    `UPDATE transactions SET status = 'lunas' WHERE rental_id = $1 RETURNING id`,
                    [id]
                );
            }
            if (txRes.rows.length > 0) {
                sendInvoiceReceipt(txRes.rows[0].id).catch((err) =>
                    console.error("[updateRentalStatus] Failed sending WA invoice:", err)
                );
            }
        }

        let penaltyInfo = null;

        // ── Reset VTO & Hitung Denda Keterlambatan saat transaksi selesai ──
        if (status === "done") {
            const userId = result.rows[0].user_id;

            // Check late return penalty
            try {
                const rentalDetail = await pool.query(
                    `SELECT r.id, r.start_date, r.duration_days, r.amount_to_be_paid, r.outfit_catalogues_id, oc.price AS daily_price, oc.outfit_name, u.name AS customer_name
                     FROM rentals r
                     JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
                     LEFT JOIN "user" u ON u.id = r.user_id
                     WHERE r.id = $1`,
                    [id]
                );

                if (rentalDetail.rows.length > 0) {
                    const rData = rentalDetail.rows[0];
                    const startDate = new Date(rData.start_date);
                    const originalDuration = Number(rData.duration_days);

                    const expectedEndDate = new Date(startDate);
                    expectedEndDate.setDate(expectedEndDate.getDate() + originalDuration);
                    expectedEndDate.setHours(0, 0, 0, 0);

                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);

                    if (currentDate > expectedEndDate) {
                        const diffTime = currentDate.getTime() - expectedEndDate.getTime();
                        const lateDays = Math.ceil(diffTime / (1000 * 3600 * 24));

                        if (lateDays > 0) {
                            const dailyPrice = Number(rData.daily_price);
                            const penaltyAmount = lateDays * dailyPrice;
                            const newDuration = originalDuration + lateDays;
                            const newTotal = Number(rData.amount_to_be_paid) + penaltyAmount;

                            await pool.query(
                                `UPDATE rentals 
                                 SET duration_days = $1, amount_to_be_paid = $2 
                                 WHERE id = $3`,
                                [newDuration, newTotal, id]
                            );

                            await pool.query(
                                `UPDATE transactions 
                                 SET total_amount = $1 
                                 WHERE rental_id = $2`,
                                [newTotal, id]
                            );

                            penaltyInfo = {
                                lateDays,
                                penaltyAmount,
                                newTotal,
                                newDuration
                            };

                            const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

                            await pool.query(
                                `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
                                 VALUES ('return', 'Denda Keterlambatan Sewa', $1, $2, FALSE, NOW())`,
                                [`Pengembalian Sewa Baju #${id} terlambat ${lateDays} hari. Denda sebesar ${formatRupiah(penaltyAmount)} telah ditambahkan ke tagihan.`, id]
                            );
                        }
                    }
                }
            } catch (pErr) {
                console.error("[updateRentalStatus] Penalty calculation error:", pErr);
            }

        }

        // Kirim notifikasi WhatsApp ke Pelanggan di background
        triggerRentalStatusNotification(id, status).catch((err) =>
            console.error("Failed to send rental status WA notification:", err)
        );

        res.json({ success: true, penalty: penaltyInfo });
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
            `SELECT r.id, r.rental_status, t.status AS payment_status 
             FROM rentals r
             LEFT JOIN transactions t ON t.rental_id = r.id
             WHERE r.id = $1 AND r.user_id = $2`,
            [id, userId]
        );
        if (!check.rows.length) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan." });
        }
        
        const rental = check.rows[0];
        const isPending = rental.rental_status === "pending";
        const isOngoing = rental.rental_status === "ongoing";
        const isPaid = rental.payment_status === "lunas";

        // Can cancel if: (status is pending) OR (status is ongoing AND payment is not lunas)
        const canCancel = isPending || (isOngoing && !isPaid);

        if (!canCancel) {
            return res.status(400).json({ 
                error: "Penyewaan tidak dapat dibatalkan karena sudah disetujui dan dibayar." 
            });
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
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    try {
        const result = await pool.query(
            `UPDATE rentals
             SET rental_status = 'terlambat'
             WHERE rental_status = 'ongoing'
               AND (start_date + duration_days * INTERVAL '1 day')::date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date
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
               r.rental_status,
               t.id             AS transaction_id,
               t.payment_method,
               t.total_amount,
               t.status         AS payment_status
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
        if (req.user.role !== "admin" && rental.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json(rental);
    } catch (err) {
        console.error("[getRentalById]", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function updateRentalByCustomer(req, res) {
    const userId = req.user.id;
    const { id: rentalId } = req.params;
    const { outfit_catalogues_id, start_date, duration_days } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID is missing." });
    }
    if (!outfit_catalogues_id || !start_date || !duration_days) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }

    // Validasi tanggal tidak boleh di masa lalu
    if (new Date(start_date) < new Date(new Date().toDateString())) {
        return res.status(400).json({ error: "Tanggal mulai tidak boleh di masa lalu" });
    }

    try {
        // Fetch existing rental
        const rentalRes = await pool.query(
            `SELECT r.id, r.user_id, r.rental_status, t.id AS transaction_id, t.status AS payment_status
             FROM rentals r
             LEFT JOIN transactions t ON t.rental_id = r.id
             WHERE r.id = $1`,
            [rentalId]
        );

        if (rentalRes.rows.length === 0) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan" });
        }

        const rental = rentalRes.rows[0];

        // Otorisasi kepemilikan
        if (rental.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden: Anda tidak berwenang mengedit rental ini." });
        }

        // Hanya bisa edit jika status pending
        if (rental.rental_status !== 'pending') {
            return res.status(400).json({ error: "Penyewaan yang sudah disetujui atau diproses tidak dapat diubah." });
        }

        // Cek ketersediaan stok baju (tumpang tindih) excluding this rental
        const overlapRes = await pool.query(
            `SELECT COUNT(*) FROM rentals
             WHERE outfit_catalogues_id = $1
               AND rental_status NOT IN ('cancelled')
               AND start_date <= $2::date + $3 * INTERVAL '1 day'
               AND start_date + duration_days * INTERVAL '1 day' >= $2::date
               AND id != $4`,
            [outfit_catalogues_id, start_date, duration_days, rentalId]
        );
        const overlappingCount = parseInt(overlapRes.rows[0].count, 10);

        // Ambil data baju
        const outfitResult = await pool.query(
            `SELECT id, outfit_name, price, stock FROM outfit_catalogues WHERE id = $1`,
            [outfit_catalogues_id]
        );
        if (!outfitResult.rows.length) {
            return res.status(404).json({ error: "Baju tidak ditemukan" });
        }

        const outfit = outfitResult.rows[0];
        const stock = outfit.stock !== null ? parseInt(outfit.stock, 10) : 1;

        if (overlappingCount >= stock) {
            return res.status(400).json({
                error: `Stok baju tidak tersedia untuk tanggal tersebut karena sudah penuh disewa. (Stok: ${stock}, Tersewa: ${overlappingCount})`
            });
        }

        const pricePerDay = parseFloat(outfit.price);
        const amount_to_be_paid = pricePerDay * duration_days;
        const totalAmount = amount_to_be_paid;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Update rental
            await client.query(
                `UPDATE rentals
                 SET outfit_catalogues_id = $1, start_date = $2, duration_days = $3, amount_to_be_paid = $4
                 WHERE id = $5`,
                [outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, rentalId]
            );

            // Update transaction
            if (rental.transaction_id) {
                await client.query(
                    `UPDATE transactions
                     SET subtotal = $1, total_amount = $2
                     WHERE id = $3`,
                    [amount_to_be_paid, totalAmount, rental.transaction_id]
                );
            }

            await client.query("COMMIT");
            return res.json({ success: true, message: "Penyewaan baju berhasil diperbarui." });
        } catch (trxErr) {
            await client.query("ROLLBACK");
            throw trxErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("[updateRentalByCustomer]", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

export async function updateRentalByAdmin(req, res) {
    const { id: rentalId } = req.params;
    const { outfit_catalogues_id, start_date, duration_days } = req.body;

    if (!outfit_catalogues_id || !start_date || !duration_days) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }

    try {
        // Fetch existing rental
        const rentalRes = await pool.query(
            `SELECT r.id, r.start_date, r.duration_days, t.id AS transaction_id
             FROM rentals r
             LEFT JOIN transactions t ON t.rental_id = r.id
             WHERE r.id = $1`,
            [rentalId]
        );

        if (rentalRes.rows.length === 0) {
            return res.status(404).json({ error: "Data sewa tidak ditemukan" });
        }

        const rental = rentalRes.rows[0];

        // Pastikan durasi sewa belum berakhir (belum terlewat)
        const rentalEndDate = new Date(rental.start_date);
        rentalEndDate.setDate(rentalEndDate.getDate() + parseInt(rental.duration_days, 10));
        
        if (rentalEndDate < new Date()) {
            return res.status(400).json({ error: "Penyewaan yang durasinya sudah terlewat tidak dapat diedit." });
        }

        // Cek ketersediaan stok baju (tumpang tindih) excluding this rental
        const overlapRes = await pool.query(
            `SELECT COUNT(*) FROM rentals
             WHERE outfit_catalogues_id = $1
               AND rental_status NOT IN ('cancelled')
               AND start_date <= $2::date + $3 * INTERVAL '1 day'
               AND start_date + duration_days * INTERVAL '1 day' >= $2::date
               AND id != $4`,
            [outfit_catalogues_id, start_date, duration_days, rentalId]
        );
        const overlappingCount = parseInt(overlapRes.rows[0].count, 10);

        // Ambil data baju
        const outfitResult = await pool.query(
            `SELECT id, outfit_name, price, stock FROM outfit_catalogues WHERE id = $1`,
            [outfit_catalogues_id]
        );
        if (!outfitResult.rows.length) {
            return res.status(404).json({ error: "Baju tidak ditemukan" });
        }

        const outfit = outfitResult.rows[0];
        const stock = outfit.stock !== null ? parseInt(outfit.stock, 10) : 1;

        if (overlappingCount >= stock) {
            return res.status(400).json({
                error: `Stok baju tidak tersedia untuk tanggal tersebut karena sudah penuh disewa. (Stok: ${stock}, Tersewa: ${overlappingCount})`
            });
        }

        const pricePerDay = parseFloat(outfit.price);
        const amount_to_be_paid = pricePerDay * duration_days;
        const totalAmount = amount_to_be_paid;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Update rental
            await client.query(
                `UPDATE rentals
                 SET outfit_catalogues_id = $1, start_date = $2, duration_days = $3, amount_to_be_paid = $4
                 WHERE id = $5`,
                [outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, rentalId]
            );

            // Update transaction
            if (rental.transaction_id) {
                await client.query(
                    `UPDATE transactions
                     SET subtotal = $1, total_amount = $2
                     WHERE id = $3`,
                    [amount_to_be_paid, totalAmount, rental.transaction_id]
                );
            }

            await client.query("COMMIT");
            return res.json({ success: true, message: "Penyewaan baju berhasil diperbarui oleh Admin." });
        } catch (trxErr) {
            await client.query("ROLLBACK");
            throw trxErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("[updateRentalByAdmin]", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}
