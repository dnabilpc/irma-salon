import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';

export async function getClosingTimes(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, start_datetime::text, end_datetime::text, reason 
             FROM closing_time 
             ORDER BY start_datetime DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[getClosingTimes]', err);
        res.status(500).json({ error: 'Gagal memuat daftar hari libur.' });
    }
}

export async function deleteClosingTime(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Akses ditolak.' });
    }

    const { id } = req.params;
    try {
        await pool.query('DELETE FROM closing_time WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[deleteClosingTime]', err);
        res.status(500).json({ error: 'Gagal menghapus hari libur.' });
    }
}

export async function createClosingTime(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Akses ditolak.' });
    }

    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date || !reason) {
        return res.status(400).json({ error: 'Data hari libur tidak lengkap.' });
    }

    const start_datetime = `${start_date} 00:00:00+07`;
    const end_datetime = `${end_date} 23:59:59+07`;

    try {
        const insertRes = await pool.query(
            `INSERT INTO closing_time (start_datetime, end_datetime, reason) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [start_datetime, end_datetime, reason]
        );

        // Run notifications asynchronously in background
        triggerClosingTimeAnnouncements(start_date, end_date, reason).catch((e) => {
            console.error('[WhatsApp Announcement] Failed:', e);
        });

        res.status(201).json({ success: true, closingId: insertRes.rows[0].id });
    } catch (err) {
        console.error('[createClosingTime]', err);
        res.status(500).json({ error: 'Gagal menambahkan hari libur.' });
    }
}

async function triggerClosingTimeAnnouncements(startDateStr, endDateStr, reason) {
    console.log(`[Announcements] Scanning for affected customers between ${startDateStr} and ${endDateStr}...`);
    
    // Formatting start/end date for display
    const formatDateStr = (dStr) => {
        const d = new Date(dStr);
        return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    const startDisplay = formatDateStr(startDateStr);
    const endDisplay = formatDateStr(endDateStr);
    const dateRangeDisplay = startDateStr === endDateStr ? startDisplay : `${startDisplay} s.d ${endDisplay}`;

    // 1. Notify affected bookings
    const bookingsRes = await pool.query(
        `SELECT DISTINCT 
           u.name,
           u.phone_number,
           b.id AS booking_id,
           b.booking_datetime
         FROM bookings b
         JOIN "user" u ON b.user_id = u.id
         WHERE b.status IN ('pending', 'confirmed')
           AND b.booking_datetime::date >= $1::date
           AND b.booking_datetime::date <= $2::date
           AND u.phone_number IS NOT NULL AND u.phone_number != ''`,
        [startDateStr, endDateStr]
    );

    for (const b of bookingsRes.rows) {
        const bDate = new Date(b.booking_datetime);
        const formattedDate = bDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = bDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
        const timeStr = `${formattedDate} pukul ${formattedTime} WIB`;

        const msg = `Halo *${b.name}*,\n\nKami ingin menginfokan bahwa *Rumah Cantik Irma* akan tutup pada *${dateRangeDisplay}* karena *${reason}*.\n\n` +
            `Jadwal *Booking* Anda pada *${timeStr}* terkena penyesuaian.\n\n` +
            `Silakan hubungi kami di nomor ini untuk melakukan reschedule. Mohon maaf atas ketidaknyamanannya. Terima kasih. ✨`;

        try {
            await sendWaMessage(b.phone_number, msg);
        } catch (e) {
            console.error(`[WA-Booking] Failed for ${b.phone_number}:`, e.message);
        }
    }

    // 2. Notify affected rentals
    const rentalsRes = await pool.query(
        `SELECT DISTINCT
           u.name,
           u.phone_number,
           r.id AS rental_id,
           r.start_date::text AS start_date,
           r.duration_days
         FROM rentals r
         JOIN "user" u ON r.user_id = u.id
         WHERE r.rental_status IN ('pending', 'ongoing')
           AND (r.start_date - INTERVAL '1 day')::date <= $2::date
           AND (r.start_date + INTERVAL '1 day')::date >= $1::date
           AND u.phone_number IS NOT NULL AND u.phone_number != ''`,
        [startDateStr, endDateStr]
    );

    for (const r of rentalsRes.rows) {
        const eventDate = new Date(r.start_date);
        const pickupDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
        const returnDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);

        const eventDateStr = eventDate.toISOString().split('T')[0];
        const pickupDateStr = pickupDate.toISOString().split('T')[0];
        const returnDateStr = returnDate.toISOString().split('T')[0];

        // Format dates for display
        const displayEvent = formatDateStr(eventDateStr);
        const displayPickup = formatDateStr(pickupDateStr);
        const displayReturn = formatDateStr(returnDateStr);

        let eventText = `Jadwal sewa Anda (acara tanggal *${displayEvent}*)`;
        
        const pickupFalls = pickupDateStr >= startDateStr && pickupDateStr <= endDateStr;
        const returnFalls = returnDateStr >= startDateStr && returnDateStr <= endDateStr;

        if (pickupFalls && returnFalls) {
            eventText = `Jadwal *Pengambilan* (tanggal *${displayPickup}*) & *Pengembalian* (tanggal *${displayReturn}*) baju sewa Anda`;
        } else if (pickupFalls) {
            eventText = `Jadwal *Pengambilan* baju sewa Anda (tanggal *${displayPickup}*)`;
        } else if (returnFalls) {
            eventText = `Jadwal *Pengembalian* baju sewa Anda (tanggal *${displayReturn}*)`;
        }

        const msg = `Halo *${r.name}*,\n\nKami ingin menginfokan bahwa *Rumah Cantik Irma* akan tutup pada *${dateRangeDisplay}* karena *${reason}*.\n\n` +
            `${eventText} terkena penyesuaian.\n\n` +
            `Silakan hubungi kami di nomor ini untuk koordinasi penyesuaian jadwal sewa Anda. Mohon maaf atas ketidaknyamanannya. Terima kasih. ✨`;

        try {
            await sendWaMessage(r.phone_number, msg);
        } catch (e) {
            console.error(`[WA-Rental] Failed for ${r.phone_number}:`, e.message);
        }
    }
}
