"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export type BookingStatusDB = "PENDING" | "DITERIMA" | "DITOLAK" | "CANCELLED";

export interface BookingRow {
  id: number;
  customer_name: string;
  phone_number: string;
  booking_datetime: string;
  status: BookingStatusDB;
  services: string;
  total_amount: number;
  payment_method: string;
  transaction_id: number | null;
}

export interface CreateBookingInput {
  booking_datetime: string;
  service_ids: number[];
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SalonService {
  id: number;
  service_name: string;
  price: number;
  hour_duration: number;
  image_url: string | null;
}

// ── Helper ─────────────────────────────────────────────────────────────────

async function getAuthUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user as unknown as AppUser;
}

// ── GET SERVICES ───────────────────────────────────────────────────────────

export async function getSalonServices(): Promise<ActionResult<SalonService[]>> {
  try {
    const result = await db.query(
      `SELECT id, service_name, price, hour_duration, image_url
       FROM salon_services
       ORDER BY service_name`
    );
    return { success: true, data: result.rows };
  } catch (err) {
    console.error("[getSalonServices]", err);
    return { success: false, error: "Gagal memuat layanan." };
  }
}

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────

export async function getAvailableSlots(
  date: string
): Promise<ActionResult<{ available: string[]; booked: string[] }>> {
  try {
    // Semua slot 08:00–16:30, tiap 30 menit
    const ALL_SLOTS: string[] = [];
    for (let h = 8; h <= 16; h++) {
      ALL_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
      if (h < 16) ALL_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
    }

    // Cek apakah salon buka pada hari tersebut
    const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const dayOfWeek = dayNames[new Date(date).getDay()];

    const openCheck = await db.query(
      `SELECT open_time, close_time FROM opening_time WHERE day_of_week = $1`,
      [dayOfWeek]
    );

    // Cek apakah ada closing_time (hari libur) yang mencakup tanggal ini
    const closingCheck = await db.query(
      `SELECT id FROM closing_time
       WHERE start_date <= $1 AND end_date >= $1`,
      [date]
    );

    if (!openCheck.rows.length || closingCheck.rows.length > 0) {
      return { success: true, data: { available: [], booked: [] } };
    }

    // Slot yang sudah terpakai
    const booked = await db.query(
      `SELECT TO_CHAR(booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS slot
       FROM bookings
       WHERE DATE(booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
         AND status NOT IN ('DITOLAK', 'CANCELLED')`,
      [date]
    );

    const bookedSet = new Set(booked.rows.map((r: { slot: string }) => r.slot));
    const available = ALL_SLOTS.filter((s) => !bookedSet.has(s));

    return {
      success: true,
      data: { available, booked: Array.from(bookedSet) },
    };
  } catch (err) {
    console.error("[getAvailableSlots]", err);
    return { success: false, error: "Gagal memuat slot." };
  }
}

// ── CREATE BOOKING (Customer) ──────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput
): Promise<ActionResult<{ bookingId: number }>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const { booking_datetime, service_ids } = input;

    if (!booking_datetime || !service_ids?.length) {
      return { success: false, error: "Data booking tidak lengkap." };
    }

    // Tidak boleh booking di masa lalu
    if (new Date(booking_datetime) < new Date()) {
      return { success: false, error: "Tanggal booking tidak boleh di masa lalu." };
    }

    // Cek konflik slot (±30 menit)
    const conflict = await db.query(
      `SELECT id FROM bookings
       WHERE status NOT IN ('DITOLAK', 'CANCELLED')
         AND booking_datetime BETWEEN $1::timestamptz - INTERVAL '30 minutes'
                                  AND $1::timestamptz + INTERVAL '30 minutes'`,
      [booking_datetime]
    );
    if (conflict.rows.length > 0) {
      return { success: false, error: "Slot waktu ini sudah terisi. Silakan pilih waktu lain." };
    }

    // Ambil data layanan
    const serviceRows = await db.query(
      `SELECT id, service_name, price, hour_duration
       FROM salon_services WHERE id = ANY($1)`,
      [service_ids]
    );
    if (serviceRows.rows.length !== service_ids.length) {
      return { success: false, error: "Salah satu layanan tidak ditemukan." };
    }

    const subtotal = serviceRows.rows.reduce(
      (sum: number, s: { price: string }) => sum + parseFloat(s.price),
      0
    );

    // Transaksi DB
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, booking_datetime, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING id`,
        [user.id, booking_datetime]
      );
      const bookingId: number = bookingResult.rows[0].id;

      for (const svc of serviceRows.rows) {
        await client.query(
          `INSERT INTO booking_details
             (booking_id, salon_service_id, price_at_booking, duration_at_booking)
           VALUES ($1, $2, $3, $4)`,
          [bookingId, svc.id, svc.price, svc.hour_duration]
        );
      }

      await client.query(
        `INSERT INTO transactions
           (user_id, booking_id, subtotal, total_amount, payment_method)
         VALUES ($1, $2, $3, $3, 'cash')`,
        [user.id, bookingId, subtotal]
      );

      await client.query("COMMIT");

      revalidatePath("/bookings");
      revalidatePath("/admin/bookings");

      return { success: true, data: { bookingId } };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[createBooking]", err);
    return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

// ── UPDATE STATUS (Admin) ──────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: number,
  status: BookingStatusDB
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const valid: BookingStatusDB[] = ["PENDING", "DITERIMA", "DITOLAK", "CANCELLED"];
    if (!valid.includes(status)) {
      return { success: false, error: "Status tidak valid." };
    }

    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id`,
      [status, bookingId]
    );
    if (!result.rows.length) {
      return { success: false, error: "Booking tidak ditemukan." };
    }

    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (err) {
    console.error("[updateBookingStatus]", err);
    return { success: false, error: "Gagal mengubah status." };
  }
}

// ── CANCEL BOOKING (Customer) ──────────────────────────────────────────────

export async function cancelBooking(bookingId: number): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login." };

    const check = await db.query(
      `SELECT id, status FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, user.id]
    );
    if (!check.rows.length) {
      return { success: false, error: "Booking tidak ditemukan." };
    }
    if (check.rows[0].status !== "PENDING") {
      return { success: false, error: "Hanya booking berstatus PENDING yang dapat dibatalkan." };
    }

    await db.query(
      `UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`,
      [bookingId]
    );

    revalidatePath("/bookings");
    return { success: true };
  } catch (err) {
    console.error("[cancelBooking]", err);
    return { success: false, error: "Gagal membatalkan booking." };
  }
}

// ── GET BOOKINGS FOR ADMIN ─────────────────────────────────────────────────

export async function getBookingsForAdmin(filters?: {
  status?: BookingStatusDB | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ rows: BookingRow[]; total: number }>> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const page   = filters?.page  ?? 1;
    const limit  = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status && filters.status !== "ALL") {
      params.push(filters.status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`u.name ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN "user" u ON b.user_id = u.id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
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

    return { success: true, data: { rows: result.rows, total } };
  } catch (err) {
    console.error("[getBookingsForAdmin]", err);
    return { success: false, error: "Gagal memuat data booking." };
  }
}

// ── GET BOOKINGS FOR CUSTOMER ──────────────────────────────────────────────

export async function getBookingsForCustomer(): Promise<ActionResult<BookingRow[]>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login." };

    const result = await db.query(
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
      [user.id]
    );

    return { success: true, data: result.rows };
  } catch (err) {
    console.error("[getBookingsForCustomer]", err);
    return { success: false, error: "Gagal memuat riwayat booking." };
  }
}