// backend/src/services/midtransService.js
import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOURKEY';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_URL = MIDTRANS_IS_PRODUCTION 
    ? 'https://app.midtrans.com/snap/v1/transactions' 
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

/**
 * Creates a Midtrans Snap transaction token and redirect URL
 */
export async function createMidtransToken(orderId, amount, customerDetails) {
    const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
    
    const body = {
        transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(amount)
        },
        customer_details: {
            first_name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone
        }
    };

    const response = await fetch(SNAP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('[Midtrans API Error]', data);
        throw new Error(data.error_messages ? data.error_messages.join(', ') : 'Midtrans API error');
    }

    return {
        token: data.token,
        redirect_url: data.redirect_url
    };
}

/**
 * Verifies webhook notification signature from Midtrans
 */
export function verifyMidtransSignature(body) {
    const { order_id, status_code, gross_amount, signature_key } = body;
    if (!order_id || !status_code || !gross_amount || !signature_key) {
        return false;
    }
    
    const hashSource = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
    const computedSignature = crypto.createHash('sha512').update(hashSource).digest('hex');
    
    return computedSignature === signature_key;
}
