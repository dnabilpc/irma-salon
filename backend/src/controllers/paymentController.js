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
                COALESCE(t.customer_name, u.name, 'Pelanggan Offline') AS customer,
                COALESCE(t.customer_phone, u.phone_number, '\u2014') AS phone,
                CASE 
                    WHEN t.booking_id IS NOT NULL THEN 'booking'
                    WHEN t.rental_order_id IS NOT NULL THEN 'sewa_cart'
                    WHEN t.rental_id IS NOT NULL THEN 'sewa'
                    ELSE 'offline'
                END AS type,
                CASE 
                    WHEN t.booking_id IS NOT NULL THEN 'Booking Salon'
                    WHEN t.rental_order_id IS NOT NULL THEN 'Sewa Pakaian (Keranjang)'
                    WHEN t.rental_id IS NOT NULL THEN 'Sewa Pakaian'
                    ELSE COALESCE(t.notes, 'Kasir Manual')
                END AS description,
                t.payment_method AS method,
                t.status AS status,
                t.total_amount AS amount,
                COALESCE(
                    TO_CHAR(b.booking_datetime AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY'),
                    TO_CHAR(ro.created_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY'),
                    TO_CHAR(r.start_date, 'DD Mon YYYY'),
                    TO_CHAR(t.created_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY')
                ) AS date,
                TO_CHAR(t.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS payment_time,
                t.payment_proof_sent,
                COALESCE(t.category_type, 'web') AS category_type,
                t.rental_order_id
             FROM transactions t
             LEFT JOIN "user" u ON t.user_id = u.id
             LEFT JOIN bookings b ON t.booking_id = b.id
             LEFT JOIN rentals r ON t.rental_id = r.id
             LEFT JOIN rental_orders ro ON t.rental_order_id = ro.id
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
                    `Berikut kami lampirkan bukti pembayaran resmi Anda. Terima kasih telah mempercayai Irma Wedding Salon! ✨`;

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

export async function uploadPaymentProof(req, res) {
    try {
        const { bookingId, rentalId, rentalOrderId, transactionId } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'File screenshot bukti pembayaran wajib diunggah.' });
        }

        // Validate file type (must be image)
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Format file harus berupa gambar (JPG, PNG, dll).' });
        }

        // Validate file size (max 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Ukuran file maksimal adalah 5MB.' });
        }

        // Find transaction — support rentalOrderId for cart checkouts
        let queryStr = `
            SELECT t.id, t.total_amount, t.booking_id, t.rental_id, t.rental_order_id, t.user_id,
                   COALESCE(t.customer_name, u.name, 'Pelanggan') AS customer_name,
                   COALESCE(t.customer_phone, u.phone_number) AS customer_phone
            FROM transactions t
            LEFT JOIN "user" u ON t.user_id = u.id
        `;
        let params = [];

        if (transactionId) {
            queryStr += ` WHERE t.id = $1`;
            params = [transactionId];
        } else if (bookingId) {
            queryStr += ` WHERE t.booking_id = $1`;
            params = [bookingId];
        } else if (rentalOrderId) {
            queryStr += ` WHERE t.rental_order_id = $1`;
            params = [rentalOrderId];
        } else if (rentalId) {
            queryStr += ` WHERE t.rental_id = $1`;
            params = [rentalId];
        } else {
            return res.status(400).json({ error: 'Parameter ID transaksi, booking, atau sewa wajib disertakan.' });
        }

        const trxRes = await pool.query(queryStr, params);
        if (trxRes.rows.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
        }

        const transaction = trxRes.rows[0];

        // Format message
        let typeStr, idStr;
        if (transaction.booking_id) {
            typeStr = 'Booking Salon';
            idStr = `#${transaction.booking_id}`;
        } else if (transaction.rental_order_id) {
            typeStr = 'Sewa Baju (Keranjang)';
            idStr = `Cart #${transaction.rental_order_id}`;
        } else {
            typeStr = 'Sewa Baju';
            idStr = `#${transaction.rental_id}`;
        }
        
        // Format local date and time (Jakarta)
        const dateStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

        const caption = `Halo Admin Irma Wedding Salon,\n\n` +
            `Pelanggan telah mengirimkan bukti pembayaran QRIS Statis:\n\n` +
            `\u2022 *Nama Pelanggan*: ${transaction.customer_name}\n` +
            `\u2022 *No. WhatsApp*: ${transaction.customer_phone || '\u2014'}\n` +
            `\u2022 *Tipe Transaksi*: ${typeStr}\n` +
            `\u2022 *ID Booking/Sewa*: ${idStr}\n` +
            `\u2022 *Total Pembayaran*: ${formatRupiah(transaction.total_amount)}\n` +
            `\u2022 *Waktu Pengiriman*: ${dateStr} WIB\n\n` +
            `Mohon verifikasi pembayaran ini di Dashboard Admin.`;

        // Get admin phone number
        const adminPhone = await getAdminPhone();
        if (!adminPhone) {
            console.error('[uploadPaymentProof] Admin phone number not found in settings or user table.');
            return res.status(500).json({ error: 'Nomor WhatsApp admin belum dikonfigurasi.' });
        }

        // Send WhatsApp message to admin
        const media = new MessageMedia(
            req.file.mimetype,
            req.file.buffer.toString('base64'),
            req.file.originalname
        );

        try {
            await sendWaMessage(adminPhone, caption, { media });
        } catch (waErr) {
            console.error('[uploadPaymentProof] Failed to send WhatsApp notification to admin:', waErr.message);
            // We proceed with updating database and returning success even if notification fails
        }

        // Update database status
        await pool.query(
            `UPDATE transactions 
             SET payment_proof_sent = TRUE 
             WHERE id = $1`,
            [transaction.id]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error('[uploadPaymentProof]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

/**
 * Creates an offline cashier transaction (Transaksi Diluar Aplikasi)
 */
export async function createOfflineTransaction(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const { 
        customer_name, 
        customer_phone, 
        category_type, // 'salon', 'rental', 'manual'
        amount, 
        payment_method, // 'cash', 'qris', 'transfer'
        notes
    } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Nominal transaksi wajib diisi dan harus lebih dari 0.' });
    }

    const validMethods = ['cash', 'qris', 'transfer'];
    const selectedMethod = validMethods.includes(payment_method) ? payment_method : 'cash';
    const cName = customer_name ? customer_name.trim() : 'Pelanggan Offline';
    const cPhone = customer_phone ? customer_phone.trim() : null;
    const catType = category_type || 'manual';
    const numAmount = Number(amount);

    try {
        const insertQuery = `
            INSERT INTO transactions (
                user_id, booking_id, rental_id, total_amount, payment_method, status, 
                payment_proof_url, payment_proof_sent, customer_name, customer_phone, 
                category_type, notes, created_at
            )
            VALUES (
                NULL, NULL, NULL, $1, $2, 'lunas', 
                NULL, TRUE, $3, $4, 
                $5, $6, NOW()
            )
            RETURNING id, total_amount, payment_method, created_at;
        `;

        const result = await pool.query(insertQuery, [
            numAmount,
            selectedMethod,
            cName,
            cPhone,
            catType,
            notes || (catType === 'salon' ? 'Transaksi Salon Offline' : catType === 'rental' ? 'Sewa Pakaian Offline' : 'Kasir Manual')
        ]);

        return res.status(201).json({
            success: true,
            message: 'Transaksi offline berhasil dicatat.',
            transaction: result.rows[0]
        });
    } catch (err) {
        console.error('[createOfflineTransaction]', err);
        return res.status(500).json({ error: 'Gagal mencatat transaksi offline.' });
    }
}
