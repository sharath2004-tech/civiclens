/**
 * Direct Frontend Cloudinary Upload Helper (Optional Unsigned Upload)
 * If VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET are configured in .env,
 * uploads directly to Cloudinary; otherwise the backend API handles the upload via Multer -> Cloudinary.
 */

export function isFrontendCloudinaryConfigured() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  // 'civiclens' preset is configured as signed on Cloudinary, so frontend unsigned upload must be disabled
  // and handled by the backend which signs the upload securely or stores as Mongo Data URI.
  if (uploadPreset === 'civiclens') return false;
  return Boolean(cloudName && uploadPreset);
}

export async function uploadDirectToCloudinary(file, onProgress) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER?.trim() || 'civiclens/complaints';

  if (!cloudName || !uploadPreset) {
    throw new Error('Frontend Cloudinary credentials not configured');
  }

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({
            url: data.secure_url,
            mediaType: resourceType,
            publicId: data.public_id,
            storage: 'cloudinary',
          });
        } else {
          reject(new Error(data.error?.message || 'Cloudinary upload failed'));
        }
      } catch {
        reject(new Error('Failed to parse Cloudinary response'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(formData);
  });
}
