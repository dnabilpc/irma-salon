import crypto from 'crypto';

/**
 * Generates an obfuscated invoice code with format: TRX-YYYYMMDD-[6 random hex chars]
 * Example: TRX-20260717-A9F3C2
 */
export function generateInvoiceCode() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Generate 6 random hex characters (3 bytes)
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    return `TRX-${yyyy}${mm}${dd}-${randomHex}`;
}

/**
 * Generates an obfuscated booking code with format: BK-YYYYMMDD-[4 random hex chars]
 * Example: BK-20260717-E9A2
 */
export function generateBookingCode() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Generate 4 random hex characters (2 bytes)
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    return `BK-${yyyy}${mm}${dd}-${randomHex}`;
}

/**
 * Generates an obfuscated rental code with format: RT-YYYYMMDD-[4 random hex chars]
 * Example: RT-20260717-D5C8
 */
export function generateRentalCode() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Generate 4 random hex characters (2 bytes)
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    return `RT-${yyyy}${mm}${dd}-${randomHex}`;
}
