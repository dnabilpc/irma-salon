// backend/src/routes/whatsappRoutes.js
import express from 'express';
import { getWhatsappStatus, getWhatsappQrStream, sendWaMessage } from '../services/whatsappService.js';

const router = express.Router();

// Get Connection Status
router.get('/whatsapp/status', (req, res) => {
    res.json(getWhatsappStatus());
});

// Stream QR Code Image
router.get('/whatsapp/qr-image', async (req, res) => {
    await getWhatsappQrStream(res);
});

// Render QR code in a simple HTML page
router.get('/whatsapp/qr', (req, res) => {
    const state = getWhatsappStatus();
    
    if (state.status === 'READY') {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Status</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 50px; background-color: #f7f9fa; color: #2c3e50; }
                        .card { display: inline-block; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        h1 { color: #25D366; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>WhatsApp Connected! ✅</h1>
                        <p>The client is active and ready to send messages.</p>
                    </div>
                </body>
            </html>
        `);
    }

    if (!state.hasQr) {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Status</title>
                    <meta http-equiv="refresh" content="3">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 50px; background-color: #f7f9fa; color: #2c3e50; }
                        .card { display: inline-block; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>Connecting to WhatsApp...</h2>
                        <p>Generating QR code or initializing. Page will refresh automatically in 3 seconds...</p>
                    </div>
                </body>
            </html>
        `);
    }

    res.send(`
        <html>
            <head>
                <title>Scan WhatsApp QR Code</title>
                <meta http-equiv="refresh" content="15">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 50px; background-color: #f7f9fa; color: #2c3e50; }
                    .card { display: inline-block; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    img { border: 1px solid #ddd; padding: 10px; background: #fff; margin-top: 20px; }
                    .note { margin-top: 25px; color: #7f8c8d; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Scan QR Code</h2>
                    <p>Open WhatsApp on your phone -> Linked Devices -> Link a Device, then scan this code:</p>
                    <img src="/api/whatsapp/qr-image" alt="WhatsApp QR Code" />
                    <p class="note">This page will automatically refresh every 15 seconds to fetch new QR or update status.</p>
                </div>
            </body>
        </html>
    `);
});

// API Send message
router.post('/whatsapp/send', async (req, res) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({ success: false, error: 'Parameters "to" and "message" are required.' });
    }

    try {
        await sendWaMessage(to, message);
        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to send WhatsApp message.' });
    }
});

export default router;
