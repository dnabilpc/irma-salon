import test from 'node:test';
import assert from 'node:assert/strict';
import Replicate from 'replicate';
import { handleVirtualTryOn } from '../controllers/tryonController.js';

test('handleVirtualTryOn - success', async () => {
    // 1. Override Replicate prototype run method for testing
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

    // 2. Prepare mock request and response
    const req = {
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

    // 3. Run the controller
    await handleVirtualTryOn(req, res);

    // Restore original prototype
    Replicate.prototype.run = originalRun;

    // 4. Asserts
    assert.equal(responseStatus, 200);
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.imageUrl, "https://example.com/mock-output-image.jpg");
    assert.match(responseJson.description, /GARMENT TYPE: dress/);
});

test('handleVirtualTryOn - validation failure (missing files)', async () => {
    const req = {
        files: {
            // Missing person file
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

    assert.equal(responseStatus, 400);
    assert.match(responseJson.error, /Missing required files/);
});
