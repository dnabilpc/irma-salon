import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
export { MessageMedia };
import qrcode from 'qrcode';

let client;
let qrCodeString = null;
let clientStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'AUTHENTICATING' | 'READY'

export async function initWhatsapp() {
    console.log('[WhatsApp] Initializing client...');

    // If a client already exists, destroy it first to avoid duplicate instances
    if (client) {
        try {
            console.log('[WhatsApp] Destroying existing client before re-initializing...');
            await client.destroy();
        } catch (err) {
            console.warn('[WhatsApp] Failed to destroy existing client:', err.message);
        }
    }

    clientStatus = 'AUTHENTICATING';

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'irma-salon-session',
            dataPath: './.wwebjs_auth' // Stores session locally so we don't have to scan QR code every time
        }),
        puppeteer: {
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
        }
    });

    client.on('qr', (qr) => {
        console.log('[WhatsApp] QR Code received. Scan it via URL: http://localhost:5000/api/whatsapp/qr');
        qrCodeString = qr;
        clientStatus = 'AUTHENTICATING';
    });

    client.on('authenticated', () => {
        console.log('[WhatsApp] Authenticated successfully!');
        qrCodeString = null;
    });

    client.on('auth_failure', (msg) => {
        console.error('[WhatsApp] Authentication failure:', msg);
        clientStatus = 'DISCONNECTED';
        qrCodeString = null;
    });

    client.on('ready', async () => {
        console.log('[WhatsApp] Client is ready and connected!');
        clientStatus = 'READY';
        qrCodeString = null;
    });

    client.on('disconnected', async (reason) => {
        console.log('[WhatsApp] Client was disconnected:', reason);
        clientStatus = 'DISCONNECTED';
        qrCodeString = null;

        try {
            console.log('[WhatsApp] Destroying old client instance...');
            await client.destroy();
        } catch (destroyErr) {
            console.error('[WhatsApp] Failed to destroy old client:', destroyErr.message);
        }

        // Re-initialize after disconnection
        setTimeout(() => {
            initWhatsapp();
        }, 5000);
    });

    client.initialize().catch(err => {
        console.error('[WhatsApp] Error during initialization:', err);
        clientStatus = 'DISCONNECTED';
    });
}

/**
 * Format phone number to standard WhatsApp JID: 628xxxxxxxx@c.us
 */
export function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');
    
    // Convert leading '0' to country code '62'
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    
    // If it starts with '8', prepend '62'
    else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    
    // Ensure it ends with @c.us for whatsapp-web.js
    if (!cleaned.endsWith('@c.us')) {
        cleaned = cleaned + '@c.us';
    }
    
    return cleaned;
}

export async function sendWaMessage(to, message, options = {}) {
    if (clientStatus !== 'READY') {
        console.error('[WhatsApp] Cannot send message. Client status:', clientStatus);
        throw new Error('WhatsApp client is not ready. Please scan the QR code first.');
    }

    try {
        const formattedJid = formatPhoneNumber(to);
        if (!formattedJid) {
            throw new Error(`Invalid phone number format: ${to}`);
        }
        let jid = formattedJid;



        try {
            console.log(`[WhatsApp] Resolving JID/LID for ${formattedJid}...`);
            const numberDetails = await client.getNumberId(formattedJid);
            if (numberDetails && numberDetails._serialized) {
                jid = numberDetails._serialized;
                console.log(`[WhatsApp] Resolved JID to: ${jid}`);
            } else {
                throw new Error(`Phone number ${to} is not registered on WhatsApp.`);
            }
        } catch (resErr) {
            console.error(`[WhatsApp] Failed to resolve JID/LID for ${formattedJid}:`, resErr.message);
            throw resErr;
        }

        console.log(`[WhatsApp] Sending message to ${jid}...`);
        
        let response;
        if (options.media) {
            response = await client.sendMessage(jid, options.media, { caption: message });
        } else {
            response = await client.sendMessage(jid, message);
        }
        
        console.log(`[WhatsApp] Message sent successfully to ${to}`);
        return response;
    } catch (error) {
        console.error(`[WhatsApp] Failed to send message to ${to}:`, error);
        throw error;
    }
}

/**
 * Get current client connection status
 */
export function getWhatsappStatus() {
    return {
        status: clientStatus,
        hasQr: !!qrCodeString
    };
}

/**
 * Generate QR code image buffer or stream
 */
export async function getWhatsappQrStream(res) {
    if (!qrCodeString) {
        return res.status(400).send('QR Code is not available or client is already connected.');
    }
    
    try {
        res.setHeader('Content-Type', 'image/png');
        await qrcode.toFileStream(res, qrCodeString);
    } catch (err) {
        console.error('[WhatsApp] Failed to generate QR stream:', err);
        res.status(500).send('Error generating QR image.');
    }
}
