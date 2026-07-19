/**
 * Migration: Rename status 'terlambat' to 'overdue' in check constraints and records 
 * for consistent English language naming convention in enum values.
 * @param {import('pg').PoolClient} client 
 */
export async function migrate(client) {
    // 1. Drop check constraint lama
    await client.query(`ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_rental_status_check`);

    // 2. Update record 'terlambat' lama ke 'overdue'
    await client.query(`UPDATE rentals SET rental_status = 'overdue' WHERE rental_status = 'terlambat'`);

    // 3. Tambahkan check constraint baru yang membolehkan status 'overdue'
    await client.query(`
        ALTER TABLE rentals ADD CONSTRAINT rentals_rental_status_check 
        CHECK (rental_status IN ('done', 'ongoing', 'pending', 'only deposit', 'cancelled', 'overdue'))
    `);
    console.log('[Migration] rentals_rental_status_check updated to use overdue instead of terlambat.');
}
