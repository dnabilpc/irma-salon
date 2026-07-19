/**
 * Migration: Convert rentals.rental_status type from user-defined enum to VARCHAR(50)
 * and update constraint check to allow 'overdue' status safely.
 * @param {import('pg').PoolClient} client 
 */
export async function migrate(client) {
    // 1. Drop check constraint lama
    await client.query(`ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_rental_status_check`);

    // 2. Ubah tipe kolom dari user-defined enum ke VARCHAR(50)
    await client.query(`ALTER TABLE rentals ALTER COLUMN rental_status TYPE VARCHAR(50) USING rental_status::text`);

    // 3. Tambahkan check constraint baru yang membolehkan status 'overdue'
    await client.query(`
        ALTER TABLE rentals ADD CONSTRAINT rentals_rental_status_check 
        CHECK (rental_status IN ('done', 'ongoing', 'pending', 'only deposit', 'cancelled', 'overdue'))
    `);
    console.log('[Migration] rentals.rental_status converted to VARCHAR(50) with updated check constraints.');
}
