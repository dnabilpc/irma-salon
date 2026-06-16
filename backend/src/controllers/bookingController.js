// backend/src/controllers/bookingController.js
import pool from '../services/db.js';
import { sendWaMessage, getWhatsappStatus } from '../services/whatsappService.js';

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

async function sendBookingNotifications(bookingId, customer, datetimeStr, servicesList) {
    const bookingDate = new Date(datetimeStr);
    const formattedDate = bookingDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const formattedTime = bookingDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const timeStr = `${formattedDate} pukul ${formattedTime}`;

    // 1. Send to Customer
    if (customer.phone_number) {
        const customerMsg = `Halo *${customer.name}*,\n\nBooking Anda di *Irma Wedding Salon* telah berhasil dibuat dan berstatus *PENDING*:\n\n` +
            `📅 *Jadwal:* ${timeStr} WIB\n` +
            `💇‍♀️ *Layanan:* ${servicesList}\n\n` +
            `Kami akan mengirimkan notifikasi WhatsApp baru setelah booking Anda disetujui oleh Admin. Terima kasih! ✨`;
        try {
            await sendWaMessage(customer.phone_number, customerMsg);
        } catch (err) {
            console.error(`[WhatsApp API] Failed to notify customer:`, err.message);
        }
    }

    // 2. Send to Admin
    try {
        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg = `📢 *NOTIFIKASI BOOKING BARU* 📢\n\n` +
                `Pelanggan *${customer.name}* (${customer.phone_number || customer.email}) telah membuat booking baru:\n\n` +
                `🆔 *Booking ID:* #${bookingId}\n` +
                `📅 *Jadwal:* ${timeStr} WIB\n` +
                `💇‍♀️ *Layanan:* ${servicesList}\n\n` +
                `Silakan cek Halaman Admin Bookings untuk memproses persetujuan.`;
            await sendWaMessage(adminPhone, adminMsg);
        }
    } catch (e) {
        console.error("Failed to notify admin about new booking:", e);
    }
}

async function triggerBookingStatusNotification(bookingId, status, reason) {
    try {
        const bookingRes = await pool.query(
            `SELECT 
                 b.booking_datetime,
                 u.name as customer_name,
                 u.phone_number as customer_phone,
                 COALESCE(STRING_AGG(ss.service_name, ', '), '-') as services
             FROM bookings b
             JOIN "user" u ON b.user_id = u.id
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             LEFT JOIN salon_services ss ON bd.salon_service_id = ss.id
             WHERE b.id = $1
             GROUP BY b.id, b.booking_datetime, u.name, u.phone_number`,
            [bookingId]
        );

        if (bookingRes.rows.length === 0) return;
        const row = bookingRes.rows[0];
        if (!row.customer_phone) return;

        const bookingDate = new Date(row.booking_datetime);
        const formattedDate = bookingDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const formattedTime = bookingDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const timeStr = `${formattedDate} pukul ${formattedTime}`;

        let message = "";
        if (status === "confirmed") {
            message = `Halo *${row.customer_name}*,\n\nKabar baik! Booking Anda di *Irma Wedding Salon* telah *DISETUJUI* oleh Admin:\n\n` +
                `📅 *Jadwal:* ${timeStr} WIB\n` +
                `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                `Silakan datang ke Irma Wedding Salon sesuai dengan jadwal di atas. Sampai jumpa! ✨`;
        } else if (status === "rejected") {
            message = `Halo *${row.customer_name}*,\n\nMohon maaf, booking Anda di *Irma Wedding Salon* untuk jadwal *${timeStr} WIB* (layanan: ${row.services}) telah *DITOLAK* oleh Admin.\n\n` +
                `💬 *Alasan Penolakan:* ${reason || "-"}\n\n` +
                `Silakan membuat booking kembali untuk jadwal atau hari yang lain. Terima kasih.`;
        }

        if (message) {
            await sendWaMessage(row.customer_phone, message);
        }
    } catch (err) {
        console.error("Error in triggerBookingStatusNotification:", err);
    }
}

async function triggerBookingCancelNotification(bookingId) {
    try {
        const bookingRes = await pool.query(
            `SELECT 
                 b.booking_datetime,
                 u.name as customer_name,
                 u.phone_number as customer_phone,
                 u.email as customer_email,
                 COALESCE(STRING_AGG(ss.service_name, ', '), '-') as services
             FROM bookings b
             JOIN "user" u ON b.user_id = u.id
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             LEFT JOIN salon_services ss ON bd.salon_service_id = ss.id
             WHERE b.id = $1
             GROUP BY b.id, b.booking_datetime, u.name, u.phone_number, u.email`,
            [bookingId]
        );

        if (bookingRes.rows.length === 0) return;
        const row = bookingRes.rows[0];

        const bookingDate = new Date(row.booking_datetime);
        const formattedDate = bookingDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const formattedTime = bookingDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const timeStr = `${formattedDate} pukul ${formattedTime}`;

        // 1. Notify Customer
        if (row.customer_phone) {
            const customerMsg = `Halo *${row.customer_name}*,\n\nBooking Anda di *Irma Wedding Salon* untuk jadwal *${timeStr} WIB* (layanan: ${row.services}) telah berhasil *DIBATALKAN*. Terima kasih.`;
            await sendWaMessage(row.customer_phone, customerMsg);
        }

        // 2. Notify Admin
        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg = `🚨 *NOTIFIKASI PEMBATALAN BOOKING* 🚨\n\n` +
                `Pelanggan *${row.customer_name}* (${row.customer_phone || row.customer_email}) telah membatalkan booking berikut:\n\n` +
                `🆔 *Booking ID:* #${bookingId}\n` +
                `📅 *Jadwal Semula:* ${timeStr} WIB\n` +
                `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                `Status booking telah diperbarui menjadi CANCELLED.`;
            await sendWaMessage(adminPhone, adminMsg);
        }
    } catch (err) {
        console.error("Error in triggerBookingCancelNotification:", err);
    }
}

// ── GET SERVICES ───────────────────────────────────────────────────────────

export async function getSalonServices(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, service_name, price, hour_duration, image_url
             FROM salon_services
             ORDER BY service_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("[getSalonServices]", err);
        res.status(500).json({ error: "Gagal memuat layanan." });
    }
}

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────

export async function getAvailableSlots(req, res) {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" });
    }

    try {
        const nowJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const maxBookingDateObj = new Date(nowJakarta.getTime() + 21 * 24 * 60 * 60 * 1000);
        const maxBookingDateStr = maxBookingDateObj.getFullYear() + '-' + 
                                  String(maxBookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(maxBookingDateObj.getDate()).padStart(2, '0');

        if (date > maxBookingDateStr) {
            return res.json({
                date,
                available: [],
                booked: [],
                closed: true,
                message: "Jadwal booking tidak boleh lebih dari 3 minggu ke depan",
            });
        }

        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayOfWeek = dayNames[new Date(date).getDay()];

        const openCheck = await pool.query(
            `SELECT open_time, close_time FROM opening_time WHERE day_of_week = $1`,
            [dayOfWeek]
        );

        const closingCheck = await pool.query(
            `SELECT id FROM closing_time WHERE start_datetime <= $1::date AND end_datetime >= $1::date`,
            [date]
        );

        if (!openCheck.rows.length || closingCheck.rows.length > 0) {
            return res.json({
                date,
                available: [],
                booked: [],
                closed: true,
                message: closingCheck.rows.length > 0
                    ? "Salon tutup pada tanggal ini"
                    : "Salon tidak beroperasi pada hari ini",
            });
        }

        const openTime = openCheck.rows[0].open_time; // e.g. "08:00:00+07" or similar
        const closeTime = openCheck.rows[0].close_time;

        const cleanTime = (t) => t.split("+")[0].split(".")[0];
        const formattedOpen = cleanTime(openTime);
        const formattedClose = cleanTime(closeTime);

        const [openH, openM] = formattedOpen.split(":").map(Number);
        const [closeH, closeM] = formattedClose.split(":").map(Number);

        const ALL_SLOTS = [];
        let h = openH, m = openM;
        while (h < closeH || (h === closeH && m < closeM)) {
            ALL_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
            m += 30;
            if (m >= 60) {
                m -= 60;
                h++;
            }
        }

        const booked = await pool.query(
            `SELECT 
                TO_CHAR(b.booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS start_time,
                COALESCE(SUM(bd.duration_at_booking), 0.5) AS total_hours
             FROM bookings b
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             WHERE DATE(b.booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
               AND b.status NOT IN ('rejected', 'cancelled')
             GROUP BY b.id, b.booking_datetime`,
            [date]
        );

        const bookedSet = new Set();
        for (const row of booked.rows) {
            const [startH, startM] = row.start_time.split(":").map(Number);
            const totalMinutes = Math.round(parseFloat(row.total_hours) * 60);
            
            let currentMins = startH * 60 + startM;
            const endMins = currentMins + totalMinutes;
            
            while (currentMins < endMins) {
                const hStr = String(Math.floor(currentMins / 60)).padStart(2, "0");
                const mStr = String(currentMins % 60).padStart(2, "0");
                bookedSet.add(`${hStr}:${mStr}`);
                currentMins += 30;
            }
        }

        // Filter out past slots and slots less than 3 hours in the future
        const filteredSlots = ALL_SLOTS.filter((s) => {
            const slotDate = new Date(`${date}T${s}:00+07:00`);
            const diffMs = slotDate.getTime() - Date.now();
            // Must be at least 3 hours in the future
            return diffMs >= 3 * 60 * 60 * 1000;
        });

        const available = filteredSlots.filter((s) => !bookedSet.has(s));
        const finalBooked = filteredSlots.filter((s) => bookedSet.has(s));

        res.json({
            date,
            available,
            booked: finalBooked,
            closed: false,
            open_time: openTime,
            close_time: closeTime
        });
    } catch (err) {
        console.error("[getAvailableSlots]", err);
        res.status(500).json({ error: "Gagal memuat slot." });
    }
}

// ── CREATE BOOKING (Customer) ──────────────────────────────────────────────

export async function createBooking(req, res) {
    const userId = req.user.id;
    const { booking_datetime, service_ids, payment_method = 'cash' } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID is missing." });
    }
    if (!booking_datetime || !service_ids?.length) {
        return res.status(400).json({ error: "Data booking tidak lengkap." });
    }

    const validMethods = ['qris'];
    if (!validMethods.includes(payment_method)) {
        return res.status(400).json({ error: "Metode pembayaran tidak valid. Booking salon hanya menerima QRIS Statis." });
    }

    const bookingDate = new Date(booking_datetime);
    // 3 hours limit with a 5 minutes buffer
    const minBookingTime = new Date(Date.now() + 3 * 60 * 60 * 1000 - 5 * 60 * 1000);
    
    // 3 weeks limit (21 days boundary in Asia/Jakarta timezone)
    const targetDateJakarta = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const targetDateStr = targetDateJakarta.getFullYear() + '-' + 
                          String(targetDateJakarta.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(targetDateJakarta.getDate()).padStart(2, '0');

    const nowJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const maxBookingDateObj = new Date(nowJakarta.getTime() + 21 * 24 * 60 * 60 * 1000);
    const maxBookingDateStr = maxBookingDateObj.getFullYear() + '-' + 
                              String(maxBookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(maxBookingDateObj.getDate()).padStart(2, '0');

    if (bookingDate < minBookingTime) {
        return res.status(400).json({ error: "Booking harus dipesan minimal 3 jam sebelum waktu yang diinginkan." });
    }
    if (targetDateStr > maxBookingDateStr) {
        return res.status(400).json({ error: "Booking tidak boleh lebih dari 3 minggu ke depan." });
    }

    try {
        // Fetch services to calculate proposed duration
        const serviceRows = await pool.query(
            `SELECT id, service_name, price, hour_duration
             FROM salon_services WHERE id = ANY($1)`,
            [service_ids]
        );
        if (serviceRows.rows.length !== service_ids.length) {
            return res.status(400).json({ error: "Salah satu layanan tidak ditemukan." });
        }

        const proposedDurationHours = serviceRows.rows.reduce(
            (sum, s) => sum + parseFloat(s.hour_duration || 0.5),
            0
        );
        const proposedDurationMinutes = Math.round(proposedDurationHours * 60);

        const proposedStart = new Date(booking_datetime);
        const proposedEnd = new Date(proposedStart.getTime() + proposedDurationMinutes * 60 * 1000);

        // Fetch all active bookings on the same day to verify overlap (using Jakarta timezone)
        const tzDate = new Date(proposedStart.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const dateStr = tzDate.getFullYear() + '-' + 
                        String(tzDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(tzDate.getDate()).padStart(2, '0');

        const existingBookings = await pool.query(
            `SELECT b.id, b.booking_datetime, COALESCE(SUM(bd.duration_at_booking), 0.5) AS total_hours
             FROM bookings b
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             WHERE DATE(b.booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
               AND b.status NOT IN ('rejected', 'cancelled')
             GROUP BY b.id, b.booking_datetime`,
            [dateStr]
        );

        for (const existing of existingBookings.rows) {
            const start = new Date(existing.booking_datetime);
            const durationMins = Math.round(parseFloat(existing.total_hours) * 60);
            const end = new Date(start.getTime() + durationMins * 60 * 1000);

            // Check overlap: proposedStart < end AND start < proposedEnd
            if (proposedStart < end && start < proposedEnd) {
                return res.status(400).json({ error: "Slot waktu ini sudah terisi oleh booking lain. Silakan pilih waktu lain." });
            }
        }

        const subtotal = serviceRows.rows.reduce(
            (sum, s) => sum + parseFloat(s.price),
            0
        );

        const totalAmount = subtotal;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const bookingResult = await client.query(
                `INSERT INTO bookings (user_id, booking_datetime, status)
                 VALUES ($1, $2, 'pending')
                 RETURNING id`,
                [userId, booking_datetime]
            );
            const bookingId = bookingResult.rows[0].id;

            for (const svc of serviceRows.rows) {
                await client.query(
                    `INSERT INTO booking_details
                       (booking_id, salon_service_id, price_at_booking, duration_at_booking)
                     VALUES ($1, $2, $3, $4)`,
                    [bookingId, svc.id, svc.price, svc.hour_duration]
                );
            }

            // Fetch user info for WA notification
            const userRes = await client.query(
                `SELECT name, phone_number, email FROM "user" WHERE id = $1`,
                [userId]
            );
            const dbUser = userRes.rows[0];

            await client.query(
                `INSERT INTO transactions
                   (user_id, booking_id, subtotal, total_amount, payment_method, status)
                 VALUES ($1, $2, $3, $4, $5, 'pending')`,
                [userId, bookingId, subtotal, totalAmount, payment_method]
            );

            // Insert system notification for Admin
            const servicesList = serviceRows.rows.map((s) => s.service_name).join(", ");
            await client.query(
                `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
                 VALUES ('booking', 'Booking Baru', $1, $2, FALSE, NOW())`,
                [`Booking baru dari ${dbUser.name} – ${servicesList}`, bookingId]
            );

            await client.query("COMMIT");

            // Dispatch WhatsApp messages asynchronously
            sendBookingNotifications(bookingId, dbUser, booking_datetime, servicesList).catch((err) =>
                console.error("Failed sending booking WA notification:", err)
            );

            res.status(201).json({ 
                bookingId, 
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
        console.error("[createBooking]", err);
        res.status(500).json({ error: err.message || "Terjadi kesalahan sistem. Silakan coba lagi." });
    }
}

// ── UPDATE STATUS (Admin) ──────────────────────────────────────────────────

export async function updateBookingStatus(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Akses ditolak." });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const valid = ["pending", "confirmed", "rejected", "cancelled"];
    if (!valid.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid." });
    }

    try {
        const checkRes = await pool.query(
            `SELECT booking_datetime, status FROM bookings WHERE id = $1`,
            [id]
        );
        if (!checkRes.rows.length) {
            return res.status(404).json({ error: "Booking tidak ditemukan." });
        }
        const booking = checkRes.rows[0];

        if (status === "confirmed" && new Date(booking.booking_datetime) < new Date()) {
            return res.status(400).json({ error: "Tidak dapat menyetujui booking yang jadwalnya sudah terlewati (kedaluwarsa)." });
        }

        let query;
        let params;

        if (status === "rejected") {
            if (!reason) {
                return res.status(400).json({ error: "Alasan penolakan tidak boleh kosong." });
            }
            query = `UPDATE bookings SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING id`;
            params = [status, reason, id];
        } else {
            query = `UPDATE bookings SET status = $1, rejection_reason = NULL WHERE id = $2 RETURNING id`;
            params = [status, id];
        }

        const result = await pool.query(query, params);

        // WhatsApp notification (async)
        triggerBookingStatusNotification(id, status, reason).catch((err) =>
            console.error("Failed sending booking status WA notification:", err)
        );

        res.json({ success: true });
    } catch (err) {
        console.error("[updateBookingStatus]", err);
        res.status(500).json({ error: "Gagal mengubah status." });
    }
}

// ── CANCEL BOOKING (Customer) ──────────────────────────────────────────────

export async function cancelBooking(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    try {
        const check = await pool.query(
            `SELECT id, status FROM bookings WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        if (!check.rows.length) {
            return res.status(404).json({ error: "Booking tidak ditemukan." });
        }
        if (check.rows[0].status !== "pending") {
            return res.status(400).json({ error: "Hanya booking berstatus PENDING yang dapat dibatalkan." });
        }

        await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);

        // Add system notification for Admin
        await pool.query(
            `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
             VALUES ('booking', 'Booking Dibatalkan', $1, $2, FALSE, NOW())`,
            [`Booking #${id} telah dibatalkan oleh pelanggan`, id]
        );

        // WhatsApp notification (async)
        triggerBookingCancelNotification(id).catch((err) =>
            console.error("Failed sending booking cancel WA notification:", err)
        );

        res.json({ success: true });
    } catch (err) {
        console.error("[cancelBooking]", err);
        res.status(500).json({ error: "Gagal membatalkan booking." });
    }
}

// ── GET BOOKINGS FOR ADMIN ─────────────────────────────────────────────────

export async function getBookingsForAdmin(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Akses ditolak." });
    }

    try {
        // Auto-expire pending bookings in the past (e.g. 15 minutes past)
        await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled', rejection_reason = 'Booking kedaluwarsa (jadwal telah terlewati)'
             WHERE status = 'pending' AND booking_datetime < NOW() - INTERVAL '15 minutes'`
        );

        const status = req.query.status ?? "ALL";
        const search = req.query.search;
        const page = parseInt(req.query.page ?? "1", 10);
        const limit = parseInt(req.query.limit ?? "20", 10);
        const offset = (page - 1) * limit;

        const conditions = [];
        const params = [];

        if (status && status !== "ALL") {
            params.push(status);
            conditions.push(`b.status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`u.name ILIKE $${params.length}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM bookings b JOIN "user" u ON b.user_id = u.id ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await pool.query(
            `SELECT
               b.id,
               u.name              AS customer_name,
               u.email             AS phone_number,
               b.booking_datetime,
               b.status,
               COALESCE(STRING_AGG(ss.service_name, ', '), '-') AS services,
               COALESCE(t.total_amount, 0)     AS total_amount,
               COALESCE(t.payment_method, 'cash') AS payment_method,
               t.id                AS transaction_id
             FROM bookings b
             JOIN "user" u ON b.user_id = u.id
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
             LEFT JOIN transactions t     ON t.booking_id = b.id
             ${where}
             GROUP BY b.id, u.name, u.email, b.booking_datetime, b.status,
                      t.total_amount, t.payment_method, t.id
             ORDER BY b.booking_datetime DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        res.json({ rows: result.rows, total });
    } catch (err) {
        console.error("[getBookingsForAdmin]", err);
        res.status(500).json({ error: "Gagal memuat data booking." });
    }
}

// ── GET BOOKINGS FOR CUSTOMER ──────────────────────────────────────────────

export async function getBookingsForCustomer(req, res) {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    try {
        // Auto-expire pending bookings in the past (e.g. 15 minutes past)
        await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled', rejection_reason = 'Booking kedaluwarsa (jadwal telah terlewati)'
             WHERE status = 'pending' AND booking_datetime < NOW() - INTERVAL '15 minutes'`
        );

        const result = await pool.query(
            `SELECT
               b.id,
               b.booking_datetime,
               b.status,
               COALESCE(STRING_AGG(ss.service_name, ', '), '-') AS services,
               COALESCE(t.total_amount, 0)        AS total_amount,
               COALESCE(t.payment_method, 'cash') AS payment_method,
               t.id AS transaction_id
             FROM bookings b
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
             LEFT JOIN transactions t     ON t.booking_id = b.id
             WHERE b.user_id = $1
             GROUP BY b.id, b.booking_datetime, b.status,
                      t.total_amount, t.payment_method, t.id
             ORDER BY b.booking_datetime DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("[getBookingsForCustomer]", err);
        res.status(500).json({ error: "Gagal memuat riwayat booking." });
    }
}

// ── GET BOOKING BY ID (Customer / Admin) ───────────────────────────────────
export async function getBookingById(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
        return res.status(400).json({ error: "ID tidak valid" });
    }

    try {
        const result = await pool.query(
            `SELECT
               b.id,
               b.booking_datetime,
               b.status,
               b.user_id,
               u.name              AS customer_name,
               u.email,
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'service_name',  ss.service_name,
                   'price',         bd.price_at_booking,
                   'duration',      bd.duration_at_booking
                 )
               ) FILTER (WHERE ss.id IS NOT NULL) AS details,
               COALESCE(t.total_amount, 0)        AS total_amount,
               COALESCE(t.payment_method, 'cash') AS payment_method,
               t.status                           AS payment_status,
               t.id AS transaction_id
             FROM bookings b
             JOIN "user" u ON b.user_id = u.id
             LEFT JOIN booking_details bd ON bd.booking_id = b.id
             LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
             LEFT JOIN transactions t     ON t.booking_id = b.id
             WHERE b.id = $1
             GROUP BY b.id, b.booking_datetime, b.status, b.user_id,
                      u.name, u.email,
                      t.total_amount, t.payment_method, t.status, t.id`,
            [bookingId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: "Booking tidak ditemukan" });
        }

        const booking = result.rows[0];

        // Customer only sees their own
        if (req.user.role !== "admin" && booking.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json(booking);
    } catch (err) {
        console.error("[getBookingById]", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Endpoint to manually trigger and test WhatsApp reminders
 */
export async function triggerRemindersTest(req, res) {
    const { type } = req.query;
    const booking_id = req.query.booking_id || req.body.booking_id;

    try {
        const { 
            sendBookingReminders, 
            sendBooking3HourReminders,
            sendPickupReminders,
            sendReturnReminders,
            sendOverdueWarnings
        } = await import('../services/reminderCron.js');

        // If booking_id is provided, force-send reminders for that specific booking immediately (for testing)
        if (booking_id) {
            const bookingRes = await pool.query(`
                SELECT 
                    b.id, 
                    u.name as customer_name, 
                    u.phone_number as customer_phone, 
                    b.booking_datetime,
                    TO_CHAR(b.booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as booking_time,
                    COALESCE(STRING_AGG(ss.service_name, ', '), '-') as services
                FROM bookings b
                JOIN "user" u ON b.user_id = u.id
                LEFT JOIN booking_details bd ON bd.booking_id = b.id
                LEFT JOIN salon_services ss ON bd.salon_service_id = ss.id
                WHERE b.id = $1
                GROUP BY b.id, u.name, u.phone_number, b.booking_datetime
            `, [booking_id]);

            if (bookingRes.rows.length === 0) {
                return res.status(404).json({ error: `Booking dengan ID ${booking_id} tidak ditemukan.` });
            }

            const row = bookingRes.rows[0];
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            const dateObj = new Date(row.booking_datetime);
            const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
            
            const results = {};

            if (!type || type === '1d') {
                const message = `[TEST-1D] Halo *${row.customer_name}*, kami ingin mengingatkan bahwa Anda memiliki jadwal booking perawatan di *Irma Wedding Salon* untuk besok:\n\n` +
                    `📅 *Tanggal:* ${formattedDate}\n` +
                    `⏰ *Waktu:* ${row.booking_time} WIB\n` +
                    `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                    `Mohon datang tepat waktu ya. Sampai jumpa di Irma Wedding Salon! ✨`;
                await sendWaMessage(row.customer_phone, message);
                await pool.query('UPDATE bookings SET reminder_1d_sent = TRUE WHERE id = $1', [row.id]);
                results['1d'] = 'Sent successfully';
            }

            if (!type || type === '3h') {
                const message = `[TEST-3H] Halo *${row.customer_name}*, kami ingin mengingatkan bahwa jadwal booking perawatan Anda di *Irma Wedding Salon* akan dimulai dalam 3 jam lagi:\n\n` +
                    `📅 *Tanggal:* ${formattedDate}\n` +
                    `⏰ *Waktu:* ${row.booking_time} WIB\n` +
                    `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                    `Mohon datang tepat waktu ya. Sampai jumpa di Irma Wedding Salon! ✨`;
                await sendWaMessage(row.customer_phone, message);
                await pool.query('UPDATE bookings SET reminder_3h_sent = TRUE WHERE id = $1', [row.id]);
                results['3h'] = 'Sent successfully';
            }

            return res.json({ success: true, message: `Berhasil mengirim reminder uji coba untuk Booking #${booking_id}`, results });
        }

        // Otherwise, trigger the standard cron scans immediately and return what was triggered
        console.log('[Test API] Triggering normal reminder cron scans...');
        const scans = [];
        if (!type || type === '1d') {
            await sendBookingReminders();
            scans.push('1-day booking reminders');
        }
        if (!type || type === '3h') {
            await sendBooking3HourReminders();
            scans.push('3-hour booking reminders');
        }
        if (!type || type === 'pickup') {
            await sendPickupReminders();
            scans.push('rental pickup reminders');
        }
        if (!type || type === 'return') {
            await sendReturnReminders();
            scans.push('rental return reminders');
        }
        if (!type || type === 'overdue') {
            await sendOverdueWarnings();
            scans.push('rental overdue warnings');
        }

        return res.json({ success: true, message: 'Scan reminder berhasil dijalankan.', scans });
    } catch (err) {
        console.error('[triggerRemindersTest]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
