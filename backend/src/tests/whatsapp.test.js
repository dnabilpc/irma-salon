import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'whatsapp-web.js';

// Mutate the Client prototype directly to avoid ES module import ordering issues
const originalInitialize = pkg.Client.prototype.initialize;
const originalDestroy = pkg.Client.prototype.destroy;
const originalOn = pkg.Client.prototype.on;
const originalGetNumberId = pkg.Client.prototype.getNumberId;
const originalSendMessage = pkg.Client.prototype.sendMessage;

let eventHandlers = {};

pkg.Client.prototype.on = function(event, handler) {
    eventHandlers[event] = handler;
};

pkg.Client.prototype.initialize = async function() {
    // Trigger the ready event
    if (eventHandlers['ready']) {
        // Use setTimeout to yield so that client.initialize() call returns first
        setTimeout(async () => {
            try {
                await eventHandlers['ready']();
            } catch (e) {
                console.error('Error in mock ready handler:', e);
            }
        }, 5);
    }
    return Promise.resolve();
};

pkg.Client.prototype.destroy = async function() {
    if (eventHandlers['disconnected']) {
        await eventHandlers['disconnected']('testing');
    }
    return Promise.resolve();
};

pkg.Client.prototype.getNumberId = async function(number) {
    if (number.includes('999999')) {
        return null; // Simulate unregistered number
    }
    return { _serialized: number };
};

pkg.Client.prototype.sendMessage = async function(jid, message, options) {
    return { id: 'mock-msg-123', to: jid, body: message, options };
};

// Now import the service under test
import { initWhatsapp, formatPhoneNumber, sendWaMessage, getWhatsappStatus } from '../services/whatsappService.js';

test('whatsappService - formatPhoneNumber', () => {
    assert.equal(formatPhoneNumber('08123456789'), '628123456789@c.us');
    assert.equal(formatPhoneNumber('8123456789'), '628123456789@c.us');
    assert.equal(formatPhoneNumber('+628123456789'), '628123456789@c.us');
    assert.equal(formatPhoneNumber(null), null);
});

test('whatsappService - status and sending message', async () => {
    // Before initialization
    assert.deepEqual(getWhatsappStatus(), { status: 'DISCONNECTED', hasQr: false });

    // Send message when not ready should fail
    await assert.rejects(
        sendWaMessage('08123456789', 'Hello'),
        /WhatsApp client is not ready/
    );

    // Initialize the WhatsApp client mock
    await initWhatsapp();

    // Yield execution to allow ready event callback to run
    await new Promise(resolve => setTimeout(resolve, 20));

    // After mock initialization, it triggers ready, status should be READY
    assert.deepEqual(getWhatsappStatus(), { status: 'READY', hasQr: false });

    // Send message to registered number
    const res = await sendWaMessage('08123456789', 'Hello World');
    assert.equal(res.id, 'mock-msg-123');
    assert.equal(res.body, 'Hello World');
    assert.equal(res.to, '628123456789@c.us');

    // Send message to unregistered number
    await assert.rejects(
        sendWaMessage('08999999999', 'Hello'),
        /is not registered on WhatsApp/
    );

    // Restore original client prototype methods
    pkg.Client.prototype.initialize = originalInitialize;
    pkg.Client.prototype.destroy = originalDestroy;
    pkg.Client.prototype.on = originalOn;
    pkg.Client.prototype.getNumberId = originalGetNumberId;
    pkg.Client.prototype.sendMessage = originalSendMessage;
});
