/**
 * Migration: Set transaction uuid column to VARCHAR(50) to allow TRX-YYYYMMDD-HEX formats.
 * @param {import('pg').PoolClient} client 
 */
export async function migrate(client) {
    const checkCol = await client.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'uuid'
    `);
    if (checkCol.rows.length > 0) {
        const dataType = checkCol.rows[0].data_type;
        if (dataType !== 'character varying') {
            await client.query(`ALTER TABLE transactions ALTER COLUMN uuid DROP DEFAULT`);
            await client.query(`ALTER TABLE transactions ALTER COLUMN uuid TYPE VARCHAR(50) USING uuid::text`);
            console.log('[Migration] Altered transactions.uuid type to VARCHAR(50).');
        }
    } else {
        await client.query(`
            ALTER TABLE transactions
            ADD COLUMN uuid VARCHAR(50) UNIQUE
        `);
        console.log('[Migration] Added transactions.uuid VARCHAR(50) column.');
    }
}
