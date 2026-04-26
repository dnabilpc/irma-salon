// actions/booking.ts
// Server Actions untuk semua operasi booking
// Dipanggil dari komponen client — tidak perlu API route manual

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  booking_datetime: string; // ISO string
  service_ids: number[];    // bisa multi-service
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getAuthUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user as unknown as AppUser;
}

// ── CREATE BOOKING ─────────────────────────────────────────────────────────

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

    // Validasi tanggal — tidak boleh di masa lalu
    const bookingDate = new Date(booking_datetime);
    if (bookingDate < new Date()) {
      return { success: false, error: "Tanggal booking tidak boleh di masa lalu." };
    }

    // Cek apakah slot masih tersedia (tidak ada booking lain pada waktu ±30mnt)
    const conflictCheck = await db.query(
      `SELECT id FROM bookings
       WHERE status NOT IN ('ditolak','cancelled')
         AND booking_datetime BETWEEN $1::timestamptz - INTERVAL '30 minutes'
                                  AND $1::timestamptz + INTERVAL '30 minutes'`,
      [booking_datetime]
    );
    if (conflictCheck.rows.length > 0) {
      return { success: false, error: "Slot waktu ini sudah terisi. Silakan pilih waktu lain." };
    }

    // Ambil harga layanan yang dipilih
    const serviceRows = await db.query(
      `SELECT id, service_name, price, hour_duration
       FROM salon_services
       WHERE id = ANY($1)`,
      [service_ids]
    );

    if (serviceRows.rows.length !== service_ids.length) {
      return { success: false, error: "Salah satu layanan tidak ditemukan." };
    }

    // Hitung subtotal
    const subtotal = serviceRows.rows.reduce(
      (sum: number, s: { price: string }) => sum + parseFloat(s.price),
      0
    );

    // Mulai transaksi DB
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Insert booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, booking_datetime, status)
         VALUES ($1, $2, 'pending')
         RETURNING id`,
        [user.id, booking_datetime]
      );
      const bookingId: number = bookingResult.rows[0].id;

      // Insert booking_details (satu baris per service)
      for (const svc of serviceRows.rows) {
        await client.query(
          `INSERT INTO booking_details (booking_id, salon_service_id, price_at_booking, duration_at_booking)
           VALUES ($1, $2, $3, $4)`,
          [bookingId, svc.id, svc.price, svc.hour_duration]
        );
      }

      // Insert transaksi awal (payment_method & midtrans di-set nanti)
      await client.query(
        `INSERT INTO transactions (user_id, booking_id, subtotal, total_amount, payment_method)
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

// ── UPDATE STATUS BOOKING (Admin only) ────────────────────────────────────

export type BookingStatusDB = "pending" | "diterima" | "ditolak" | "cancelled";

export async function updateBookingStatus(
  bookingId: number,
  status: BookingStatusDB
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2`,
      [status, bookingId]
    );

    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (err) {
    console.error("[updateBookingStatus]", err);
    return { success: false, error: "Gagal mengubah status." };
  }
}

// ── CANCEL BOOKING (Customer sendiri) ─────────────────────────────────────

export async function cancelBooking(bookingId: number): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login." };

    // Pastikan booking milik user ini
    const check = await db.query(
      `SELECT id, status FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, user.id]
    );
    if (!check.rows.length) {
      return { success: false, error: "Booking tidak ditemukan." };
    }
    if (check.rows[0].status !== "pending") {
      return { success: false, error: "Hanya booking berstatus pending yang dapat dibatalkan." };
    }

    await db.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
      [bookingId]
    );

    revalidatePath("/bookings");
    return { success: true };
  } catch (err) {
    console.error("[cancelBooking]", err);
    return { success: false, error: "Gagal membatalkan booking." };
  }
}

// ── GET BOOKING LIST (Admin) ───────────────────────────────────────────────

export interface BookingRow {
  id: number;
  customer_name: string;
  phone_number: string;
  booking_datetime: string;
  status: BookingStatusDB;
  services: string;          // coma-joined
  total_amount: number;
  payment_method: string;
  transaction_id: number | null;
}

export async function getBookingsForAdmin(filters?: {
  status?: BookingStatusDB | "all";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ rows: BookingRow[]; total: number }>> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status && filters.status !== "all") {
      params.push(filters.status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`u.full_name ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN users u ON b.user_id = u.id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT
         b.id,
         u.full_name        AS customer_name,
         u.phone_number,
         b.booking_datetime,
         b.status,
         STRING_AGG(ss.service_name, ', ') AS services,
         t.total_amount,
         t.payment_method,
         t.id               AS transaction_id
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
       LEFT JOIN transactions t     ON t.booking_id = b.id
       ${where}
       GROUP BY b.id, u.full_name, u.phone_number, b.booking_datetime, b.status,
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

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────

export async function getAvailableSlots(
  date: string // YYYY-MM-DD
): Promise<ActionResult<string[]>> {
  try {
    // Jam operasional 08:00–17:00, slot tiap 30 menit
    const slots: string[] = [];
    for (let h = 8; h < 17; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }

    // Ambil slot yang sudah terpakai
    const booked = await db.query(
      `SELECT TO_CHAR(booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS time_slot
       FROM bookings
       WHERE DATE(booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
         AND status NOT IN ('ditolak','cancelled')`,
      [date]
    );

    const bookedSet = new Set(booked.rows.map((r: { time_slot: string }) => r.time_slot));

    const available = slots.filter((s) => !bookedSet.has(s));
    return { success: true, data: available };
  } catch (err) {
    console.error("[getAvailableSlots]", err);
    return { success: false, error: "Gagal memuat slot." };
  }
}

// ── GET SERVICES LIST ──────────────────────────────────────────────────────

export interface SalonService {
  id: number;
  service_name: string;
  price: number;
  hour_duration: number;
  image_url: string | null;
}

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