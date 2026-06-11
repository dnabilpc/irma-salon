import pool from '../services/db.js';

export async function getOpeningTimes(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, day_of_week, open_time::text, close_time::text 
             FROM opening_time`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[getOpeningTimes]', err);
        res.status(500).json({ error: 'Gagal memuat jam operasional.' });
    }
}

export async function updateOpeningTimes(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Akses ditolak.' });
    }

    const { schedules } = req.body; // Array of { day_of_week, open_time, close_time }
    if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: 'Format data schedules tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM opening_time');

        for (const sched of schedules) {
            const { day_of_week, open_time, close_time } = sched;
            if (!day_of_week || !open_time || !close_time) {
                throw new Error('Data jadwal harian tidak lengkap.');
            }
            await client.query(
                `INSERT INTO opening_time (day_of_week, open_time, close_time) 
                 VALUES ($1, $2, $3)`,
                [day_of_week, open_time, close_time]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[updateOpeningTimes]', err);
        res.status(500).json({ error: err.message || 'Gagal menyimpan jam operasional.' });
    } finally {
        client.release();
    }
}
