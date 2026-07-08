// backend/src/services/reminderCron.js
import cron from 'node-cron';
import pool from './db.js';
import { sendWaMessage, getWhatsappStatus } from './whatsappService.js';
import { deleteFromSupabaseStorage } from './storageService.js';

export function initScheduler() {
    console.log('[Scheduler] Initializing cron jobs...');

    // Run every day at 08:00 AM local time (WIB - Western Indonesian Time)
    // Format: 'minute hour day-of-month month day-of-week'
    // '0 8 * * *' = 08:00 every day
    cron.schedule('0 8 * * *', async () => {
        console.log('[Scheduler] Running daily WhatsApp reminder jobs...');
        
        const state = getWhatsappStatus();
        if (state.status !== 'READY') {
            console.error('[Scheduler] WhatsApp client is not READY. Skipping reminders.');
            return;
        }

        try {
            await sendBookingReminders();
            await sendPickupReminders();
            await sendReturnReminders();
            await sendOverdueWarnings();
        } catch (err) {
            console.error('[Scheduler] Error running reminder jobs:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta" // Set timezone to Jakarta
    });

    // Run daily at midnight to clean up VTO tasks and files older than 30 days
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Running daily VTO cleanup job...');
        try {
            // Find VTO tasks older than 30 days
            const res = await pool.query(`
                SELECT id, person_image_url, result_image_url 
                FROM vto_tasks 
                WHERE created_at < NOW() - INTERVAL '30 days'
            `);

            if (res.rows.length > 0) {
                console.log(`[Scheduler] Found ${res.rows.length} VTO tasks older than 30 days for cleanup.`);
                
                const filePathsToDelete = [];
                const bucketName = process.env.SUPABASE_BUCKET || 'irma-salon';
                const marker = `/object/public/${bucketName}/`;

                for (const row of res.rows) {
                    // Extract person_image_url storage path
                    if (row.person_image_url && row.person_image_url.includes(marker)) {
                        const path = row.person_image_url.substring(row.person_image_url.indexOf(marker) + marker.length);
                        filePathsToDelete.push(path);
                    }
                    // Extract result_image_url storage path
                    if (row.result_image_url && row.result_image_url.includes(marker)) {
                        const path = row.result_image_url.substring(row.result_image_url.indexOf(marker) + marker.length);
                        filePathsToDelete.push(path);
                    }
                }

                // Delete from Supabase Storage
                if (filePathsToDelete.length > 0) {
                    console.log(`[Scheduler] Deleting ${filePathsToDelete.length} VTO files from Supabase Storage...`);
                    await deleteFromSupabaseStorage(filePathsToDelete);
                }

                // Delete the tasks from database
                const deleteRes = await pool.query(`
                    DELETE FROM vto_tasks 
                    WHERE created_at < NOW() - INTERVAL '30 days'
                `);
                console.log(`[Scheduler] Deleted ${deleteRes.rowCount} VTO tasks from database.`);
            }
        } catch (err) {
            console.error('[Scheduler] Error running VTO cleanup job:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    // Run every hour to check 3-hour reminders and auto-expire pending bookings in the past
    cron.schedule('0 * * * *', async () => {
        console.log('[Scheduler] Running hourly booking expiration & 3-hour reminder jobs...');
        
        // 1. Expiration job
        try {
            const resBookings = await pool.query(`
                UPDATE bookings 
                SET status = 'cancelled', rejection_reason = 'Booking kedaluwarsa (jadwal telah terlewati)'
                WHERE status = 'pending' AND booking_datetime < NOW() - INTERVAL '15 minutes'
            `);
            if (resBookings.rowCount > 0) {
                console.log(`[Scheduler] Auto-expired ${resBookings.rowCount} pending bookings.`);
            }

            // Expire pending rentals that are past their start_date
            const resRentals = await pool.query(`
                UPDATE rentals
                SET rental_status = 'cancelled'
                WHERE rental_status = 'pending' AND start_date < CURRENT_DATE
            `);
            if (resRentals.rowCount > 0) {
                console.log(`[Scheduler] Auto-expired ${resRentals.rowCount} pending rentals.`);
            }
        } catch (err) {
            console.error('[Scheduler] Error running expiration jobs:', err);
        }

        // 2. 3-hour reminders
        const state = getWhatsappStatus();
        if (state.status !== 'READY') {
            console.error('[Scheduler] WhatsApp client is not READY. Skipping 3-hour reminders.');
            return;
        }

        try {
            await sendBooking3HourReminders();
        } catch (err) {
            console.error('[Scheduler] Error running 3-hour reminders:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });
}

/**
 * Helper to format date into Indonesian standard format: DD MMMM YYYY
 */
function formatDateIndo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

/**
 * 1. Booking Reminders (Sent 1 day before booking_datetime)
 */
export async function sendBookingReminders() {
    console.log('[Scheduler] Checking booking reminders (1-day before)...');
    try {
        const query = `
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
            WHERE b.status = 'confirmed'
              AND b.reminder_1d_sent = FALSE
              AND DATE(b.booking_datetime AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE + INTERVAL '1 day'
              AND u.phone_number IS NOT NULL AND u.phone_number != ''
            GROUP BY b.id, u.name, u.phone_number, b.booking_datetime
        `;
        const result = await pool.query(query);
        console.log(`[Scheduler] Found ${result.rows.length} 1-day booking reminders to send.`);

        for (const row of result.rows) {
            const formattedDate = formatDateIndo(row.booking_datetime);
            const message = `Halo *${row.customer_name}*, kami ingin mengingatkan bahwa Anda memiliki jadwal booking perawatan di *Irma Wedding Salon* untuk besok:\n\n` +
                `📅 *Tanggal:* ${formattedDate}\n` +
                `⏰ *Waktu:* ${row.booking_time} WIB\n` +
                `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                `Mohon datang tepat waktu ya. Sampai jumpa di Irma Wedding Salon! ✨`;
            
            try {
                await sendWaMessage(row.customer_phone, message);
                await pool.query('UPDATE bookings SET reminder_1d_sent = TRUE WHERE id = $1', [row.id]);
                console.log(`[Scheduler] Sent 1-day reminder to booking ID #${row.id} (${row.customer_phone})`);
            } catch (err) {
                console.error(`[Scheduler] Failed sending booking reminder to ${row.customer_phone}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in sendBookingReminders:', err);
    }
}

/**
 * 2. Booking Reminders (Sent 3 hours before booking_datetime)
 */
export async function sendBooking3HourReminders() {
    console.log('[Scheduler] Checking booking reminders (3-hour before)...');
    try {
        const query = `
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
            WHERE b.status = 'confirmed'
              AND b.reminder_3h_sent = FALSE
              AND b.booking_datetime <= NOW() + INTERVAL '3 hours'
              AND b.booking_datetime > NOW()
              AND u.phone_number IS NOT NULL AND u.phone_number != ''
            GROUP BY b.id, u.name, u.phone_number, b.booking_datetime
        `;
        const result = await pool.query(query);
        console.log(`[Scheduler] Found ${result.rows.length} 3-hour booking reminders to send.`);

        for (const row of result.rows) {
            const formattedDate = formatDateIndo(row.booking_datetime);
            const message = `Halo *${row.customer_name}*, kami ingin mengingatkan bahwa jadwal booking perawatan Anda di *Irma Wedding Salon* akan dimulai dalam 3 jam lagi:\n\n` +
                `📅 *Tanggal:* ${formattedDate}\n` +
                `⏰ *Waktu:* ${row.booking_time} WIB\n` +
                `💇‍♀️ *Layanan:* ${row.services}\n\n` +
                `Mohon datang tepat waktu ya. Sampai jumpa di Irma Wedding Salon! ✨`;
            
            try {
                await sendWaMessage(row.customer_phone, message);
                await pool.query('UPDATE bookings SET reminder_3h_sent = TRUE WHERE id = $1', [row.id]);
                console.log(`[Scheduler] Sent 3-hour reminder to booking ID #${row.id} (${row.customer_phone})`);
            } catch (err) {
                console.error(`[Scheduler] Failed sending 3-hour booking reminder to ${row.customer_phone}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in sendBooking3HourReminders:', err);
    }
}

/**
 * 3. Rental Pickup Reminders (Sent 1 day before rental start_date)
 */
export async function sendPickupReminders() {
    console.log('[Scheduler] Checking rental pickup reminders...');
    try {
        const query = `
            SELECT 
                r.id, 
                u.name as customer_name, 
                u.phone_number as customer_phone, 
                oc.outfit_name, 
                r.start_date
            FROM rentals r
            JOIN "user" u ON r.user_id = u.id
            JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
            WHERE r.rental_status = 'pending'
              AND r.start_date = CURRENT_DATE + INTERVAL '1 day'
              AND u.phone_number IS NOT NULL AND u.phone_number != ''
        `;
        const result = await pool.query(query);
        console.log(`[Scheduler] Found ${result.rows.length} rental pickup reminders to send.`);

        for (const row of result.rows) {
            const formattedDate = formatDateIndo(row.start_date);
            const message = `Halo *${row.customer_name}*, kami ingin mengingatkan bahwa jadwal pengambilan baju sewa Anda di *Irma Wedding Salon* adalah besok:\n\n` +
                `👗 *Baju Sewa:* ${row.outfit_name}\n` +
                `📅 *Tanggal Ambil:* ${formattedDate}\n\n` +
                `Silakan datang ke Irma Wedding Salon untuk mengambil baju sewa tersebut. Terima kasih! 💖`;
            
            try {
                await sendWaMessage(row.customer_phone, message);
            } catch (err) {
                console.error(`[Scheduler] Failed sending pickup reminder to ${row.customer_phone}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in sendPickupReminders:', err);
    }
}

/**
 * 4. Rental Return Reminders (Sent 1 day before return date)
 */
export async function sendReturnReminders() {
    console.log('[Scheduler] Checking rental return reminders...');
    try {
        const query = `
            SELECT 
                r.id, 
                u.name as customer_name, 
                u.phone_number as customer_phone, 
                oc.outfit_name, 
                (r.start_date + r.duration_days * INTERVAL '1 day')::date as return_date
            FROM rentals r
            JOIN "user" u ON r.user_id = u.id
            JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
            WHERE r.rental_status = 'ongoing'
              AND (r.start_date + r.duration_days * INTERVAL '1 day')::date = CURRENT_DATE + INTERVAL '1 day'
              AND u.phone_number IS NOT NULL AND u.phone_number != ''
        `;
        const result = await pool.query(query);
        console.log(`[Scheduler] Found ${result.rows.length} rental return reminders to send.`);

        for (const row of result.rows) {
            const formattedDate = formatDateIndo(row.return_date);
            const message = `Halo *${row.customer_name}*, kami mengingatkan bahwa batas waktu pengembalian baju sewa Anda adalah besok:\n\n` +
                `👗 *Baju Sewa:* ${row.outfit_name}\n` +
                `📅 *Batas Kembali:* ${formattedDate}\n\n` +
                `Mohon dikembalikan tepat waktu untuk menghindari denda keterlambatan ya. Terima kasih atas kerja samanya! 😊`;
            
            try {
                await sendWaMessage(row.customer_phone, message);
            } catch (err) {
                console.error(`[Scheduler] Failed sending return reminder to ${row.customer_phone}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in sendReturnReminders:', err);
    }
}

/**
 * 5. Rental Overdue Warnings (Sent daily for active overdue rentals)
 */
export async function sendOverdueWarnings() {
    console.log('[Scheduler] Checking rental overdue warnings...');
    try {
        const query = `
            SELECT 
                r.id, 
                u.name as customer_name, 
                u.phone_number as customer_phone, 
                oc.outfit_name, 
                (r.start_date + r.duration_days * INTERVAL '1 day')::date as return_date,
                (CURRENT_DATE - (r.start_date + r.duration_days * INTERVAL '1 day')::date) as late_days
            FROM rentals r
            JOIN "user" u ON r.user_id = u.id
            JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
            WHERE r.rental_status = 'terlambat'
              AND u.phone_number IS NOT NULL AND u.phone_number != ''
        `;
        const result = await pool.query(query);
        console.log(`[Scheduler] Found ${result.rows.length} overdue warnings to send.`);

        for (const row of result.rows) {
            const formattedDate = formatDateIndo(row.return_date);
            const message = `⚠️ *PERINGATAN KETERLAMBATAN* ⚠️\n\n` +
                `Halo *${row.customer_name}*, kami menginfokan bahwa pengembalian baju sewa Anda telah *TERLAMBAT*:\n\n` +
                `👗 *Baju Sewa:* ${row.outfit_name}\n` +
                `📅 *Batas Kembali:* ${formattedDate}\n` +
                `⏳ *Keterlambatan:* ${row.late_days} hari\n\n` +
                `Mohon untuk segera mengembalikan baju sewa tersebut ke *Irma Wedding Salon* untuk menghentikan akumulasi denda keterlambatan. Terima kasih.`;
            
            try {
                await sendWaMessage(row.customer_phone, message);
            } catch (err) {
                console.error(`[Scheduler] Failed sending overdue warning to ${row.customer_phone}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in sendOverdueWarnings:', err);
    }
}
