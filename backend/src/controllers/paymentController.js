// backend/src/controllers/paymentController.js
import pool from '../services/db.js';
import { verifyMidtransSignature } from '../services/midtransService.js';

/**
 * Handles Midtrans Snap webhook notifications
 */
export async function handleMidtransWebhook(req, res) {
    const notification = req.body;
    console.log('[Midtrans Webhook] Received notification:', notification);

    if (!verifyMidtransSignature(notification)) {
        console.error('[Midtrans Webhook] Invalid signature key.');
        return res.status(403).json({ error: 'Invalid signature key.' });
    }

    const { order_id, transaction_status, transaction_id } = notification;

    try {
        let statusToSave = 'pending';
        if (transaction_status === 'settlement' || transaction_status === 'capture') {
            statusToSave = 'settlement';
        } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
            statusToSave = 'gagal';
        }

        if (order_id.startsWith('BOOK-')) {
            const bookingId = parseInt(order_id.split('-')[1], 10);
            await pool.query(
                `UPDATE transactions 
                 SET midtrans_status = $1, midtrans_transaction_id = $2 
                 WHERE booking_id = $3`,
                [statusToSave, transaction_id || null, bookingId]
            );
            console.log(`[Midtrans Webhook] Booking ${bookingId} transaction status updated to ${statusToSave}`);
        } else if (order_id.startsWith('RENT-')) {
            const rentalId = parseInt(order_id.split('-')[1], 10);
            await pool.query(
                `UPDATE transactions 
                 SET midtrans_status = $1, midtrans_transaction_id = $2 
                 WHERE rental_id = $3`,
                [statusToSave, transaction_id || null, rentalId]
            );
            console.log(`[Midtrans Webhook] Rental ${rentalId} transaction status updated to ${statusToSave}`);
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[handleMidtransWebhook] Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Returns all transactions for the Admin dashboard
 */
export async function getPaymentsForAdmin(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                t.id,
                u.name AS customer,
                u.phone_number AS phone,
                CASE 
                    WHEN t.booking_id IS NOT NULL THEN 'booking'
                    ELSE 'sewa'
                END AS type,
                CASE 
                    WHEN t.booking_id IS NOT NULL THEN 'Booking Salon'
                    ELSE 'Sewa Pakaian'
                END AS description,
                t.payment_method AS method,
                CASE 
                    WHEN t.midtrans_status = 'settlement' OR t.midtrans_status = 'capture' THEN 'lunas'
                    WHEN t.midtrans_status = 'gagal' THEN 'gagal'
                    ELSE 'pending'
                END AS status,
                t.total_amount AS amount,
                COALESCE(
                    TO_CHAR(b.booking_datetime AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY'),
                    TO_CHAR(r.start_date, 'DD Mon YYYY'),
                    '—'
                ) AS date
             FROM transactions t
             JOIN "user" u ON t.user_id = u.id
             LEFT JOIN bookings b ON t.booking_id = b.id
             LEFT JOIN rentals r ON t.rental_id = r.id
             ORDER BY t.id DESC`
        );

        return res.json({ payments: result.rows });
    } catch (err) {
        console.error('[getPaymentsForAdmin]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Manually confirms cash or QRIS static payment
 */
export async function confirmPayment(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE transactions 
             SET midtrans_status = 'settlement' 
             WHERE id = $1 
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[confirmPayment]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
