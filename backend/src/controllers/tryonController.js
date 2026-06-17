// backend/src/controllers/tryonController.js
import Replicate from 'replicate';
import path from 'path';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
    useFileOutput: false
});

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
        // Safe mock mode bypass to prevent Replicate credit drain during performance testing
        if ((req.headers && req.headers['x-mock-request'] === 'true') || process.env.MOCK_TRYON === 'true') {
            return res.status(200).json({
                success: true,
                imageUrl: "https://example.com/mock-output-image.jpg",
                description: "MOCK: GARMENT TYPE: dress\nCOLOR: red\nDETAILS: lace trim"
            });
        }

        if (!req.files || !req.files['person'] || !req.files['clothes']) {
            return res.status(400).json({ error: 'Missing required files: person and clothes' });
        }


        const personFile = req.files['person'][0];
        const clothesFile = req.files['clothes'][0];

        console.log(`Processing try-on: Person (${personFile.originalname}), Clothes (${clothesFile.originalname})`);

        const personUri = bufferToDataUri(personFile.buffer, personFile.originalname);
        const clothesUri = bufferToDataUri(clothesFile.buffer, clothesFile.originalname);

        // ── Step 1: Analyze clothes ───────────────────────────────────────
        console.log("Step 1: Analisis baju dengan Gemini 2.5 Flash...");
        const analysis = await runReplicateWithRetry("google/gemini-2.5-flash", {
            input: { prompt: ANALYSIS_PROMPT, images: [clothesUri] }
        });
        const garmentDescription = Array.isArray(analysis) ? analysis.join("") : analysis;

        await delay(5000); // 5-second delay to respect rate limits like the original script

        // ── Step 2: Analyze person body map ───────────────────────────────
        console.log("\nStep 2: Analyzing person crop map...");
        const cropAnalysis = await runReplicateWithRetry("google/gemini-2.5-flash", {
            input: { prompt: CROP_ANALYSIS_PROMPT, images: [personUri] }
        });
        const bodyCropDescription = Array.isArray(cropAnalysis) ? cropAnalysis.join("") : cropAnalysis;

        // Detect if half-body/upper-body
        const isHalfBody = bodyCropDescription.toLowerCase().includes("half-body") || 
                           bodyCropDescription.toLowerCase().includes("upper-body") || 
                           bodyCropDescription.toLowerCase().includes("legs are not visible") || 
                           bodyCropDescription.toLowerCase().includes("feet are not visible") || 
                           bodyCropDescription.toLowerCase().includes("legs: out of frame") || 
                           bodyCropDescription.toLowerCase().includes("feet: out of frame") || 
                           bodyCropDescription.toLowerCase().includes("legs and feet are out of frame");

        console.log(`[Try-On Controller] Detected Half-Body: ${isHalfBody}`);

        await delay(3000); // 3-second delay 

        // ── Step 3: Generate Virtual Try-On Prompt & Execution ─────────────
        const tryonPrompt = buildTryonPrompt(bodyCropDescription, garmentDescription, isHalfBody);

        const modelName = "openai/gpt-image-2";
        const inputPayload = {
            prompt: tryonPrompt,
            input_images: [personUri, clothesUri],
            aspect_ratio: "2:3", // 3:4 is not supported, using closest portrait ratio 2:3
            quality: "low",
            output_format: "jpeg" // "jpg" is not in schema enum, using "jpeg"
        };

        console.log(`\nStep 3: Generating try-on dengan model ${modelName}...`);
        const output = await runReplicateWithRetry(modelName, { input: inputPayload });

        const finalImageUrl = Array.isArray(output) ? output[0] : output;
        console.log(`\nURL hasil: ${finalImageUrl}`);

        return res.status(200).json({
            success: true,
            imageUrl: finalImageUrl,
            description: garmentDescription
        });

    } catch (error) {
        console.error('Error in virtual try-on controller:', error);
        return res.status(500).json({ error: error.message });
    }
};