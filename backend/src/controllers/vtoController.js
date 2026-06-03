// backend/src/controllers/vtoController.js
import pool from '../services/db.js';

/**
 * Get VTO status for the calling user
 */
export async function getMyVtoStatus(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID context is required.' });
        }

        // Get VTO configuration settings
        const settingsResult = await pool.query(
            `SELECT key, value FROM settings WHERE key IN ('vto_limit_default', 'vto_reset_interval_days')`
        );
        const settingsMap = {};
        for (const row of settingsResult.rows) {
            settingsMap[row.key] = row.value;
        }

        const limit = parseInt(settingsMap["vto_limit_default"] ?? "5", 10);
        const intervalDays = parseInt(settingsMap["vto_reset_interval_days"] ?? "14", 10);

        // Query user VTO state
        const userResult = await pool.query(
            `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
            [userId]
        );

        if (!userResult.rows.length) {
            return res.status(404).json({ error: 'User not found in database.' });
        }

        let { vto_usage, vto_reset_at } = userResult.rows[0];
        
        // If vto_reset_at is null, initialize it
        if (!vto_reset_at) {
            await pool.query(
                `UPDATE "user" SET vto_reset_at = NOW() WHERE id = $1`,
                [userId]
            );
            vto_reset_at = new Date();
        }

        const resetAt = new Date(vto_reset_at);
        const now = new Date();
        const diffDays = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

        // Check if interval has passed to reset usage
        if (diffDays >= intervalDays) {
            await pool.query(
                `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
                [userId]
            );
            vto_usage = 0;
            vto_reset_at = now.toISOString();
        }

        const usage = vto_usage ?? 0;
        const remaining = Math.max(0, limit - usage);
        const nextReset = new Date(new Date(vto_reset_at).getTime() + intervalDays * 24 * 60 * 60 * 1000);

        return res.json({
            usage,
            limit,
            remaining,
            next_reset: nextReset.toISOString(),
            can_use: remaining > 0
        });
    } catch (err) {
        console.error('[getMyVtoStatus]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Force reset VTO usage for a user (called when rental is finished)
 */
export async function resetVtoUsage(req, res) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required in the body.' });
        }

        const result = await pool.query(
            `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1 RETURNING id`,
            [userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[resetVtoUsage]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Increment usage count when user successfully uses VTO
 */
export async function incrementVtoUsage(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID context is required.' });
        }

        const settingsResult = await pool.query(
            `SELECT key, value FROM settings WHERE key IN ('vto_limit_default', 'vto_reset_interval_days')`
        );
        const settingsMap = {};
        for (const row of settingsResult.rows) {
            settingsMap[row.key] = row.value;
        }

        const limit = parseInt(settingsMap["vto_limit_default"] ?? "5", 10);
        const intervalDays = parseInt(settingsMap["vto_reset_interval_days"] ?? "14", 10);

        const userResult = await pool.query(
            `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
            [userId]
        );

        if (!userResult.rows.length) {
            return res.status(404).json({ error: 'User not found in database.' });
        }

        let { vto_usage, vto_reset_at } = userResult.rows[0];
        
        if (!vto_reset_at) {
            await pool.query(
                `UPDATE "user" SET vto_reset_at = NOW() WHERE id = $1`,
                [userId]
            );
            vto_reset_at = new Date();
        }

        const resetAt = new Date(vto_reset_at);
        const now = new Date();
        const diffDays = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= intervalDays) {
            await pool.query(
                `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
                [userId]
            );
            vto_usage = 0;
        }

        const currentUsage = vto_usage ?? 0;
        if (currentUsage >= limit) {
            return res.status(429).json({ error: "Kuota Virtual Try-On habis", remaining: 0 });
        }

        const updated = await pool.query(
            `UPDATE "user" SET vto_usage = COALESCE(vto_usage, 0) + 1 WHERE id = $1 RETURNING vto_usage`,
            [userId]
        );

        const newUsage = updated.rows[0].vto_usage;
        const remaining = Math.max(0, limit - newUsage);

        return res.json({ success: true, usage: newUsage, limit, remaining });
    } catch (err) {
        console.error('[incrementVtoUsage]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
