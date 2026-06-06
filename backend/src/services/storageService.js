// backend/src/services/storageService.js

/**
 * Uploads a base64 image string to Supabase Storage inside a specific virtual folder.
 * @param {string} base64Str - Data URL string (e.g. data:image/png;base64,...)
 * @param {string} folder - Virtual folder name (e.g. 'profiles', 'outfits', 'vto', 'services')
 * @param {string} filenamePrefix - Prefix for the generated file name
 * @returns {Promise<string|null>} Public URL of the uploaded image, or null if failed
 */
export async function uploadToSupabaseStorage(base64Str, folder, filenamePrefix) {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
        return null;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const bucketName = encodeURIComponent(process.env.SUPABASE_BUCKET || 'irma-salon');

    if (!supabaseUrl || !supabaseKey) {
        console.error('[Supabase Storage] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
        return null;
    }

    try {
        const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format.');
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        let ext = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';

        const fileName = `${folder}/${filenamePrefix}-${Date.now()}.${ext}`;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': contentType,
                'x-upsert': 'true'
            },
            body: buffer
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase upload failed: ${response.statusText} (${errText})`);
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
        console.log(`[Supabase Storage] Successfully uploaded image to folder "${folder}". URL: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error('[Supabase Storage] Upload error:', error);
        return null;
    }
}
