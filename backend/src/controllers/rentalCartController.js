// backend/src/controllers/rentalCartController.js
// Handles multi-item rental cart: group multiple outfits in 1 transaction.

import pool from '../services/db.js';
import { sendWaMessage } from '../services/whatsappService.js';
import { generateInvoiceCode, generateRentalCode } from '../utils/transaction.js';

// ── Shared Helper to get Admin Phone ────────────────────────────────────────
async function getAdminPhone() {
    try {
        const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'salon_whatsapp' LIMIT 1");
        if (settingsRes.rows.length > 0 && settingsRes.rows[0].value) {
            const val = settingsRes.rows[0].value.trim();
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
        if (adminRes.rows.length > 0) return adminRes.rows[0].phone_number;
    } catch (err) {
        console.error("Failed to query user for admin phone:", err);
    }
    return null;
}

// ── WhatsApp Notification for Cart Rental ───────────────────────────────────
async function triggerCartRentalNotification(rentalOrderId, userId, items, totalAmount, paymentMethod) {
    try {
        const userRes = await pool.query(
            `SELECT name, phone_number FROM "user" WHERE id = $1 LIMIT 1`,
            [userId]
        );
        if (userRes.rows.length === 0) return;
        const customer = userRes.rows[0];

        const formatD = (d) => new Date(d).toLocaleDateString("id-ID", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        const amountRupiah = new Intl.NumberFormat("id-ID", {
            style: "currency", currency: "IDR", maximumFractionDigits: 0
        }).format(totalAmount);

        const itemLines = items.map((item, i) =>
            `${i + 1}. Baju: ${item.outfit_name}\n` +
            `   Mulai: ${formatD(item.start_date)}\n` +
            `   Durasi: ${item.duration_days} hari\n` +
            `   Subtotal: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.amount_to_be_paid)}`
        ).join("\n\n");

        const payDesc = paymentMethod === 'cash' ? 'Cash (bayar di salon, maks. 3 jam)' : 'QRIS';

        if (customer.phone_number) {
            const customerMsg =
                `Halo ${customer.name},\n\n` +
                `Pesanan sewa baju Anda di Irma Wedding Salon berhasil dibuat!\n\n` +
                `Daftar Baju yang Disewa:\n${itemLines}\n\n` +
                `Total Pembayaran: ${amountRupiah}\n` +
                `Metode: ${payDesc}\n\n` +
                `Jaminan sewa (KTP asli) diserahkan langsung di salon. ` +
                `Silakan selesaikan pembayaran untuk memproses pesanan. Terima kasih!`;
            await sendWaMessage(customer.phone_number, customerMsg).catch(() => {});
        }

        const adminPhone = await getAdminPhone();
        if (adminPhone) {
            const adminMsg =
                `ORDER SEWA BAJU BARU (KERANJANG)\n\n` +
                `Pelanggan: ${customer.name}\n` +
                `Jumlah Item: ${items.length} baju\n\n` +
                itemLines + `\n\n` +
                `Total: ${amountRupiah}\n` +
                `Metode: ${payDesc}`;
            await sendWaMessage(adminPhone, adminMsg).catch(() => {});
        }
    } catch (err) {
        console.error("[triggerCartRentalNotification] Error:", err);
    }
}

// ── POST /api/rentals/cart ─────────────────────────────────────────────────
// Body: { items: [{ outfit_catalogues_id, start_date, duration_days }], payment_method, notes? }
export async function createRentalCart(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID is missing." });
    }

    const { items, payment_method = 'cash', notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Keranjang kosong. Tambahkan minimal 1 baju." });
    }
    if (items.length > 5) {
        return res.status(400).json({ error: "Maksimal 5 baju per checkout dalam sekali transaksi." });
    }

    const validMethods = ['cash', 'qris'];
    if (!validMethods.includes(payment_method)) {
        return res.status(400).json({ error: "Metode pembayaran tidak valid." });
    }

    for (const item of items) {
        if (!item.outfit_catalogues_id || !item.start_date || !item.duration_days) {
            return res.status(400).json({ error: "Data item tidak lengkap (outfit_catalogues_id, start_date, duration_days wajib diisi)." });
        }
        if (parseInt(item.duration_days, 10) < 1) {
            return res.status(400).json({ error: "Durasi sewa minimal 1 hari." });
        }
        if (new Date(item.start_date) < new Date(new Date().toDateString())) {
            return res.status(400).json({ error: "Tanggal mulai untuk item tidak boleh di masa lalu." });
        }
    }

    try {
        const outfitIds = items.map((i) => i.outfit_catalogues_id);
        const outfitRows = await pool.query(
            `SELECT id, outfit_name, price, stock FROM outfit_catalogues WHERE id = ANY($1)`,
            [outfitIds]
        );
        if (outfitRows.rows.length !== outfitIds.length) {
            return res.status(404).json({ error: "Salah satu baju tidak ditemukan." });
        }
        const outfitMap = Object.fromEntries(outfitRows.rows.map((o) => [o.id, o]));

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const outfit = outfitMap[item.outfit_catalogues_id];
            const stock = outfit.stock !== null ? parseInt(outfit.stock, 10) : 1;

            const overlapRes = await pool.query(
                `SELECT COUNT(*) FROM rentals
                 WHERE outfit_catalogues_id = $1
                   AND rental_status NOT IN ('cancelled')
                   AND start_date <= $2::date + $3 * INTERVAL '1 day'
                   AND start_date + duration_days * INTERVAL '1 day' >= $2::date`,
                [item.outfit_catalogues_id, item.start_date, item.duration_days]
            );
            const dbOverlappingCount = parseInt(overlapRes.rows[0].count, 10);

            // Count overlapping items for the same outfit within this request
            let cartOverlapCount = 0;
            const startA = new Date(item.start_date);
            const endA = new Date(startA.getTime() + parseInt(item.duration_days, 10) * 86400000);

            for (let j = 0; j < items.length; j++) {
                if (i === j) continue;
                const other = items[j];
                if (other.outfit_catalogues_id === item.outfit_catalogues_id) {
                    const startB = new Date(other.start_date);
                    const endB = new Date(startB.getTime() + parseInt(other.duration_days, 10) * 86400000);

                    if (startA <= endB && startB <= endA) {
                        cartOverlapCount++;
                    }
                }
            }

            const totalOverlapping = dbOverlappingCount + cartOverlapCount;
            if (totalOverlapping >= stock) {
                return res.status(400).json({
                    error: `Stok "${outfit.outfit_name}" tidak mencukupi untuk tanggal tersebut. (Stok: ${stock}, Tersewa di DB: ${dbOverlappingCount}, Di Keranjang: ${cartOverlapCount + 1})`
                });
            }
        }

        let totalAmount = 0;
        const enrichedItems = items.map((item) => {
            const outfit = outfitMap[item.outfit_catalogues_id];
            const pricePerDay = parseFloat(outfit.price);
            const amount = pricePerDay * parseInt(item.duration_days, 10);
            totalAmount += amount;
            return { ...item, outfit_name: outfit.outfit_name, amount_to_be_paid: amount };
        });

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const orderResult = await client.query(
                `INSERT INTO rental_orders (user_id, notes) VALUES ($1, $2) RETURNING id`,
                [userId, notes || null]
            );
            const rentalOrderId = orderResult.rows[0].id;

            const createdRentalIds = [];
            for (const item of enrichedItems) {
                const rentalCode = generateRentalCode();
                const rentalResult = await client.query(
                    `INSERT INTO rentals
                       (user_id, outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, rental_status, rental_order_id, code)
                     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
                     RETURNING id`,
                    [userId, item.outfit_catalogues_id, item.start_date, item.duration_days, item.amount_to_be_paid, rentalOrderId, rentalCode]
                );
                createdRentalIds.push(rentalResult.rows[0].id);
            }

            const userRes = await client.query(
                `SELECT name, phone_number FROM "user" WHERE id = $1`,
                [userId]
            );
            const dbUser = userRes.rows[0];

            const invoiceCode = generateInvoiceCode();
            const txResult = await client.query(
                `INSERT INTO transactions
                   (user_id, rental_order_id, subtotal, total_amount, payment_method, status, uuid)
                 VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                 RETURNING id, uuid`,
                [userId, rentalOrderId, totalAmount, totalAmount, payment_method, invoiceCode]
            );
            const transactionId = txResult.rows[0].uuid;

            const outfitNameList = enrichedItems.map((i) => i.outfit_name).join(", ");
            await client.query(
                `INSERT INTO notifications (type, title, message, ref_id, is_read, created_at)
                 VALUES ('booking', 'Sewa Baju Baru (Keranjang)', $1, $2, FALSE, NOW())`,
                [`Sewa baru dari ${dbUser.name} - ${outfitNameList}`, rentalOrderId]
            );

            await client.query("COMMIT");

            triggerCartRentalNotification(rentalOrderId, userId, enrichedItems, totalAmount, payment_method).catch(() => {});

            res.status(201).json({
                rentalOrderId,
                rentalIds: createdRentalIds,
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
        console.error("[createRentalCart]", err);
        res.status(500).json({ error: err.message || "Terjadi kesalahan sistem. Silakan coba lagi." });
    }
}

// ── GET /api/rentals/cart/:orderId ─────────────────────────────────────────
export async function getRentalCartOrder(req, res) {
    const userId = req.user?.id;
    const { orderId } = req.params;

    try {
        const orderRes = await pool.query(
            `SELECT ro.*, COALESCE(t.uuid::text, t.id::text) AS transaction_id, t.status AS payment_status,
                    t.payment_method, t.total_amount, t.payment_proof_sent, t.payment_proof_url
             FROM rental_orders ro
             LEFT JOIN transactions t ON t.rental_order_id = ro.id
             WHERE ro.id = $1`,
            [orderId]
        );
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ error: "Order tidak ditemukan." });
        }
        const order = orderRes.rows[0];

        if (req.user.role !== 'admin' && order.user_id !== userId) {
            return res.status(403).json({ error: "Akses ditolak." });
        }

        const itemsRes = await pool.query(
            `SELECT r.id, r.outfit_catalogues_id, r.start_date, r.duration_days,
                    r.amount_to_be_paid, r.rental_status,
                    oc.outfit_name, oc.image_url, oc.price AS price_per_day
             FROM rentals r
             JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
             WHERE r.rental_order_id = $1
             ORDER BY r.id`,
            [orderId]
        );

        res.json({
            order: {
                id: order.id,
                user_id: order.user_id,
                created_at: order.created_at,
                notes: order.notes,
                transaction_id: order.transaction_id,
                payment_status: order.payment_status,
                payment_method: order.payment_method,
                total_amount: order.total_amount,
                payment_proof_sent: order.payment_proof_sent,
                payment_proof_url: order.payment_proof_url,
            },
            items: itemsRes.rows,
        });
    } catch (err) {
        console.error("[getRentalCartOrder]", err);
        res.status(500).json({ error: "Gagal memuat order." });
    }
}
