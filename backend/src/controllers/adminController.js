// backend/src/controllers/adminController.js
import pool from '../services/db.js';
import { uploadToSupabaseStorage } from '../services/storageService.js';
import { autoUpdateBookingStates } from './bookingController.js';

function getPercentageChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? `+100%` : `0%`;
    }
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
}

function getCountChange(current, previous) {
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff}`;
}

function formatRevenue(val) {
    const num = parseFloat(val) || 0;
    if (num >= 1000000) {
        return `Rp ${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * GET /api/admin/dashboard
 * Dynamic stats for Admin Dashboard
 */
export async function getDashboardStats(req, res) {
    try {
        // Auto-complete confirmed bookings that have passed their duration
        await autoUpdateBookingStates();

        // 1. Bookings This Month vs Last Month
        const bookingsThisMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM bookings 
            WHERE booking_datetime >= DATE_TRUNC('month', CURRENT_DATE) 
              AND booking_datetime < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        `);
        const bookingsLastMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM bookings 
            WHERE booking_datetime >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
              AND booking_datetime < DATE_TRUNC('month', CURRENT_DATE)
        `);
        const bookingsThisMonth = bookingsThisMonthRes.rows[0].count;
        const bookingsLastMonth = bookingsLastMonthRes.rows[0].count;

        // 2. Revenue This Month vs Last Month
        const revThisMonthRes = await pool.query(`
            SELECT COALESCE(SUM(t.total_amount), 0)::numeric AS revenue
            FROM transactions t
            LEFT JOIN bookings b ON t.booking_id = b.id
            LEFT JOIN rentals r ON t.rental_id = r.id
            WHERE t.status = 'lunas'
              AND (
                (t.booking_id IS NOT NULL AND b.booking_datetime >= DATE_TRUNC('month', CURRENT_DATE) AND b.booking_datetime < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
                OR
                (t.rental_id IS NOT NULL AND r.start_date >= DATE_TRUNC('month', CURRENT_DATE) AND r.start_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
              )
        `);
        const revLastMonthRes = await pool.query(`
            SELECT COALESCE(SUM(t.total_amount), 0)::numeric AS revenue
            FROM transactions t
            LEFT JOIN bookings b ON t.booking_id = b.id
            LEFT JOIN rentals r ON t.rental_id = r.id
            WHERE t.status = 'lunas'
              AND (
                (t.booking_id IS NOT NULL AND b.booking_datetime >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND b.booking_datetime < DATE_TRUNC('month', CURRENT_DATE))
                OR
                (t.rental_id IS NOT NULL AND r.start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND r.start_date < DATE_TRUNC('month', CURRENT_DATE))
              )
        `);
        const revThisMonth = parseFloat(revThisMonthRes.rows[0].revenue) || 0;
        const revLastMonth = parseFloat(revLastMonthRes.rows[0].revenue) || 0;

        // 3. Active Rentals (ongoing/late) and New Rentals count comparison
        const activeRentalsRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM rentals 
            WHERE rental_status IN ('ongoing', 'terlambat')
        `);
        const rentalsThisMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM rentals 
            WHERE start_date >= DATE_TRUNC('month', CURRENT_DATE) 
              AND start_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        `);
        const rentalsLastMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM rentals 
            WHERE start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
              AND start_date < DATE_TRUNC('month', CURRENT_DATE)
        `);
        const activeRentals = activeRentalsRes.rows[0].count;
        const rentalsThisMonth = rentalsThisMonthRes.rows[0].count;
        const rentalsLastMonth = rentalsLastMonthRes.rows[0].count;

        // 4. New Customers This Month vs Last Month
        const custThisMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM "user" 
            WHERE role = 'customer' 
              AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) 
              AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        `);
        const custLastMonthRes = await pool.query(`
            SELECT COUNT(*)::int AS count FROM "user" 
            WHERE role = 'customer' 
              AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
              AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)
        `);
        const custThisMonth = custThisMonthRes.rows[0].count;
        const custLastMonth = custLastMonthRes.rows[0].count;

        // 5. Weekly Chart (Current Month Daily Activity - Booking & Sewa counts)
        const weeklyRes = await pool.query(`
            WITH current_month_days AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE)::date,
                    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date,
                    '1 day'::interval
                )::date AS day_date
            ),
            daily_bookings AS (
                SELECT booking_datetime::date AS day_date, COUNT(*)::int AS count
                FROM bookings
                WHERE booking_datetime::date >= DATE_TRUNC('month', CURRENT_DATE)
                  AND booking_datetime::date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                GROUP BY day_date
            ),
            daily_rentals AS (
                SELECT start_date::date AS day_date, COUNT(*)::int AS count
                FROM rentals
                WHERE start_date::date >= DATE_TRUNC('month', CURRENT_DATE)
                  AND start_date::date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                GROUP BY day_date
            )
            SELECT 
                TO_CHAR(d.day_date, 'DD') AS day_label,
                d.day_date::text AS date,
                COALESCE(b.count, 0)::int AS bookings,
                COALESCE(r.count, 0)::int AS rentals
            FROM current_month_days d
            LEFT JOIN daily_bookings b ON d.day_date = b.day_date
            LEFT JOIN daily_rentals r ON d.day_date = r.day_date
            ORDER BY d.day_date ASC
        `);

        const weeklyChart = weeklyRes.rows.map(row => ({
            day: row.day_label,
            bookings: row.bookings,
            rentals: row.rentals
        }));

        // 6. Today's Schedule
        const todayScheduleRes = await pool.query(`
            SELECT 
                TO_CHAR(b.booking_datetime, 'HH24:MI') AS time,
                u.name AS name,
                COALESCE(STRING_AGG(ss.service_name, ', '), '-') AS service,
                CASE
                    WHEN b.status = 'cancelled' THEN 'cancelled'
                    WHEN b.status = 'completed' THEN 'completed'
                    WHEN b.booking_datetime < NOW() AND b.status = 'confirmed' THEN 'ongoing'
                    ELSE 'upcoming'
                END AS status
            FROM bookings b
            JOIN "user" u ON b.user_id = u.id
            LEFT JOIN booking_details bd ON bd.booking_id = b.id
            LEFT JOIN salon_services ss ON ss.id = bd.salon_service_id
            WHERE b.booking_datetime::date = CURRENT_DATE
              AND b.status IN ('pending', 'confirmed', 'completed')
            GROUP BY b.id, u.name, b.booking_datetime, b.status
            ORDER BY b.booking_datetime ASC
        `);

        // 7. Top Services (Limit 4)
        const topServicesRes = await pool.query(`
            WITH service_counts AS (
                SELECT 
                    ss.service_name AS name,
                    COUNT(*)::int AS count
                FROM booking_details bd
                JOIN salon_services ss ON bd.salon_service_id = ss.id
                GROUP BY ss.service_name
            ),
            total_count AS (
                SELECT SUM(count) AS total FROM service_counts
            )
            SELECT 
                sc.name,
                sc.count,
                CASE 
                    WHEN tc.total > 0 THEN ROUND((sc.count::numeric / tc.total) * 100)::int
                    ELSE 0
                END AS pct
            FROM service_counts sc, total_count tc
            ORDER BY sc.count DESC
            LIMIT 4
        `);

        // 8. Recent Bookings (Limit 5)
        const recentBookingsRes = await pool.query(`
            SELECT
               b.id,
               u.name                                           AS customer,
               COALESCE(STRING_AGG(ss.service_name, ', '), '-') AS service,
               TO_CHAR(b.booking_datetime, 'DD Mon')            AS date,
               TO_CHAR(b.booking_datetime, 'HH24:MI')           AS time,
               b.status,
               CASE 
                   WHEN t.status = 'lunas' THEN 'paid'
                   WHEN t.status = 'gagal' THEN 'refunded'
                   ELSE 'pending'
               END                                              AS payment,
               COALESCE(t.total_amount, 0)::numeric             AS amount
            FROM bookings b
            JOIN "user" u ON b.user_id = u.id
            LEFT JOIN booking_details bd ON bd.booking_id = b.id
            LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
            LEFT JOIN transactions t     ON t.booking_id = b.id
            GROUP BY b.id, u.name, b.booking_datetime, b.status, t.status, t.total_amount
            ORDER BY b.booking_datetime DESC, b.id DESC
            LIMIT 5
        `);

        // 9. Recent Rentals (Limit 5)
        const recentRentalsRes = await pool.query(`
            SELECT
               r.id,
               u.name                                                          AS customer,
               oc.outfit_name                                                  AS item,
               TO_CHAR(r.start_date, 'DD Mon')                                 AS rent_date,
               TO_CHAR(r.start_date + r.duration_days * INTERVAL '1 day', 'DD Mon') AS return_date,
               CASE
                   WHEN r.rental_status::text = 'ongoing' THEN 'dipinjam'
                   WHEN r.rental_status::text = 'done' THEN 'dikembalikan'
                   ELSE r.rental_status::text
               END                                                             AS status,
               r.amount_to_be_paid::numeric                                    AS amount
            FROM rentals r
            JOIN "user" u              ON u.id   = r.user_id
            JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
            ORDER BY r.id DESC
            LIMIT 5
        `);

        // Build stats array
        const stats = [
            {
                label: "Total Booking Bulan Ini",
                value: bookingsThisMonth.toString(),
                change: getPercentageChange(bookingsThisMonth, bookingsLastMonth),
                positive: bookingsThisMonth >= bookingsLastMonth,
                icon: "📅",
                accent: "#C9922A",
            },
            {
                label: "Pendapatan Bulan Ini",
                value: formatRevenue(revThisMonth),
                change: getPercentageChange(revThisMonth, revLastMonth),
                positive: revThisMonth >= revLastMonth,
                icon: "💰",
                accent: "#4CAF82",
            },
            {
                label: "Sewa Baju Aktif",
                value: activeRentals.toString(),
                change: getCountChange(rentalsThisMonth, rentalsLastMonth),
                positive: rentalsThisMonth >= rentalsLastMonth,
                icon: "👗",
                accent: "#E8A89C",
            },
            {
                label: "Pelanggan Baru",
                value: custThisMonth.toString(),
                change: getPercentageChange(custThisMonth, custLastMonth),
                positive: custThisMonth >= custLastMonth,
                icon: "👤",
                accent: "#7B9FD4",
            }
        ];

        return res.json({
            stats,
            weeklyChart,
            todaySchedule: todayScheduleRes.rows,
            topServices: topServicesRes.rows,
            recentBookings: recentBookingsRes.rows,
            recentRentals: recentRentalsRes.rows
        });
    } catch (err) {
        console.error('[getDashboardStats] Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * POST /api/admin/upload-image
 * Direct upload image to Supabase Storage
 */
export async function uploadImage(req, res) {
    const { image, folder, filenamePrefix } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'Missing image parameter.' });
    }

    try {
        const destFolder = folder || 'general';
        const prefix = filenamePrefix || 'upload';

        const publicUrl = await uploadToSupabaseStorage(image, destFolder, prefix);
        if (!publicUrl) {
            return res.status(500).json({ error: 'Gagal mengunggah gambar ke Supabase Storage.' });
        }

        return res.json({ success: true, imageUrl: publicUrl });
    } catch (err) {
        console.error('[uploadImage] Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
