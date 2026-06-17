import test from 'node:test';
import assert from 'node:assert/strict';
import Replicate from 'replicate';
import pg from 'pg';
import { handleVirtualTryOn } from '../controllers/tryonController.js';

test('handleVirtualTryOn - success', async () => {
    // 1. Setup mock query handlers
    const mockQueries = {
        'SELECT key, value FROM settings': () => ({
            rows: [
                { key: 'vto_limit_default', value: '5' },
                { key: 'vto_reset_interval_days', value: '14' }
            ]
        }),
        'SELECT vto_usage, vto_reset_at FROM "user"': () => ({
            rows: [{ vto_usage: 0, vto_reset_at: new Date() }]
        }),
        'INSERT INTO vto_tasks': () => ({
            rows: [{ id: 123 }]
        }),
        'UPDATE "user" SET': () => ({
            rows: []
        })
    };

    // Override pg Pool prototypes for this test run
    const originalQuery = pg.Pool.prototype.query;
    pg.Pool.prototype.query = async function(text, params) {
        for (const pattern of Object.keys(mockQueries)) {
            if (text.includes(pattern)) {
                return mockQueries[pattern](params);
            }
        }
        return { rows: [] };
    };

    // 2. Override Replicate prototype run method for testing
    const originalRun = Replicate.prototype.run;
    Replicate.prototype.run = async function(model, options) {
        if (model === "google/gemini-2.5-flash") {
            if (options.input.prompt.includes("You are a fashion analyst")) {
                return "GARMENT TYPE: dress\nCOLOR: red\nDETAILS: lace trim";
            }
            if (options.input.prompt.includes("Analyze this person image")) {
                return "SHOT TYPE: half-body\nVISIBLE BODY PARTS: face, arms, chest\nCROPPED/HIDDEN BODY PARTS: legs, feet";
            }
        }
        if (model === "openai/gpt-image-2") {
            return ["https://example.com/mock-output-image.jpg"];
        }
        throw new Error(`Unknown model: ${model}`);
    };

    // 3. Prepare mock request and response
    const req = {
        user: { id: 'dummy-user-id', role: 'customer' },
        headers: { 'x-mock-request': 'true' },
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

    // 4. Run the controller
    await handleVirtualTryOn(req, res);

    // Restore original prototype
    Replicate.prototype.run = originalRun;
    pg.Pool.prototype.query = originalQuery;

    // 5. Asserts
    assert.equal(responseStatus, 202);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.taskId, 123);
});

test('handleVirtualTryOn - validation failure (missing files)', async () => {
    const req = {
        user: { id: 'dummy-user-id', role: 'customer' },
        headers: { 'x-mock-request': 'true' },
        files: {
            // Missing person file
            clothes: [{ originalname: 'dress.png', buffer: Buffer.from('dummy-clothes-data') }]
        }
    };

    // Setup mock query handlers for quota check (which is run before checking files)
    const mockQueries = {
        'SELECT key, value FROM settings': () => ({
            rows: [
                { key: 'vto_limit_default', value: '5' },
                { key: 'vto_reset_interval_days', value: '14' }
            ]
        }),
        'SELECT vto_usage, vto_reset_at FROM "user"': () => ({
            rows: [{ vto_usage: 0, vto_reset_at: new Date() }]
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

    await handleVirtualTryOn(req, res);

    pg.Pool.prototype.query = originalQuery;

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Missing required files/);
});
