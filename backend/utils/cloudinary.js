const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Checks whether Cloudinary credentials are configured in environment variables.
 * Supports either Signed Uploads (CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET)
 * or Unsigned Uploads (CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET).
 */
function isCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  return Boolean(cloudName && ((apiKey && apiSecret) || uploadPreset));
}

/**
 * Determines if a multer file object is a video or image.
 */
function getMediaType(file) {
  if (file.mimetype && file.mimetype.startsWith('video/')) {
    return 'video';
  }
  const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
  if (/^\.(mp4|webm|mov|avi|mkv|ogg|m4v)$/.test(ext)) {
    return 'video';
  }
  return 'image';
}

async function trySignedUpload({ endpoint, blob, filename, folder, apiKey, apiSecret }) {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const paramsToSign = {
    ...(folder ? { folder } : {}),
    timestamp
  };

  const sortedParamString = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParamString + apiSecret)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', blob, filename);
  if (folder) formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Signed upload failed (${response.status})`);
  }
  return result;
}

async function tryUnsignedUpload({ endpoint, blob, filename, folder, uploadPreset }) {
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);
  if (folder) formData.append('folder', folder);

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Unsigned upload failed (${response.status})`);
  }
  return result;
}

/**
 * Uploads a local file (from Multer) to Cloudinary (image or video).
 * Tries Signed Upload (if API key & secret are valid/distinct), then Unsigned Upload (if preset is set),
 * and gracefully falls back to local `/uploads/<filename>` if Cloudinary rejects credentials so complaint creation never fails.
 */
async function uploadFileToCloudinary(file, folder = process.env.CLOUDINARY_FOLDER || 'civiclens') {
  const mediaType = getMediaType(file);
  const localFallback = {
    url: `/uploads/${file.filename}`,
    mediaType,
    publicId: null,
    storage: 'local'
  };

  if (!isCloudinaryConfigured()) {
    return localFallback;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${mediaType}/upload`;

  try {
    const fileBuffer = await fs.promises.readFile(file.path);
    const blob = new Blob([fileBuffer], {
      type: file.mimetype || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
    });
    const filename = file.originalname || file.filename;

    let result = null;
    let lastError = null;

    // 1. Try Signed Upload if API Key & Secret are provided (and Secret isn't accidentally identical to the numeric API Key)
    if (apiKey && apiSecret && apiKey !== apiSecret) {
      try {
        result = await trySignedUpload({ endpoint, blob, filename, folder, apiKey, apiSecret });
      } catch (err) {
        lastError = err;
        console.warn('⚠️ Cloudinary signed upload failed:', err.message);
      }
    } else if (apiKey && apiSecret && apiKey === apiSecret) {
      console.warn('⚠️ CLOUDINARY_API_SECRET in .env is identical to CLOUDINARY_API_KEY. Please copy your alphanumeric API Secret from Cloudinary Dashboard.');
    }

    // 2. Try Unsigned Upload if signed upload wasn't used or failed, and an upload preset is configured
    if (!result && uploadPreset) {
      try {
        result = await tryUnsignedUpload({ endpoint, blob, filename, folder, uploadPreset });
      } catch (err) {
        lastError = err;
        console.warn('⚠️ Cloudinary unsigned upload failed:', err.message);
      }
    }

    // 3. If apiKey === apiSecret and no preset succeeded, still attempt signed in case user wants to see error in logs
    if (!result && apiKey && apiSecret && apiKey === apiSecret && !uploadPreset) {
      try {
        result = await trySignedUpload({ endpoint, blob, filename, folder, apiKey, apiSecret });
      } catch (err) {
        lastError = err;
      }
    }

    if (result && result.secure_url) {
      // Remove temporary local file after successful Cloudinary upload
      fs.promises.unlink(file.path).catch(() => {});
      console.log(`✅ Uploaded ${mediaType} to Cloudinary: ${result.secure_url}`);
      return {
        url: result.secure_url,
        mediaType,
        publicId: result.public_id,
        storage: 'cloudinary'
      };
    }

    // Permanent MongoDB Data URI fallback (works 100% on Mobile, Vercel & Render ephemeral disk!)
    if (fileBuffer && fileBuffer.length <= 6 * 1024 * 1024) {
      const mime = file.mimetype || (mediaType === 'video' ? 'video/webm' : 'image/jpeg');
      const dataUri = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      return {
        url: dataUri,
        mediaType,
        publicId: null,
        storage: 'mongodb-inline'
      };
    }

    if (lastError) {
      console.warn(`⚠️ Falling back to local file storage (${localFallback.url}) because Cloudinary returned: ${lastError.message}`);
    }
    return localFallback;
  } catch (err) {
    console.warn(`⚠️ Error during Cloudinary upload, using local fallback: ${err.message}`);
    return localFallback;
  }
}

module.exports = {
  isCloudinaryConfigured,
  getMediaType,
  uploadFileToCloudinary
};
