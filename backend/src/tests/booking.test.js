import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createBooking } from '../controllers/bookingController.js';
import pool from '../services/db.js';

test('createBooking - success', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'SELECT id, service_name, price, hour_duration': () => ({
            rows: [{ id: 10, service_name: 'Potong Rambut', price: 50000, hour_duration: 1.0 }]
        }),
        'SELECT b.id, b.booking_datetime': () => ({
            rows: [] // No overlapping bookings
        }),
        'INSERT INTO bookings': () => ({
            rows: [{ id: 99 }]
        }),
        'SELECT name, phone_number, email FROM "user"': () => ({
            rows: [{ name: 'Test Customer', phone_number: '080000012345', email: 'customer@test.com' }]
        }),
        'INSERT INTO booking_details': () => ({ rows: [] }),
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
            booking_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            service_ids: [10],
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
    await createBooking(req, res);

    // Restore original prototypes
    pg.Pool.prototype.query = originalQuery;
    pg.Pool.prototype.connect = originalConnect;

    // 4. Asserts
    assert.equal(responseStatus, 201);
    assert.equal(responseJson.bookingId, 99);
    assert.equal(responseJson.token, null);
    assert.equal(responseJson.redirect_url, null);
});

test('createBooking - validation failure (invalid payment method)', async () => {
    const req = {
        user: { id: 1 },
        body: {
            booking_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            service_ids: [10],
            payment_method: 'cash' // Booking only accepts qris now!
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

    await createBooking(req, res);

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Metode pembayaran tidak valid/);
});

test('createBooking - validation failure (less than 3 hours in future)', async () => {
    const req = {
        user: { id: 1 },
        body: {
            booking_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            service_ids: [10],
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

    await createBooking(req, res);

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Booking harus dipesan minimal 3 jam sebelum waktu/);
});

test('createBooking - validation failure (more than 3 weeks in future)', async () => {
    const req = {
        user: { id: 1 },
        body: {
            booking_datetime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
            service_ids: [10],
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

    await createBooking(req, res);

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Booking tidak boleh lebih dari 3 minggu/);
});

after(() => {
    pool.end();
});
