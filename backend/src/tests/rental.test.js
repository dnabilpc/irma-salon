import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createRental } from '../controllers/rentalController.js';
import pool from '../services/db.js';

test('createRental - success (cash)', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'SELECT COUNT(*) FROM rentals': () => ({
            rows: [{ count: 0 }]
        }),
        'SELECT id, outfit_name, price, stock FROM outfit_catalogues': () => ({
            rows: [{ id: 1, outfit_name: 'Kebaya Modern', price: 150000, stock: 1 }]
        }),
        'INSERT INTO rentals': () => ({
            rows: [{ id: 88 }]
        }),
        'SELECT name, phone_number, email FROM "user"': () => ({
            rows: [{ name: 'Test Customer', phone_number: '080000012345', email: 'customer@test.com' }]
        }),
        'INSERT INTO transactions': () => ({ rows: [] }),
        'INSERT INTO notifications': () => ({ rows: [] })
    };

    // Override pg Pool prototypes for this test run
    const originalQuery = pg.Pool.prototype.query;
    const originalConnect = pg.Pool.prototype.connect;

    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    pg.Pool.prototype.connect = async function() {
        return {
            query: async (text, params) => {
                for (const pattern of Object.keys(mockQueries)) {
                    if (text.includes(pattern)) {
                        return mockQueries[pattern](params);
                    }
                }
                return { rows: [] };
            },
            release: () => {}
        };
    };

    // 2. Prepare mock request and response
    const req = {
        user: { id: 1 },
        body: {
            outfit_catalogues_id: 1,
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            duration_days: 2,
            payment_method: 'cash'
        }
    };

    let responseStatus = null;
    let responseJson = null;

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseJson = data;
            return this;
        }
    };

    // 3. Call the controller function
    await createRental(req, res);

    // Restore original prototypes
    pg.Pool.prototype.query = originalQuery;
    pg.Pool.prototype.connect = originalConnect;

    // 4. Asserts
    assert.equal(responseStatus, 201);
    assert.equal(responseJson.rentalId, 88);
    assert.equal(responseJson.token, null);
    assert.equal(responseJson.redirect_url, null);
});

test('createRental - success (qris)', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'SELECT COUNT(*) FROM rentals': () => ({
            rows: [{ count: 0 }]
        }),
        'SELECT id, outfit_name, price, stock FROM outfit_catalogues': () => ({
            rows: [{ id: 1, outfit_name: 'Kebaya Modern', price: 150000, stock: 1 }]
        }),
        'INSERT INTO rentals': () => ({
            rows: [{ id: 88 }]
        }),
        'SELECT name, phone_number, email FROM "user"': () => ({
            rows: [{ name: 'Test Customer', phone_number: '080000012345', email: 'customer@test.com' }]
        }),
        'INSERT INTO transactions': () => ({ rows: [] }),
        'INSERT INTO notifications': () => ({ rows: [] })
    };

    // Override pg Pool prototypes for this test run
    const originalQuery = pg.Pool.prototype.query;
    const originalConnect = pg.Pool.prototype.connect;

    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    pg.Pool.prototype.connect = async function() {
        return {
            query: async (text, params) => {
                for (const pattern of Object.keys(mockQueries)) {
                    if (text.includes(pattern)) {
                        return mockQueries[pattern](params);
                    }
                }
                return { rows: [] };
            },
            release: () => {}
        };
    };

    // 2. Prepare mock request and response
    const req = {
        user: { id: 1 },
        body: {
            outfit_catalogues_id: 1,
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            duration_days: 2,
            payment_method: 'qris'
        }
    };

    let responseStatus = null;
    let responseJson = null;

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseJson = data;
            return this;
        }
    };

    // 3. Call the controller function
    await createRental(req, res);

    // Restore original prototypes
    pg.Pool.prototype.query = originalQuery;
    pg.Pool.prototype.connect = originalConnect;

    // 4. Asserts
    assert.equal(responseStatus, 201);
    assert.equal(responseJson.rentalId, 88);
    assert.equal(responseJson.token, null);
    assert.equal(responseJson.redirect_url, null);
});

test('createRental - validation failure (invalid payment method)', async () => {
    const req = {
        user: { id: 1 },
        body: {
            outfit_catalogues_id: 1,
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration_days: 2,
            payment_method: 'midtrans' // Midtrans is deleted!
        }
    };

    let responseStatus = null;
    let responseJson = null;

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseJson = data;
            return this;
        }
    };

    await createRental(req, res);

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Metode pembayaran tidak valid/);
});

test('createRental - validation failure (stock exceeded)', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'SELECT COUNT(*) FROM rentals': () => ({
            rows: [{ count: 1 }] // 1 rental already exists
        }),
        'SELECT id, outfit_name, price, stock FROM outfit_catalogues': () => ({
            rows: [{ id: 1, outfit_name: 'Kebaya Modern', price: 150000, stock: 1 }] // Stock is 1
        }),
    };

    // Override pg Pool prototypes for this test run
    const originalQuery = pg.Pool.prototype.query;
    const originalConnect = pg.Pool.prototype.connect;

    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    pg.Pool.prototype.connect = async function() {
        return {
            query: async (text, params) => {
                for (const pattern of Object.keys(mockQueries)) {
                    if (text.includes(pattern)) {
                        return mockQueries[pattern](params);
                    }
                }
                return { rows: [] };
            },
            release: () => {}
        };
    };

    // 2. Prepare mock request and response
    const req = {
        user: { id: 1 },
        body: {
            outfit_catalogues_id: 1,
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            duration_days: 2,
            payment_method: 'cash'
        }
    };

    let responseStatus = null;
    let responseJson = null;

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseJson = data;
            return this;
        }
    };

    // 3. Call the controller function
    await createRental(req, res);

    // Restore original prototypes
    pg.Pool.prototype.query = originalQuery;
    pg.Pool.prototype.connect = originalConnect;

    // 4. Asserts
    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Stok baju tidak tersedia/);
});

after(() => {
    pool.end();
});
