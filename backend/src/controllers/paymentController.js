// backend/src/controllers/paymentController.js
import pool from '../services/db.js';
import { 
    getInvoiceData, 
    generateInvoiceImageBuffer, 
    generateInvoiceText, 
    formatRupiah 
} from '../services/invoiceService.js';
import { sendWaMessage, MessageMedia } from '../services/whatsappService.js';

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
                t.status AS status,
                t.total_amount AS amount,
                COALESCE(
                    TO_CHAR(b.booking_datetime AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY'),
                    TO_CHAR(r.start_date, 'DD Mon YYYY'),
                    '—'
                ) AS date,
                TO_CHAR(t.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS payment_time
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
             SET status = 'lunas' 
             WHERE id = $1 
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
        }

        const transactionId = result.rows[0].id;

        // Auto-generate invoice and send via WhatsApp in the background
        (async () => {
            try {
                console.log(`[Invoice] Starting invoice generation for transaction ID: ${transactionId}`);
                const data = await getInvoiceData(transactionId);
                if (!data) {
                    console.error(`[Invoice] Transaction data not found for ID: ${transactionId}`);
                    return;
                }

                const { transaction, items } = data;
                if (!transaction.customer_phone) {
                    console.log(`[Invoice] Customer has no phone number, skipping WhatsApp receipt.`);
                    return;
                }

                const caption = `Halo *${transaction.customer_name}*,\n\n` +
                    `Pembayaran Anda untuk invoice *INV/2026/${transaction.id}* sebesar *${formatRupiah(transaction.total_amount)}* telah *BERHASIL* dikonfirmasi oleh Admin.\n\n` +
                    `Berikut kami lampirkan bukti pembayaran resmi Anda. Terima kasih telah mempercayai Rumah Cantik Irma! ✨`;

                try {
                    // Try generating JPEG image using Puppeteer screenshot
                    console.log(`[Invoice] Generating screenshot of invoice using Puppeteer...`);
                    const imgBuffer = await generateInvoiceImageBuffer(transaction, items);
                    const media = new MessageMedia('image/jpeg', imgBuffer.toString('base64'), `invoice_${transaction.id}.jpg`);
                    
                    console.log(`[Invoice] Dispatching image receipt to ${transaction.customer_phone}...`);
                    await sendWaMessage(transaction.customer_phone, caption, { media });
                    console.log(`[Invoice] Image receipt sent successfully.`);
                } catch (imgErr) {
                    console.error(`[Invoice] Puppeteer screenshot failed. Falling back to text receipt. Error:`, imgErr);
                    
                    // Fallback to plain text receipt
                    const fallbackText = generateInvoiceText(transaction, items);
                    const fallbackMessage = `${caption}\n\n-----------------------------------\n${fallbackText}`;
                    
                    console.log(`[Invoice] Dispatching fallback text receipt to ${transaction.customer_phone}...`);
                    await sendWaMessage(transaction.customer_phone, fallbackMessage);
                    console.log(`[Invoice] Fallback text receipt sent successfully.`);
                }
            } catch (bgErr) {
                console.error(`[Invoice] Background invoice processing encountered an error:`, bgErr);
            }
        })();

        return res.json({ success: true });
    } catch (err) {
        console.error('[confirmPayment]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
