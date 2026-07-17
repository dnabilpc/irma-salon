/**
 * Migration: Rename model_3d_file_link to model_2d_file_link in outfit_catalogues safely.
 * Checks for column existence first to avoid aborting the PostgreSQL transaction block.
 * @param {import('pg').PoolClient} client 
 */
export async function migrate(client) {
    const checkCol = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'outfit_catalogues' AND column_name = 'model_3d_file_link'
    `);
    if (checkCol.rows.length > 0) {
        await client.query(`
            ALTER TABLE outfit_catalogues 
            RENAME COLUMN model_3d_file_link TO model_2d_file_link
        `);
        console.log('[Migration] Renamed model_3d_file_link to model_2d_file_link in outfit_catalogues.');
    } else {
        console.log('[Migration] Column model_3d_file_link already renamed or does not exist in outfit_catalogues.');
    }
}
