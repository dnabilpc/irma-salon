import test from 'node:test';
import assert from 'node:assert/strict';
import Replicate from 'replicate';
import pg from 'pg';
import { handleVirtualTryOn, getVtoTaskStatus, processNextVtoTask } from '../controllers/tryonController.js';

test('handleVirtualTryOn - success in mock mode (header x-mock-request)', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'INSERT INTO vto_tasks': () => ({
            rows: [{ id: 123 }]
        })
    };

    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    // 2. Prepare mock request and response
    const req = {
        user: { id: 'dummy-user-id', role: 'customer' },
        headers: { 'x-mock-request': 'true' },
        files: {
            person: [{ originalname: 'selfie.png', buffer: Buffer.from('dummy-selfie-data') }],
            clothes: [{ originalname: 'dress.png', buffer: Buffer.from('dummy-clothes-data') }]
        },
        body: { outfit_name: 'Kebaya Indah' }
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

    // 3. Run the controller
    await handleVirtualTryOn(req, res);

    pg.Pool.prototype.query = originalQuery;

    // 4. Asserts
    assert.equal(responseStatus, 202);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.taskId, 123);
});

test('handleVirtualTryOn - success in mock mode (env MOCK_TRYON)', async () => {
    const originalMockTryon = process.env.MOCK_TRYON;
    process.env.MOCK_TRYON = 'true';

    const mockQueries = {
        'INSERT INTO vto_tasks': () => ({
            rows: [{ id: 456 }]
        })
    };

    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    const req = {
        user: { id: 'dummy-user-id', role: 'customer' },
        headers: {},
        files: {
            person: [{ originalname: 'selfie.png', buffer: Buffer.from('dummy-selfie-data') }],
            clothes: [{ originalname: 'dress.png', buffer: Buffer.from('dummy-clothes-data') }]
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

    await handleVirtualTryOn(req, res);

    pg.Pool.prototype.query = originalQuery;
    process.env.MOCK_TRYON = originalMockTryon;

    assert.equal(responseStatus, 202);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.taskId, 456);
});

test('handleVirtualTryOn - validation failure (unauthorized)', async () => {
    const req = {
        user: null, // No session
        files: {
            person: [{ originalname: 'selfie.png', buffer: Buffer.from('dummy-selfie-data') }],
            clothes: [{ originalname: 'dress.png', buffer: Buffer.from('dummy-clothes-data') }]
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

    await handleVirtualTryOn(req, res);

    assert.equal(responseStatus, 401);
    assert.match(responseJson.error, /Unauthorized/);
});

test('handleVirtualTryOn - validation failure (quota exceeded)', async () => {
    const mockQueries = {
        'SELECT key, value FROM settings': () => ({
            rows: [
                { key: 'vto_limit_default', value: '5' },
                { key: 'vto_reset_interval_days', value: '14' }
            ]
        }),
        'SELECT vto_usage, vto_reset_at FROM "user"': () => ({
            rows: [{ vto_usage: 5, vto_reset_at: new Date() }] // Max quota reached
        })
    };

    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    const req = {
        user: { id: 'dummy-user-id', role: 'customer' },
        headers: {},
        files: {
            person: [{ originalname: 'selfie.png', buffer: Buffer.from('dummy-selfie-data') }],
            clothes: [{ originalname: 'dress.png', buffer: Buffer.from('dummy-clothes-data') }]
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

    await handleVirtualTryOn(req, res);

    pg.Pool.prototype.query = originalQuery;

    assert.equal(responseStatus, 429);
    assert.match(responseJson.error, /Kuota Virtual Try-On Anda telah habis/);
});

test('getVtoTaskStatus - success, not found, forbidden, admin access', async () => {
    // 1. Success case: Owner requests status
    let mockTaskRows = [{ id: 123, user_id: 'owner-id', status: 'completed', result_image_url: 'https://example.com/res.jpg', garment_description: 'MOCK', error_message: null }];
    
    const mockQueries = {
        'SELECT id, user_id, status': () => ({
            rows: mockTaskRows
        })
    };

    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
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

    // Test success
    await getVtoTaskStatus({ user: { id: 'owner-id', role: 'customer' }, params: { id: 123 } }, res);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.task.imageUrl, 'https://example.com/res.jpg');

    // Test forbidden (another customer requests owner's task)
    responseStatus = null;
    await getVtoTaskStatus({ user: { id: 'stranger-id', role: 'customer' }, params: { id: 123 } }, res);
    assert.equal(responseStatus, 403);
    assert.match(responseJson.error, /Forbidden/);

    // Test admin access (admin requests owner's task)
    responseStatus = null;
    responseJson = null;
    await getVtoTaskStatus({ user: { id: 'admin-id', role: 'admin' }, params: { id: 123 } }, res);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.task.status, 'completed');

    // Test not found
    mockTaskRows = []; // Empty rows
    responseStatus = null;
    await getVtoTaskStatus({ user: { id: 'owner-id', role: 'customer' }, params: { id: 123 } }, res);
    assert.equal(responseStatus, 404);
    assert.match(responseJson.error, /Task tidak ditemukan/);

    pg.Pool.prototype.query = originalQuery;
});

test('processNextVtoTask - success and failure', async () => {
    // 1. Success case: worker processes a pending task
    let selectRows = [{ id: 999, user_id: 'user-77', person_image_url: 'https://example.com/p.jpg', clothes_image_url: 'https://example.com/c.jpg' }];
    let updateTaskCalled = false;
    let incrementUsageCalled = false;

    const queryMockSuccess = async function(text, params) {
        if (text.includes('SELECT') && text.includes('vto_tasks') && text.includes('pending')) {
            return { rows: selectRows };
        }
        if (text.includes('UPDATE') && text.includes('vto_tasks') && text.includes('processing')) {
            return { rows: [] };
        }
        if (text.includes('UPDATE') && text.includes('vto_tasks') && text.includes('completed')) {
            updateTaskCalled = true;
            return { rows: [] };
        }
        if (text.includes('UPDATE') && text.includes('"user"') && text.includes('vto_usage')) {
            incrementUsageCalled = true;
            return { rows: [] };
        }
        return { rows: [] };
    };

    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = queryMockSuccess;

    const originalConnect = pg.Pool.prototype.connect;
    pg.Pool.prototype.connect = async function() {
        return {
            query: queryMockSuccess,
            release: () => {}
        };
    };

    const originalRun = Replicate.prototype.run;
    Replicate.prototype.run = async function(model, options) {
        if (model === "google/gemini-2.5-flash") {
            return "GARMENT TYPE: dress\nCOLOR: red";
        }
        return ["https://example.com/output.jpg"];
    };

    // Run VTO background worker
    await processNextVtoTask();

    assert.equal(updateTaskCalled, true);
    assert.equal(incrementUsageCalled, true);

    // 2. Error case: Replicate API failure (permanent)
    selectRows = [{ id: 999, user_id: 'user-77', person_image_url: 'https://example.com/p.jpg', clothes_image_url: 'https://example.com/c.jpg' }];
    updateTaskCalled = false;
    let taskFailedCalled = false;
    let savedErrorMessage = null;

    const queryMockError = async function(text, params) {
        if (text.includes('SELECT') && text.includes('vto_tasks') && text.includes('pending')) {
            return { rows: selectRows };
        }
        if (text.includes('UPDATE') && text.includes('vto_tasks') && text.includes('processing')) {
            return { rows: [] };
        }
        if (text.includes('UPDATE') && text.includes('vto_tasks') && text.includes('failed')) {
            taskFailedCalled = true;
            savedErrorMessage = params[0];
            return { rows: [] };
        }
        return { rows: [] };
    };

    pg.Pool.prototype.query = queryMockError;
    pg.Pool.prototype.connect = async function() {
        return {
            query: queryMockError,
            release: () => {}
        };
    };

    Replicate.prototype.run = async function(model, options) {
        throw new Error("Replicate API Rate limit or auth error");
    };

    await processNextVtoTask();

    assert.equal(taskFailedCalled, true);
    assert.match(savedErrorMessage, /Replicate API Rate limit/);

    // Restore original prototypes
    Replicate.prototype.run = originalRun;
    pg.Pool.prototype.query = originalQuery;
    pg.Pool.prototype.connect = originalConnect;
});
