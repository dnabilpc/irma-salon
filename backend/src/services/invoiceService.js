// backend/src/services/invoiceService.js
import pool from './db.js';
import puppeteer from 'puppeteer';

/**
 * Format currency to IDR Rupiah format
 */
export function formatRupiah(val) {
    if (val === null || val === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val);
}

/**
 * Format ISO string to Indonesian date string
 */
export function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Retrieve transaction details and corresponding booking/rental items from DB
 */
export async function getInvoiceData(transactionId) {
    const trxQuery = await pool.query(
        `SELECT 
            t.id, 
            t.booking_id, 
            t.rental_id, 
            t.rental_order_id,
            t.total_amount::numeric AS total_amount, 
            t.subtotal::numeric AS subtotal,
            t.payment_method,
            t.created_at,
            t.status AS payment_status,
            t.user_id,
            COALESCE(t.customer_name, u.name) AS customer_name,
            COALESCE(t.customer_phone, u.phone_number) AS customer_phone,
            u.email AS customer_email,
            b.booking_datetime,
            r.start_date,
            r.duration_days,
            oc.outfit_name
         FROM transactions t
         LEFT JOIN "user" u ON t.user_id = u.id
         LEFT JOIN bookings b ON t.booking_id = b.id
         LEFT JOIN rentals r ON t.rental_id = r.id
         LEFT JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
         WHERE t.id = $1`,
        [transactionId]
    );

    if (trxQuery.rows.length === 0) {
        return null;
    }

    const transaction = trxQuery.rows[0];

    // Fetch items details
    let items = [];
    if (transaction.booking_id) {
        const servicesRes = await pool.query(
            `SELECT ss.service_name AS name, bd.price_at_booking::numeric AS price
             FROM booking_details bd
             JOIN salon_services ss ON bd.salon_service_id = ss.id
             WHERE bd.booking_id = $1`,
            [transaction.booking_id]
        );
        items = servicesRes.rows;
    } else if (transaction.rental_order_id) {
        const rentalsRes = await pool.query(
            `SELECT oc.outfit_name, r.duration_days, r.amount_to_be_paid::numeric AS price, r.start_date
             FROM rentals r
             JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
             WHERE r.rental_order_id = $1`,
            [transaction.rental_order_id]
        );
        items = rentalsRes.rows.map((row) => ({
            name: `Sewa Baju: ${row.outfit_name} (${row.duration_days} hari)`,
            price: row.price,
        }));
    } else if (transaction.rental_id) {
        items = [
            {
                name: `Sewa Baju: ${transaction.outfit_name} (${transaction.duration_days} hari)`,
                price: transaction.subtotal,
            },
        ];
    }

    return { transaction, items };
}

/**
 * HTML code template for the premium invoice card
 */
export function generateInvoiceHtml(transaction, items) {
    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #FAF0E6; color: #2C1A0E;">${item.name}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #FAF0E6; text-align: right; color: #2C1A0E; font-family: monospace;">${formatRupiah(item.price)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice Irma Wedding Salon</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        body {
            margin: 0;
            padding: 0;
            background-color: #FAF6F4;
            font-family: 'DM Sans', sans-serif;
            color: #2C1A0E;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        .invoice-card {
            background: white;
            border: 1px solid #EDD8CC;
            border-radius: 12px;
            padding: 40px;
            width: 500px;
            box-shadow: 0 8px 30px rgba(107, 58, 42, 0.06);
            position: relative;
            box-sizing: border-box;
            margin: 20px;
        }
        .stamp {
            position: absolute;
            top: 35px;
            right: 35px;
            border: 3px solid #1A7A4A;
            color: #1A7A4A;
            padding: 6px 14px;
            font-weight: bold;
            font-size: 1.1rem;
            text-transform: uppercase;
            border-radius: 8px;
            transform: rotate(-10deg);
            background: rgba(26, 122, 74, 0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 1.6rem;
            font-weight: bold;
            color: #6B3A2A;
            margin: 0 0 4px 0;
        }
        .subtitle {
            font-size: 0.72rem;
            letter-spacing: 0.2em;
            color: #C9922A;
            text-transform: uppercase;
            margin-bottom: 15px;
            margin-top: 0;
        }
        .contact-info {
            font-size: 0.8rem;
            color: #8B6A5A;
            line-height: 1.5;
        }
        .divider {
            height: 1px;
            background: #EDD8CC;
            margin: 20px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 0.82rem;
            margin-bottom: 25px;
        }
        .info-label {
            color: #8B6A5A;
            margin-bottom: 3px;
        }
        .info-value {
            font-weight: 500;
            color: #2C1A0E;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 0.85rem;
        }
        th {
            text-align: left;
            padding: 8px 0;
            border-bottom: 2px solid #EDD8CC;
            color: #8B6A5A;
            font-weight: 600;
        }
        .totals {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-size: 0.85rem;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            width: 220px;
            margin-bottom: 8px;
        }
        .total-row-grand {
            display: flex;
            justify-content: space-between;
            width: 220px;
            font-weight: 700;
            color: #6B3A2A;
            font-size: 1.05rem;
            margin-top: 5px;
            border-top: 1px solid #EDD8CC;
            padding-top: 8px;
        }
        .footer {
            text-align: center;
            font-size: 0.78rem;
            color: #B09080;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="invoice-card">
        <div class="stamp">LUNAS</div>
        <div class="header">
            <h1>Irma Wedding Salon</h1>
            <p class="subtitle">Wedding Salon & Sewa Baju</p>
            <div class="contact-info">
                Graha Suko Indah B-1, Sukodono, Sidoarjo<br>
                WhatsApp: 085174481660 | Email: info@salonirma.com
            </div>
        </div>
        <div class="divider"></div>
        <div class="info-grid">
            <div>
                <div class="info-label">NO. INVOICE</div>
                <div class="info-value" style="font-family: monospace;">INV/2026/${transaction.id}</div>
            </div>
            <div style="text-align: right;">
                <div class="info-label">TANGGAL</div>
                <div class="info-value">${formatDate(transaction.created_at)}</div>
            </div>
            <div>
                <div class="info-label">PELANGGAN</div>
                <div class="info-value">${transaction.customer_name}</div>
            </div>
            <div style="text-align: right;">
                <div class="info-label">METODE BAYAR</div>
                <div class="info-value">${transaction.payment_method === 'qris' ? 'QRIS Statis' : 'Bayar Di Tempat (Cash)'}</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Deskripsi Layanan / Item</th>
                    <th style="text-align: right;">Harga</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="totals">
            <div class="total-row">
                <span style="color: #8B6A5A;">Subtotal:</span>
                <span style="font-family: monospace;">${formatRupiah(transaction.subtotal)}</span>
            </div>
            <div class="total-row-grand">
                <span>Total Lunas:</span>
                <span style="font-family: monospace;">${formatRupiah(transaction.total_amount)}</span>
            </div>
        </div>
        <div class="footer">
            Terima kasih atas kunjungan Anda di Irma Wedding Salon! ✨
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Render the invoice HTML to a JPEG screenshot buffer using Puppeteer
 */
export async function generateInvoiceImageBuffer(transaction, items) {
    const html = generateInvoiceHtml(transaction, items);
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        
        // set viewport width to 540 and height to 850
        await page.setViewport({ width: 540, height: 850 });
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Wait a brief period to let any external assets/fonts resolve
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const element = await page.$('.invoice-card');
        let buffer;
        if (element) {
            buffer = await element.screenshot({ type: 'jpeg', quality: 90 });
        } else {
            buffer = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: true });
        }
        
        await browser.close();
        return buffer;
    } catch (err) {
        if (browser) {
            await browser.close();
        }
        throw err;
    }
}

/**
 * Text receipt fallback if Puppeteer fails to run
 */
export function generateInvoiceText(transaction, items) {
    const itemsText = items.map(item => `- ${item.name} (${formatRupiah(item.price)})`).join('\n');
    return `*INVOICE IRMA WEDDING SALON*
Wedding Salon & Sewa Baju
-----------------------------------
No. Invoice: INV/2026/${transaction.id}
Tanggal: ${formatDate(transaction.created_at)}
Pelanggan: ${transaction.customer_name}
Metode Bayar: ${transaction.payment_method === 'qris' ? 'QRIS Statis' : 'Bayar Di Tempat (Cash)'}
Status: *LUNAS*

*Layanan / Item:*
${itemsText}

Subtotal: ${formatRupiah(transaction.subtotal)}
*TOTAL LUNAS:* ${formatRupiah(transaction.total_amount)}
-----------------------------------
Terima kasih atas kunjungan Anda di Irma Wedding Salon! ✨`;
}
