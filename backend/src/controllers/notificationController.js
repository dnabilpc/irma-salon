// backend/src/controllers/notificationController.js
import pool from '../services/db.js';

/**
 * Fetch the latest 30 notifications for the admin
 */
export async function getAdminNotifications(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, type, title, message, ref_id, is_read, created_at
             FROM notifications
             ORDER BY created_at DESC
             LIMIT 30`
        );
        return res.json(result.rows);
    } catch (err) {
        console.error('[getAdminNotifications]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Notification ID is required.' });
    }

    try {
        await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = $1`,
            [id]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('[markNotificationAsRead]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Mark all unread notifications as read
 */
export async function markAllNotificationsAsRead(req, res) {
    try {
        await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE is_read = FALSE`
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('[markAllNotificationsAsRead]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
