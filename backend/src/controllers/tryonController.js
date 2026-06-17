// backend/src/controllers/tryonController.js
import Replicate from 'replicate';
import path from 'path';
import pool from '../services/db.js';
import { uploadToSupabaseStorage } from '../services/storageService.js';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
    useFileOutput: false
});

async function checkUserVtoQuota(userId) {
    if (!userId) return { can_use: false, error: 'User ID context is required.' };

    const settingsResult = await pool.query(
        `SELECT key, value FROM settings WHERE key IN ('vto_limit_default', 'vto_reset_interval_days')`
    );
    const settingsMap = {};
    for (const row of settingsResult.rows) {
        settingsMap[row.key] = row.value;
    }

    const limit = parseInt(settingsMap["vto_limit_default"] ?? "5", 10);
    const intervalDays = parseInt(settingsMap["vto_reset_interval_days"] ?? "14", 10);

    const userResult = await pool.query(
        `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
        [userId]
    );

    if (!userResult.rows.length) {
        return { can_use: false, error: 'User not found in database.' };
    }

    let { vto_usage, vto_reset_at } = userResult.rows[0];
    
    if (!vto_reset_at) {
        await pool.query(
            `UPDATE "user" SET vto_reset_at = NOW() WHERE id = $1`,
            [userId]
        );
        vto_reset_at = new Date();
    }

    const resetAt = new Date(vto_reset_at);
    const now = new Date();
    const diffDays = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays >= intervalDays) {
        await pool.query(
            `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
            [userId]
        );
        vto_usage = 0;
    }

    const usage = vto_usage ?? 0;
    const remaining = Math.max(0, limit - usage);
    return { can_use: remaining > 0, remaining };
}

// ── Exact Original Prompts ──────────────────────────────────────────────────

const ANALYSIS_PROMPT = `
You are a fashion analyst for a virtual try-on system.
Analyze this garment image and describe it with extreme precision.

Provide the description in this exact structure:

GARMENT TYPE: [dress / top / kebaya / gamis / blouse / etc]
CATEGORY: [upper_body / lower_body / full_body / dress]
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
- HAIR: exact color, style, length, volume, and position
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

async function runReplicateWithRetry(model, options, maxRetries = 5) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await replicate.run(model, options);
        } catch (err) {
            attempts++;
            const isThrottled = err.status === 429 || 
                                (err.message && err.message.includes("429")) || 
                                (err.response && err.response.status === 429);
            
            if (isThrottled && attempts < maxRetries) {
                let retryAfterSec = 5; // default fallback to 5 seconds
                
                // Try to extract retry_after from response headers or body
                if (err.headers && typeof err.headers.get === 'function' && err.headers.get('retry-after')) {
                    const parsed = parseInt(err.headers.get('retry-after'), 10);
                    if (!isNaN(parsed)) retryAfterSec = parsed;
                } else if (err.headers && err.headers['retry-after']) {
                    const parsed = parseInt(err.headers['retry-after'], 10);
                    if (!isNaN(parsed)) retryAfterSec = parsed;
                }
                
                // Parse JSON from error message if available
                if (err.message) {
                    try {
                        const jsonStart = err.message.indexOf('{');
                        if (jsonStart !== -1) {
                            const jsonStr = err.message.substring(jsonStart);
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
                console.warn(`[Replicate API] Rate limited (429) on model ${model}. Retrying in ${Math.round(backoffMs)}ms... (Attempt ${attempts}/${maxRetries})`);
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

        // 1. Check VTO quota
        const quota = await checkUserVtoQuota(userId);
        if (!quota.can_use) {
            return res.status(429).json({ error: 'Kuota Virtual Try-On Anda telah habis.' });
        }

        // 2. Check files
        if (!req.files || !req.files['person'] || !req.files['clothes']) {
            return res.status(400).json({ error: 'Missing required files: person and clothes' });
        }

        const personFile = req.files['person'][0];
        const clothesFile = req.files['clothes'][0];

        // Safe mock mode bypass to prevent Replicate credit drain during performance testing
        if ((req.headers && req.headers['x-mock-request'] === 'true') || process.env.MOCK_TRYON === 'true') {
            const insertMockRes = await pool.query(`
                INSERT INTO vto_tasks (user_id, person_image_url, clothes_image_url, status, result_image_url, garment_description)
                VALUES ($1, $2, $3, 'completed', 'https://example.com/mock-output-image.jpg', 'MOCK: GARMENT TYPE: dress\nCOLOR: red\nDETAILS: lace trim')
                RETURNING id
            `, [userId, 'https://example.com/mock-person.jpg', 'https://example.com/mock-clothes.jpg']);
            
            // Increment VTO usage directly in mock mode
            await pool.query(`
                UPDATE "user" SET vto_usage = COALESCE(vto_usage, 0) + 1 WHERE id = $1
            `, [userId]);

            return res.status(202).json({
                success: true,
                taskId: insertMockRes.rows[0].id
            });
        }

        console.log(`[VTO Queue] Creating task for user ${userId}: Person (${personFile.originalname}), Clothes (${clothesFile.originalname})`);

        // Convert person buffer to Base64 and upload to Supabase Storage
        const personBase64 = bufferToDataUri(personFile.buffer, personFile.originalname);
        const personUrl = await uploadToSupabaseStorage(personBase64, 'vto', `person-${userId}`);
        
        if (!personUrl) {
            return res.status(500).json({ error: 'Gagal mengunggah foto selfie ke database storage.' });
        }

        // Convert clothes buffer to Base64 and upload to Supabase Storage
        const clothesBase64 = bufferToDataUri(clothesFile.buffer, clothesFile.originalname);
        const clothesUrl = await uploadToSupabaseStorage(clothesBase64, 'vto', `clothes-${userId}`);

        if (!clothesUrl) {
            return res.status(500).json({ error: 'Gagal mengunggah foto baju ke database storage.' });
        }

        // 3. Create 'pending' task in database
        const insertRes = await pool.query(`
            INSERT INTO vto_tasks (user_id, person_image_url, clothes_image_url, status)
            VALUES ($1, $2, $3, 'pending')
            RETURNING id
        `, [userId, personUrl, clothesUrl]);

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

export async function processNextVtoTask() {
    const client = await pool.connect();
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
        
        if (selectRes.rows.length === 0) {
            await client.query('COMMIT');
            return; // No pending tasks
        }
        
        const task = selectRes.rows[0];
        
        // Update task status to processing
        await client.query(`
            UPDATE vto_tasks 
            SET status = 'processing', updated_at = NOW() 
            WHERE id = $1
        `, [task.id]);
        
        await client.query('COMMIT');
        
        console.log(`[VTO Worker] Processing task ID #${task.id} for user ${task.user_id}...`);
        
        // Perform the VTO processing
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

            // Step 3: Generate try-on
            const tryonPrompt = buildTryonPrompt(bodyCropDescription, garmentDescription, isHalfBody);
            const modelName = "openai/gpt-image-2";
            const inputPayload = {
                prompt: tryonPrompt,
                input_images: [task.person_image_url, task.clothes_image_url],
                aspect_ratio: "2:3",
                quality: "low",
                output_format: "jpeg"
            };

            console.log(`[VTO Worker - Task #${task.id}] Step 3: Generating VTO image...`);
            const output = await runReplicateWithRetry(modelName, { input: inputPayload });
            const finalImageUrl = Array.isArray(output) ? output[0] : output;
            
            // Mark task as completed
            await pool.query(`
                UPDATE vto_tasks 
                SET status = 'completed', 
                    result_image_url = $1, 
                    garment_description = $2, 
                    updated_at = NOW() 
                WHERE id = $3
            `, [finalImageUrl, garmentDescription, task.id]);

            // Increment VTO usage for user on successful VTO complete
            await pool.query(`
                UPDATE "user" SET vto_usage = COALESCE(vto_usage, 0) + 1 WHERE id = $1
            `, [task.user_id]);
            
            console.log(`[VTO Worker] Task ID #${task.id} completed successfully!`);
            
        } catch (taskErr) {
            console.error(`[VTO Worker] Error processing task ID #${task.id}:`, taskErr.message);
            // Mark task as failed
            await pool.query(`
                UPDATE vto_tasks 
                SET status = 'failed', 
                    error_message = $1, 
                    updated_at = NOW() 
                WHERE id = $2
            `, [taskErr.message, task.id]);
        }
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[VTO Worker] Transaction error:', err.message);
    } finally {
        client.release();
    }
}

export function startVtoWorker() {
    console.log('[VTO Worker] Starting background queue worker...');
    setInterval(async () => {
        try {
            await processNextVtoTask();
        } catch (err) {
            console.error('[VTO Worker] Error in worker tick:', err);
        }
    }, 10000); // Check every 10 seconds
}