// backend/src/controllers/vtoController.js
import pool from '../services/db.js';

/**
 * Get detailed VTO quota for a user including bonus tiers and inactivity logic
 */
export async function getUserVtoQuotaDetails(userId) {
    // 1. Get Settings
    const settingsResult = await pool.query(
        `SELECT key, value FROM settings WHERE key IN ('vto_limit_default', 'vto_reset_interval_days', 'vto_milestones_config', 'vto_bonus_expiry_days')`
    );
    const settingsMap = {};
    for (const row of settingsResult.rows) {
        settingsMap[row.key] = row.value;
    }

    const baseLimit = parseInt(settingsMap["vto_limit_default"] ?? "5", 10);
    const intervalDays = parseInt(settingsMap["vto_reset_interval_days"] ?? "14", 10);
    const bonusExpiryDays = parseInt(settingsMap["vto_bonus_expiry_days"] ?? "30", 10);

    let milestones = [
        { rentals_count: 1, bonus_limit: 2 },
        { rentals_count: 3, bonus_limit: 4 },
        { rentals_count: 6, bonus_limit: 6 },
        { rentals_count: 10, bonus_limit: 10 }
    ];
    if (settingsMap["vto_milestones_config"]) {
        try {
            const parsed = JSON.parse(settingsMap["vto_milestones_config"]);
            if (Array.isArray(parsed) && parsed.length > 0) {
                milestones = parsed;
            }
        } catch (e) {
            console.error("[getUserVtoQuotaDetails] Error parsing milestones config:", e);
        }
    }

    milestones.sort((a, b) => Number(a.rentals_count) - Number(b.rentals_count));

    // 2. Fetch User Completed Rentals & Last Rental Date
    const rentalsResult = await pool.query(
        `SELECT COUNT(*)::int AS completed_count, MAX(start_date) AS last_rental_date 
         FROM rentals 
         WHERE user_id = $1 AND rental_status = 'done'`,
        [userId]
    );

    const completedRentals = Number(rentalsResult.rows[0]?.completed_count || 0);
    const lastRentalDate = rentalsResult.rows[0]?.last_rental_date;

    // 3. Check Inactivity Reset for Bonus
    let isBonusExpired = false;
    let daysInactive = 0;
    if (lastRentalDate && bonusExpiryDays > 0) {
        const lastDate = new Date(lastRentalDate);
        const now = new Date();
        const diffTime = now.getTime() - lastDate.getTime();
        daysInactive = Math.floor(diffTime / (1000 * 3600 * 24));
        if (daysInactive > bonusExpiryDays) {
            isBonusExpired = true;
        }
    }

    // 4. Determine Active Bonus Limit
    let bonusLimit = 0;
    if (!isBonusExpired && completedRentals > 0) {
        for (const m of milestones) {
            if (completedRentals >= Number(m.rentals_count)) {
                bonusLimit = Number(m.bonus_limit);
            }
        }
    }

    const effectiveLimit = baseLimit + bonusLimit;

    // 5. Query User VTO Usage & Interval Reset
    const userResult = await pool.query(
        `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
        [userId]
    );

    if (!userResult.rows.length) {
        return { error: 'User not found in database.' };
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
        vto_reset_at = now.toISOString();
    }

    const usage = vto_usage ?? 0;
    const remaining = Math.max(0, effectiveLimit - usage);
    const nextReset = new Date(new Date(vto_reset_at).getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
        usage,
        limit: effectiveLimit,
        base_limit: baseLimit,
        bonus_limit: bonusLimit,
        completed_rentals: completedRentals,
        days_inactive: daysInactive,
        is_bonus_expired: isBonusExpired,
        bonus_expiry_days: bonusExpiryDays,
        remaining,
        next_reset: nextReset.toISOString(),
        can_use: remaining > 0
    };
}

/**
 * Get VTO status for the calling user
 */
export async function getMyVtoStatus(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID context is required.' });
        }

        const data = await getUserVtoQuotaDetails(userId);
        if (data.error) {
            return res.status(404).json({ error: data.error });
        }

        return res.json(data);
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
