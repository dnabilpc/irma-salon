// backend/src/controllers/tryonController.js
import Replicate from 'replicate';
import path from 'path';
import pool from '../services/db.js';
import { uploadToSupabaseStorage } from '../services/storageService.js';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
    useFileOutput: false
});

import { getUserVtoQuotaDetails } from './vtoController.js';

async function checkUserVtoQuota(userId) {
    if (!userId) return { can_use: false, error: 'User ID context is required.' };
    const quota = await getUserVtoQuotaDetails(userId);
    if (quota.error) return { can_use: false, error: quota.error };
    return { can_use: quota.can_use, remaining: quota.remaining, limit: quota.limit };
}

// ── Exact Original Prompts ──────────────────────────────────────────────────

const ANALYSIS_PROMPT = `
You are a fashion analyst for a virtual try-on system.
Analyze this garment image and describe it with extreme precision.

Provide the description in this exact structure:

GARMENT TYPE: [dress / top / kebaya / gamis / blouse / etc]
CATEGORY: [upper_body / lower_body / full_body / dress]

HAS HEADWEAR: [yes / no] (specify the type if yes, e.g. police hat, crown, veil, hijab, cap, tiara)
HAS TOP GARMENT: [yes / no] (specify the type if yes, e.g. shirt, jacket, blouse, kebaya, vest)
HAS BOTTOM GARMENT: [yes / no] (specify the type if yes, e.g. skirt, pants, trousers)
IS FULL BODY GARMENT: [yes / no] (yes if it is a single continuous outfit that covers from the shoulders/torso down to the legs/feet, like a dress, gamis, gown, or a complete jumpsuit/suit set)

COLOR: [primary color and any secondary colors or patterns]
PATTERN: [solid / floral / batik / geometric / embroidered / etc]
FABRIC: [silk / cotton / chiffon / lace / velvet / etc]
SILHOUETTE: [A-line / fitted / flowy / straight / etc]
NECKLINE: [V-neck / round / square / off-shoulder / halter / etc]
SLEEVES: [sleeveless / short / 3/4 / long / bell / puff / etc]
LENGTH: [crop / waist / hip / knee / midi / full-length / floor]
DETAILS: [lace trim / embroidery / buttons / belt / ruffle / beading / etc]
TEXTURE: [smooth / textured / shiny / matte / transparent / semi-transparent]
OVERALL STYLE: [casual / formal / traditional / bridal / evening / etc]
FIT TYPE: [oversized / relaxed / regular / slim / form-fitting / bodycon]
STRETCH: [non-stretch / low-stretch / medium-stretch / high-stretch]

Be extremely specific. This description will be used to drape the garment
realistically over a real human body with its own unique proportions.
`;

const CROP_ANALYSIS_PROMPT = `
Analyze this person image and describe ONLY the following with extreme precision:

1. SHOT TYPE: Define if it is a [full-body / half-body / upper-body / close-up] shot.
2. VISIBLE BODY PARTS: List every body part that is fully or partially visible.
3. CROPPED/HIDDEN BODY PARTS: List every body part that is NOT visible (cut off by frame, hidden behind clothing, or simply not in frame).
4. ARM TERMINATION: Describe exactly where each arm ends in the image. 
   Example: "Left arm ends at mid-forearm, no hand visible. Right arm ends at elbow, tucked behind body."
5. FRAME EDGES: Describe what gets cut off at each edge of the image frame.

Be brutally literal. Do not assume or infer what might be outside the frame. If the SHOT TYPE is half-body or upper-body, state clearly that legs, pants, and feet are out of frame and should NOT be generated.
`;

function buildTryonPrompt(bodyCropDescription, garmentDescription, isHalfBody = false) {
    const hasHeadwear = /hat|cap|crown|helmet|veil|turban|headwear|tiara|topi|peci|kopiah|jilbab|hijab|suntiang|mahkota|udeng/i.test(garmentDescription);
    return `
You are performing a photorealistic virtual clothing try-on task.

You are given TWO input images:
- IMAGE 1: The PERSON — full body photo, this is the absolute master reference.
- IMAGE 2: The GARMENT — flat product photo of the clothing item.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSON BODY MAP (pre-analyzed, treat as ground truth):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bodyCropDescription}

This body map is FINAL. You are forbidden from generating any body part
listed as hidden, cropped, or not visible above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT PRESERVATION RULES (IMAGE 1):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following must remain 100% identical to IMAGE 1:
- FACE: every feature, skin tone, expression, makeup, and facial structure
- HAIR: exact color, style, length, volume, and position ${hasHeadwear ? '(unless partially or fully covered/flattened by the headwear, hat, or head accessory from IMAGE 2)' : ''}
- BODY: exact proportions, build, bone structure, and all exposed skin — the
  person's body shape is FIXED and must never be altered to suit the garment
- POSE: exact stance, arm/leg/head position — do not alter any limb
- LIMBS & EXTREMITIES: the PERSON BODY MAP above defines exactly what is and
  isn't visible. Reproduce it with zero deviation. Any body part absent in
  IMAGE 1 must be absent in the output — covered by fabric, cut off by frame,
  or naturally hidden. NEVER generate hands, fingers, or feet that do not
  appear in IMAGE 1. If a sleeve ends mid-air because the hand is out of frame,
  the sleeve ends mid-air in the output too.
- BACKGROUND: every element behind the person, unchanged
- FRAMING: same camera angle, zoom level, and composition — do NOT zoom out
- LIGHTING ON PERSON: same light direction, highlights, and skin shadows

${hasHeadwear ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ HEADWEAR / HAT DETECTED (IMAGE 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The outfit in IMAGE 2 includes a headwear, hat, cap, crown, hijab, or head accessory.
- You are ALLOWED and INSTRUCTED to transfer this headwear/accessory from IMAGE 2 and place it realistically onto the person's head in the output.
- Fit the headwear to the person's head size, orientation, and angle.
- Ensure the person's facial features, identity, expression, and makeup from IMAGE 1 remain 100% identical, even as you add the headwear on top.
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE PRINCIPLE — BODY IS MASTER, GARMENT ADAPTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The person's body shape in IMAGE 1 is the ground truth.
The garment from IMAGE 2 must physically conform to this body — NOT the other
way around. Think of it as dressing a mannequin: the mannequin's shape never
changes; the fabric stretches, compresses, and drapes over it.

- If the person is wider than the flat garment appears → the fabric stretches
  and pulls at stress points (seams, chest, hips)
- If the person is slimmer → the fabric bunches, gathers, or hangs loosely
- If the garment is form-fitting → it must hug the person's exact curves,
  showing their real silhouette underneath, not a generic model silhouette
- The garment's flat product shape in IMAGE 2 is reference for color/pattern/
  design only — its 2D outline must be discarded and re-draped in 3D on the body

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLOTHING REPLACEMENT (IMAGE 2 → draped on IMAGE 1 body):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Erase the person's original clothing completely from the body region.
2. Re-drape the garment from IMAGE 2 over the person's real body shape.

Garment specification (from analysis):
${garmentDescription}

Garment application requirements:
- Reproduce EVERY design detail from IMAGE 2: color, pattern, embroidery,
  texture, trim — but mapped onto the person's 3D body geometry
- Fabric must physically interact with the body: stretch at wide points,
  compress at narrow points, sag where unsupported by the body
- Natural, body-driven wrinkles and tension lines — wrinkles radiate from
  points of contact (shoulders, bust, hips, elbows), not from the flat garment
- The person's body contours (waist curve, hip curve, chest volume) must be
  VISIBLE through the drape of the fabric — not hidden behind a flat silhouette
- Garment lighting matches the scene: same direction, intensity, and color temp
- Shadows are cast by the body's own volume pushing against the fabric
- Clean boundary at neckline, armholes, and hemline
- SLEEVE TERMINATION: sleeves end at the exact pixel point where the arm ends
  in IMAGE 1 per the PERSON BODY MAP. The sleeve opening hangs naturally at
  that termination point — do not extend it, do not fill it with a hand.
- Hemline length matches IMAGE 2 but falls naturally given the body's proportions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE PROHIBITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Do NOT generate hands if hands are not in IMAGE 1
✗ Do NOT generate fingers if fingers are not in IMAGE 1
✗ Do NOT zoom out or extend the canvas to show more body
✗ Do NOT use IMAGE 2's model body, pose, or limb positions as reference
✗ Do NOT complete body parts that are cropped by the frame

${isHalfBody ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL SHOT TYPE RESTRICTION: HALF-BODY / UPPER-BODY DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The person in IMAGE 1 is captured in a half-body or upper-body shot. The lower body (legs, feet, hips/pants area) is completely outside the frame.
- You are FORBIDDEN from generating pants, trousers, skirts, legs, or shoes.
- If the garment in IMAGE 2 is a full-body set (such as a suit jacket with pants, or a long dress), you MUST ONLY render the top portion (jacket, shirt, blouse) fitted to the visible body.
- Completely ignore/discard the lower portion (pants/skirt) of the garment.
- Truncate and crop the garment naturally at the bottom edge of the frame.
- Do NOT zoom out, do NOT extend the canvas, and do NOT draw any limbs or body parts that do not exist in IMAGE 1.
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Photorealistic: indistinguishable from a real fashion photograph
- Portrait orientation (3:4 ratio)
- Sharp focus throughout — face, garment details, and background all crisp
- No watermarks, text overlays, borders, or frames added
- OUTPUT FRAMING must be pixel-identical to IMAGE 1 — same crop, same zoom
- The result must look like the person physically put on this garment
`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts raw Replicate/AI API error messages into short, user-friendly messages.
 * Raw errors often contain JSON blobs, HTTP status codes, and technical details
 * that should never be shown directly to end users.
 */
function sanitizeReplicateError(rawError) {
    const msg = (rawError instanceof Error ? rawError.message : String(rawError)) || '';

    // 403 / Permission denied
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('Forbidden')) {
        return 'Layanan AI sedang mengalami gangguan akses. Silakan coba lagi nanti.';
    }
    // 429 / Rate limited / Throttled
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('throttle') || msg.includes('Too Many Requests')) {
        return 'Terlalu banyak permintaan ke layanan AI. Silakan tunggu beberapa menit.';
    }
    // E9243 / Director / Infrastructure error
    if (msg.includes('E9243') || msg.includes('Director:') || msg.includes('unexpected error handling prediction')) {
        return 'Layanan AI mengalami gangguan sementara. Permintaan akan dicoba ulang otomatis.';
    }
    // 500 / 502 / 503 / 504 / Server error
    if (msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('Bad Gateway') || msg.includes('Service Unavailable')) {
        return 'Server AI tidak tersedia saat ini. Silakan coba lagi nanti.';
    }
    if (msg.includes('500') || msg.includes('Internal Server Error')) {
        return 'Terjadi kesalahan pada server AI. Silakan coba lagi.';
    }
    // Timeout
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
        return 'Permintaan ke layanan AI habis waktu. Silakan coba lagi.';
    }
    // NSFW / Content policy
    if (msg.includes('NSFW') || msg.includes('nsfw') || msg.includes('content policy') || msg.includes('safety')) {
        return 'Gambar tidak dapat diproses karena melanggar kebijakan konten.';
    }
    // Network error
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('network')) {
        return 'Gagal terhubung ke layanan AI. Periksa koneksi server.';
    }
    // Prediction failed (generic)
    if (msg.includes('Prediction failed')) {
        return 'Proses Virtual Try-On gagal. Silakan coba lagi dengan foto yang berbeda.';
    }
    // Fallback: trim to max 120 chars, strip JSON/newlines
    const cleaned = msg.replace(/\{[\s\S]*?\}/g, '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : (cleaned || 'Terjadi kesalahan tidak diketahui.');
}

async function runReplicateWithRetry(model, options, maxRetries = 5) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await replicate.run(model, options);
        } catch (err) {
            attempts++;

            const errMessage = err.message || '';
            const errStatus = err.status || (err.response && err.response.status);

            // 429 — Rate limited by Replicate
            const isThrottled = errStatus === 429 ||
                                errMessage.includes('429');

            // Transient Replicate infrastructure errors (E9243, E-series director errors, 5xx)
            const isTransient = isThrottled ||
                                errMessage.includes('E9243') ||
                                errMessage.includes('unexpected error handling prediction') ||
                                errMessage.includes('Director:') ||
                                errStatus === 500 ||
                                errStatus === 502 ||
                                errStatus === 503 ||
                                errStatus === 504;

            if (isTransient && attempts < maxRetries) {
                let retryAfterSec = isThrottled ? 5 : 10; // infrastructure errors wait a bit longer

                // Try to extract retry_after from response headers or body
                if (err.headers && typeof err.headers.get === 'function' && err.headers.get('retry-after')) {
                    const parsed = parseInt(err.headers.get('retry-after'), 10);
                    if (!isNaN(parsed)) retryAfterSec = parsed;
                } else if (err.headers && err.headers['retry-after']) {
                    const parsed = parseInt(err.headers['retry-after'], 10);
                    if (!isNaN(parsed)) retryAfterSec = parsed;
                }

                // Parse JSON from error message if available
                if (errMessage) {
                    try {
                        const jsonStart = errMessage.indexOf('{');
                        if (jsonStart !== -1) {
                            const jsonStr = errMessage.substring(jsonStart);
                            const parsedErr = JSON.parse(jsonStr);
                            if (parsedErr.retry_after) {
                                retryAfterSec = parseFloat(parsedErr.retry_after);
                            }
                        }
                    } catch (e) {
                        // ignore JSON parse error
                    }
                }

                const backoffMs = (retryAfterSec * 1000) * Math.pow(1.5, attempts - 1) + Math.random() * 1000;
                const reason = isThrottled ? 'Rate limited (429)' : `Infrastructure error (${errMessage.slice(0, 60)})`;
                console.warn(`[Replicate API] ${reason} on model ${model}. Retrying in ${Math.round(backoffMs)}ms... (Attempt ${attempts}/${maxRetries})`);
                await delay(backoffMs);
            } else {
                throw err;
            }
        }
    }
}

function bufferToDataUri(fileBuffer, originalName) {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    const mimeTypes = { 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp' };
    const mime = mimeTypes[ext] || 'image/jpeg';
    return `data:${mime};base64,${fileBuffer.toString('base64')}`;
}

// ── Controller Logic ────────────────────────────────────────────────────────

export const handleVirtualTryOn = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Hubungkan user session Anda.' });
        }

        const clothesUrlParam = req.body?.clothesUrl;

        // 2. Check files (done early so we can detect bad requests before quota)
        if (!req.files || !req.files['person'] || (!req.files['clothes'] && !clothesUrlParam)) {
            return res.status(400).json({ error: 'Missing required inputs: person selfie and either clothes file or clothesUrl' });
        }

        const personFile = req.files['person'][0];
        const clothesFile = req.files['clothes'] ? req.files['clothes'][0] : null;
        const outfitName = req.body?.outfitName || 'Katalog Baju';

        // Mock mode bypass — must run BEFORE quota check.
        // Mock requests don't consume Replicate credits and don't increment vto_usage,
        // so quota checking would incorrectly block load-test traffic.
        if ((req.headers && req.headers['x-mock-request'] === 'true') || process.env.MOCK_TRYON === 'true') {
            const insertMockRes = await pool.query(`
                INSERT INTO vto_tasks (user_id, person_image_url, clothes_image_url, status, result_image_url, garment_description, outfit_name)
                VALUES ($1, $2, $3, 'completed', 'https://example.com/mock-output-image.jpg', 'MOCK: GARMENT TYPE: dress\nCOLOR: red\nDETAILS: lace trim', $4)
                RETURNING id
            `, [userId, 'https://example.com/mock-person.jpg', clothesUrlParam || 'https://example.com/mock-clothes.jpg', outfitName]);

            return res.status(202).json({
                success: true,
                taskId: insertMockRes.rows[0].id
            });
        }

        // 1. Check VTO quota for real requests (not applicable to mock/load-test)
        const quota = await checkUserVtoQuota(userId);
        if (!quota.can_use) {
            return res.status(429).json({ error: 'Kuota Virtual Try-On Anda telah habis.' });
        }

        console.log(`[VTO Queue] Creating task for user ${userId}: Person (${personFile.originalname}), Clothes (${clothesFile ? clothesFile.originalname : 'Using Catalog Link'}), Outfit (${outfitName})`);

        // Convert person buffer to Base64 and upload to Supabase Storage
        const personBase64 = bufferToDataUri(personFile.buffer, personFile.originalname);
        const personUrl = await uploadToSupabaseStorage(personBase64, 'vto', `person-${userId}`);
        
        if (!personUrl) {
            return res.status(500).json({ error: 'Gagal mengunggah foto selfie ke database storage.' });
        }

        let clothesUrl = clothesUrlParam;
        if (!clothesUrl && clothesFile) {
            // Convert clothes buffer to Base64 and upload to Supabase Storage
            const clothesBase64 = bufferToDataUri(clothesFile.buffer, clothesFile.originalname);
            clothesUrl = await uploadToSupabaseStorage(clothesBase64, 'vto', `clothes-${userId}`);

            if (!clothesUrl) {
                return res.status(500).json({ error: 'Gagal mengunggah foto baju ke database storage.' });
            }
        }

        if (!clothesUrl) {
            return res.status(400).json({ error: 'Gagal menentukan gambar baju yang ingin dicoba.' });
        }

        // 3. Create 'pending' task in database
        const insertRes = await pool.query(`
            INSERT INTO vto_tasks (user_id, person_image_url, clothes_image_url, status, outfit_name)
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING id
        `, [userId, personUrl, clothesUrl, outfitName]);

        const taskId = insertRes.rows[0].id;
        console.log(`[VTO Queue] Task ID #${taskId} queued successfully.`);

        return res.status(202).json({
            success: true,
            taskId
        });

    } catch (error) {
        console.error('Error in virtual try-on controller handleVirtualTryOn:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const getVtoTaskStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Hubungkan user session Anda.' });
        }

        const taskResult = await pool.query(`
            SELECT id, user_id, status, result_image_url, garment_description, error_message 
            FROM vto_tasks 
            WHERE id = $1
        `, [id]);

        if (!taskResult.rows.length) {
            return res.status(404).json({ error: 'Task tidak ditemukan.' });
        }

        const task = taskResult.rows[0];

        // Access control: only task owner or admin can read it
        if (task.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses ke data task ini.' });
        }

        return res.json({
            success: true,
            task: {
                id: task.id,
                status: task.status,
                imageUrl: task.result_image_url,
                description: task.garment_description,
                error: task.error_message
            }
        });
    } catch (error) {
        console.error('[getVtoTaskStatus] Error:', error);
        return res.status(500).json({ error: 'Gagal memuat status task VTO.' });
    }
};

let isWorkerBusy = false;

export async function processNextVtoTask() {
    if (isWorkerBusy) {
        return; // Only process one task at a time
    }

    let task = null;
    let client;
    try {
        client = await pool.connect();
    } catch (connErr) {
        console.warn('[VTO Worker] Database connection timeout/failure: %s', connErr.message);
        return;
    }

    try {
        await client.query('BEGIN');
        
        // Find next pending task
        const selectRes = await client.query(`
            SELECT id, user_id, person_image_url, clothes_image_url 
            FROM vto_tasks 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 1 
            FOR UPDATE SKIP LOCKED
        `);
        
        if (selectRes.rows.length > 0) {
            task = selectRes.rows[0];
            
            // Update task status to processing immediately within transaction
            await client.query(`
                UPDATE vto_tasks 
                SET status = 'processing', updated_at = NOW() 
                WHERE id = $1
            `, [task.id]);
        }
        
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[VTO Worker] Transaction error:', err.message);
    } finally {
        client.release(); // Release DB connection immediately so other requests can use it
    }

    if (!task) {
        return; // No pending tasks
    }

    isWorkerBusy = true;
    console.log(`[VTO Worker] Processing task ID #${task.id} for user ${task.user_id}...`);
    
    // Perform the VTO processing outside of DB connection
    try {
        // Step 1: Analyze clothes
        console.log(`[VTO Worker - Task #${task.id}] Step 1: Analisis baju...`);
        const analysis = await runReplicateWithRetry("google/gemini-2.5-flash", {
            input: { prompt: ANALYSIS_PROMPT, images: [task.clothes_image_url] }
        });
        const garmentDescription = Array.isArray(analysis) ? analysis.join("") : analysis;

        // Step 2: Analyze person body map
        console.log(`[VTO Worker - Task #${task.id}] Step 2: Analyzing person crop map...`);
        const cropAnalysis = await runReplicateWithRetry("google/gemini-2.5-flash", {
            input: { prompt: CROP_ANALYSIS_PROMPT, images: [task.person_image_url] }
        });
        const bodyCropDescription = Array.isArray(cropAnalysis) ? cropAnalysis.join("") : cropAnalysis;

        const isHalfBody = bodyCropDescription.toLowerCase().includes("half-body") || 
                           bodyCropDescription.toLowerCase().includes("upper-body") || 
                           bodyCropDescription.toLowerCase().includes("legs are not visible") || 
                           bodyCropDescription.toLowerCase().includes("feet are not visible") || 
                           bodyCropDescription.toLowerCase().includes("legs: out of frame") || 
                           bodyCropDescription.toLowerCase().includes("feet: out of frame") || 
                           bodyCropDescription.toLowerCase().includes("legs and feet are out of frame");

        // Step 3: Generate try-on using fixed model selection (gpt-image-2)
        const tryonPrompt = buildTryonPrompt(bodyCropDescription, garmentDescription, isHalfBody);
        const modelName = "openai/gpt-image-2";
        const inputPayload = {
            prompt: tryonPrompt,
            input_images: [task.person_image_url, task.clothes_image_url],
            aspect_ratio: "2:3",
            quality: "low",
            output_format: "jpeg"
        };

        console.log(`[VTO Worker - Task #${task.id}] Step 3: Generating VTO image with model ${modelName}...`);
        const output = await runReplicateWithRetry(modelName, { input: inputPayload });
        const finalImageUrl = Array.isArray(output) ? output[0] : output;

        // Download output image and upload to Supabase Storage for permanent hosting
        let supabaseOutputUrl = finalImageUrl;
        try {
            console.log(`[VTO Worker - Task #${task.id}] Downloading VTO output from Replicate...`);
            const imageRes = await fetch(finalImageUrl);
            if (!imageRes.ok) {
                throw new Error(`Failed to download output image: ${imageRes.statusText}`);
            }
            const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
            const contentType = imageRes.headers.get("content-type") || "image/jpeg";
            const resultBase64 = `data:${contentType};base64,${imageBuffer.toString('base64')}`;

            console.log(`[VTO Worker - Task #${task.id}] Uploading VTO output to Supabase Storage...`);
            const uploadedUrl = await uploadToSupabaseStorage(resultBase64, 'vto', `output-${task.user_id}`);
            if (uploadedUrl) {
                supabaseOutputUrl = uploadedUrl;
            } else {
                console.warn(`[VTO Worker - Task #${task.id}] Supabase upload returned null. Falling back to Replicate URL.`);
            }
        } catch (uploadErr) {
            console.error(`[VTO Worker - Task #${task.id}] Failed to save output to Supabase:`, uploadErr);
        }
        
        // Mark task as completed
        await pool.query(`
            UPDATE vto_tasks 
            SET status = 'completed', 
                result_image_url = $1, 
                garment_description = $2, 
                updated_at = NOW() 
            WHERE id = $3
        `, [supabaseOutputUrl, garmentDescription, task.id]);

        // Increment VTO usage for user on successful VTO complete
        await pool.query(`
            UPDATE "user" SET vto_usage = COALESCE(vto_usage, 0) + 1 WHERE id = $1
        `, [task.user_id]);
        
        console.log(`[VTO Worker] Task ID #${task.id} completed successfully!`);
        
    } catch (taskErr) {
        const errMsg = taskErr.message || 'Unknown error';
        // Sanitize for DB/user display; keep raw for server logs
        const userErrMsg = sanitizeReplicateError(taskErr);
        console.error(`[VTO Worker] Error processing task ID #${task.id}:`, errMsg);

        // Determine if this is a transient infrastructure error that should be retried
        const isTransient =
            errMsg.includes('E9243') ||
            errMsg.includes('unexpected error handling prediction') ||
            errMsg.includes('Director:') ||
            errMsg.includes('502') ||
            errMsg.includes('503') ||
            errMsg.includes('504');

        if (isTransient) {
            // Fetch current attempt count
            const attemptRes = await pool.query(
                `SELECT attempt_count FROM vto_tasks WHERE id = $1`, [task.id]
            );
            const currentAttempts = attemptRes.rows[0]?.attempt_count ?? 0;
            const MAX_TASK_ATTEMPTS = 3;

            if (currentAttempts < MAX_TASK_ATTEMPTS) {
                // Requeue: reset to 'pending' so the worker picks it up again
                await pool.query(`
                    UPDATE vto_tasks 
                    SET status = 'pending',
                        attempt_count = attempt_count + 1,
                        error_message = $1,
                        updated_at = NOW() 
                    WHERE id = $2
                `, [userErrMsg, task.id]);
                console.warn(`[VTO Worker] Task #${task.id} requeued (attempt ${currentAttempts + 1}/${MAX_TASK_ATTEMPTS}) due to transient error: ${errMsg.slice(0, 80)}`);
            } else {
                // Max retries exhausted — permanently fail
                await pool.query(`
                    UPDATE vto_tasks 
                    SET status = 'failed', 
                        error_message = $1, 
                        updated_at = NOW() 
                    WHERE id = $2
                `, [`Gagal setelah ${MAX_TASK_ATTEMPTS} percobaan: ${userErrMsg}`, task.id]);
                console.error(`[VTO Worker] Task #${task.id} permanently failed after ${MAX_TASK_ATTEMPTS} attempts.`);
            }
        } else {
            // Permanent failure (invalid input, auth error, etc.)
            await pool.query(`
                UPDATE vto_tasks 
                SET status = 'failed', 
                    error_message = $1, 
                    updated_at = NOW() 
                WHERE id = $2
            `, [userErrMsg, task.id]);
        }
    } finally {
        isWorkerBusy = false;
    }
}

export async function startVtoWorker() {
    console.log('[VTO Worker] Starting background queue worker...');
    
    // Reset any stuck 'processing' tasks back to 'pending' on startup
    try {
        const resetRes = await pool.query(`
            UPDATE vto_tasks 
            SET status = 'pending', updated_at = NOW() 
            WHERE status = 'processing'
        `);
        if (resetRes.rowCount > 0) {
            console.log(`[VTO Worker] Reset ${resetRes.rowCount} stuck 'processing' tasks back to 'pending'.`);
        }
    } catch (err) {
        console.error('[VTO Worker] Failed to reset stuck tasks:', err.message);
    }

    setInterval(async () => {
        try {
            await processNextVtoTask();
        } catch (err) {
            console.error('[VTO Worker] Error in worker tick:', err);
        }
    }, 10000); // Check every 10 seconds
}

export async function getUserVtoTasks(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Hubungkan user session Anda.' });
        }
        
        const result = await pool.query(
            `SELECT id, status, person_image_url, clothes_image_url, result_image_url, outfit_name, error_message, created_at
             FROM vto_tasks
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[getUserVtoTasks] Error:', err);
        res.status(500).json({ error: 'Gagal memuat riwayat Virtual Try-On.' });
    }
}

export async function getUnnotifiedVtoTasks(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.json([]); // return empty if not logged in
        }
        
        const result = await pool.query(
            `SELECT id, status, outfit_name, result_image_url, error_message
             FROM vto_tasks
             WHERE user_id = $1 AND user_notified = FALSE AND status IN ('completed', 'failed')`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[getUnnotifiedVtoTasks] Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function markVtoTaskAsRead(req, res) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Hubungkan user session Anda.' });
        }
        
        await pool.query(
            `UPDATE vto_tasks 
             SET user_notified = TRUE, updated_at = NOW() 
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[markVtoTaskAsRead] Error:', err);
        res.status(500).json({ error: 'Gagal menandai notifikasi.' });
    }
}