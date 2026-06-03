// backend/src/middleware/authMiddleware.js

/**
 * Middleware to secure Express API and extract Next.js forwarded user context
 */
export function checkInternalApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[Security] Unauthorized access attempt blocked. IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
    }

    const token = authHeader.split(' ')[1];
    const expectedToken = process.env.INTERNAL_API_KEY;

    if (!expectedToken || token !== expectedToken) {
        console.warn(`[Security] Invalid API Key submitted. IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    // Extract User context forwarded by Next.js Server Action
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    // Bind to request object
    req.user = {
        id: userId || null,
        role: userRole || null
    };

    next();
}
