import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

test('authMiddleware - checkInternalApiKey success', () => {
    // Save original env key
    const originalApiKey = process.env.INTERNAL_API_KEY;
    process.env.INTERNAL_API_KEY = 'super-secret-key';

    const req = {
        headers: {
            authorization: 'Bearer super-secret-key',
            'x-user-id': 'user-123',
            'x-user-role': 'customer'
        },
        ip: '127.0.0.1'
    };

    const res = {};
    let nextCalled = false;
    const next = () => {
        nextCalled = true;
    };

    checkInternalApiKey(req, res, next);

    assert.equal(nextCalled, true);
    assert.deepEqual(req.user, { id: 'user-123', role: 'customer' });

    // Restore env
    process.env.INTERNAL_API_KEY = originalApiKey;
});

test('authMiddleware - checkInternalApiKey failure (missing authorization header)', () => {
    const req = {
        headers: {},
        ip: '127.0.0.1'
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

    let nextCalled = false;
    const next = () => {
        nextCalled = true;
    };

    checkInternalApiKey(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 401);
    assert.equal(responseJson.error, 'Unauthorized: Missing API Key');
});

test('authMiddleware - checkInternalApiKey failure (invalid bearer token)', () => {
    const originalApiKey = process.env.INTERNAL_API_KEY;
    process.env.INTERNAL_API_KEY = 'super-secret-key';

    const req = {
        headers: {
            authorization: 'Bearer wrong-key'
        },
        ip: '127.0.0.1'
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

    let nextCalled = false;
    const next = () => {
        nextCalled = true;
    };

    checkInternalApiKey(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 401);
    assert.equal(responseJson.error, 'Unauthorized: Invalid API Key');

    process.env.INTERNAL_API_KEY = originalApiKey;
});
