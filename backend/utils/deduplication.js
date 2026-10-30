const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let lastSyncTimestamp = 0;

function convertLocalUploadToDataUri(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('https://res.cloudinary.com/')) {
    return rawUrl;
  }
  const match = rawUrl.match(/\/uploads\/([^/?#]+)$/);
  if (match) {
    const filename = match[1];
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(fullPath)) {
      try {
        const buf = fs.readFileSync(fullPath);
        if (buf.length <= 6 * 1024 * 1024) {
          const ext = path.extname(filename).toLowerCase();
          const mime =
            ext === '.png'
              ? 'image/png'
              : ext === '.webp'
              ? 'image/webp'
              : ext === '.mp4'
              ? 'video/mp4'
              : ext === '.webm'
              ? 'video/webm'
              : 'image/jpeg';
          return `data:${mime};base64,${buf.toString('base64')}`;
        }
      } catch {
        return null;
      }
    }
    return null; // File missing on disk -> drop broken local path
  }
  if (rawUrl.includes('via.placeholder.com')) {
    return null; // Drop dead placeholder URL
  }
  return rawUrl;
}

/**
 * Syncs complaints (and their reporters) between `edubridge` and `civiclens` on the same
 * MongoDB Atlas cluster using the native MongoClient (`mongoose.connection.client`)
 * and consolidates open complaints within a 30-meter radius.
 */
let syncInFlight = null;

/**
 * Non-blocking wrapper: runs the heavy cross-DB sync in the background at most once every
 * 10 minutes, so API requests (profile, complaint lists) return instantly.
 */
function syncLegacyComplaintsFromEdubridge(mongoose) {
  const now = Date.now();
  if (syncInFlight || now - lastSyncTimestamp < 10 * 60 * 1000) {
    return Promise.resolve();
  }
  lastSyncTimestamp = now;
  syncInFlight = runLegacySync(mongoose)
    .catch((err) => console.warn('Background sync failed:', err?.message || err))
    .finally(() => {
      syncInFlight = null;
    });
  return Promise.resolve();
}

async function runLegacySync(mongoose) {

  try {
    const client = mongoose?.connection?.client;
    if (!client) return;

    const activeDbName = mongoose.connection.name || 'civiclens';
    const otherDbName = activeDbName === 'civiclens' ? 'edubridge' : 'civiclens';

    const activeDb = client.db(activeDbName);
    const otherDb = client.db(otherDbName);

    // 1. Copy any complaints from otherDb that aren't in activeDb (and their reporter user if needed)
    const otherComplaints = await otherDb.collection('complaints').find({}).limit(200).toArray();
    for (const c of otherComplaints) {
      const orConditions = [{ _id: c._id }];
      if (c.complaintId) orConditions.push({ complaintId: c.complaintId });
      const exists = await activeDb.collection('complaints').findOne({ $or: orConditions });
      if (!exists) {
        await activeDb.collection('complaints').insertOne(c).catch(() => {});
        if (c.reportedBy) {
          const u = await otherDb.collection('users').findOne({ _id: c.reportedBy });
          if (u) {
            const uExists = await activeDb.collection('users').findOne({
              $or: [{ _id: u._id }, { email: u.email }]
            });
            if (!uExists) {
              await activeDb.collection('users').insertOne(u).catch(() => {});
            }
          }
        }
      }
    }

    // 3. Consolidate any existing open complaints within 30m radius into the primary complaint
    const allOpen = await activeDb
      .collection('complaints')
      .find({ status: { $nin: ['Resolved', 'Rejected'] } })
      .sort({ createdAt: 1 })
      .toArray();

    const mergedIds = new Set();
    for (let i = 0; i < allOpen.length; i++) {
      const primary = allOpen[i];
      if (mergedIds.has(String(primary._id))) continue;
      const coords1 = primary.location?.coordinates;
      if (!Array.isArray(coords1) || coords1.length < 2) continue;

      let updated = false;
      const beforeImages = Array.isArray(primary.beforeImages) ? [...primary.beforeImages] : [];
      const images = Array.isArray(primary.images) ? [...primary.images] : [];
      const beforeMedia = Array.isArray(primary.beforeMedia) ? [...primary.beforeMedia] : [];
      const reporters = Array.isArray(primary.reporters) ? [...primary.reporters] : [];
      const updates = Array.isArray(primary.updates) ? [...primary.updates] : [];
      let duplicatesCount = primary.duplicates || 0;
      let upvotesCount = primary.upvotes || 1;

      for (let j = i + 1; j < allOpen.length; j++) {
        const secondary = allOpen[j];
        if (mergedIds.has(String(secondary._id))) continue;
        const coords2 = secondary.location?.coordinates;
        if (!Array.isArray(coords2) || coords2.length < 2) continue;

        const dist = distanceMeters(coords1, coords2);
        if (dist <= 30) {
          mergedIds.add(String(secondary._id));
          updated = true;
          duplicatesCount += 1 + (secondary.duplicates || 0);
          upvotesCount += 1;

          for (const img of secondary.beforeImages || secondary.images || []) {
            if (img && !beforeImages.includes(img)) beforeImages.push(img);
            if (img && !images.includes(img)) images.push(img);
          }
          for (const m of secondary.beforeMedia || []) {
            if (m?.url && !beforeMedia.some((bm) => bm.url === m.url)) {
              beforeMedia.push(m);
            }
          }
          if (secondary.reportedBy) {
            reporters.push({
              user: secondary.reportedBy,
              reportedAt: secondary.createdAt || new Date(),
              note: secondary.description || secondary.title || ''
            });
          }
          updates.push({
            status: primary.status || 'Submitted',
            message: `Merged complaint #${secondary.complaintId || secondary._id} reported within ${Math.round(dist)}m (<=30m radius).`,
            by: 'System (30m Radius Auto-Merge)',
            timestamp: new Date()
          });

          await activeDb.collection('complaints').deleteOne({ _id: secondary._id });
        }
      }

      if (updated) {
        const newPriority = Math.min(100, (primary.priority || 50) + duplicatesCount * 10);
        await activeDb.collection('complaints').updateOne(
          { _id: primary._id },
          {
            $set: {
              beforeImages,
              images,
              beforeMedia,
              reporters,
              updates,
              duplicates: duplicatesCount,
              upvotes: upvotesCount,
              priority: newPriority
            }
          }
        );
      }
    }

    // 4. Upgrade any local /uploads/... paths in complaints to permanent inline Base64 Data URIs
    // and strip dead/missing local paths so images never break on Mobile, Vercel, or Render!
    const allComplaints = await activeDb.collection('complaints').find({}).toArray();
    for (const c of allComplaints) {
      const rawList = Array.isArray(c.beforeImages) && c.beforeImages.length > 0 ? c.beforeImages : c.images || [];
      const converted = [];
      let changed = false;

      for (const u of rawList) {
        const nextUrl = convertLocalUploadToDataUri(u);
        if (nextUrl !== u) changed = true;
        if (nextUrl && !converted.includes(nextUrl)) {
          converted.push(nextUrl);
        }
      }

      if (changed) {
        const nextMedia = converted.map((url) => ({
          url,
          mediaType: url.startsWith('data:video/') ? 'video' : 'image',
          publicId: null,
          storage: url.startsWith('data:') ? 'mongodb-inline' : 'cloudinary'
        }));
        await activeDb.collection('complaints').updateOne(
          { _id: c._id },
          {
            $set: {
              beforeImages: converted,
              images: converted,
              beforeMedia: nextMedia
            }
          }
        );
      }
    }
  } catch (err) {
    console.warn('Legacy DB sync warning:', err.message);
  }
}

/**
 * Computes a SHA-256 hex digest of a local file.
 */
async function computeFileHash(filePath) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Computes Hamming distance between two equal-length binary/hex hash strings.
 */
function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/**
 * Haversine distance in meters between two [lng, lat] GeoJSON coordinate pairs.
 */
function distanceMeters(coord1, coord2) {
  if (!Array.isArray(coord1) || !Array.isArray(coord2) || coord1.length < 2 || coord2.length < 2) {
    return Infinity;
  }
  const [lng1, lat1] = coord1.map(Number);
  const [lng2, lat2] = coord2.map(Number);
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Checks if an open complaint already exists with:
 * 1. Identical file SHA-256 hash (`fileHashes`), OR
 * 2. Near-identical perceptual image hash (`imageHashes` with Hamming distance <= 5), OR
 * 3. Within a 30-meter radius (`dist <= 30`) of an existing open complaint!
 *
 * When matched, the new report is merged into the SAME complaint (counted once, priority boosted).
 */
async function findExistingDuplicate(Complaint, { fileHashes = [], imageHashes = [], coordinates }) {
  const validFileHashes = fileHashes.filter(Boolean);
  const validImageHashes = imageHashes.filter(Boolean);

  // 1. Exact SHA-256 photo/video file match
  if (validFileHashes.length > 0) {
    const exactMatch = await Complaint.findOne({
      status: { $nin: ['Resolved', 'Rejected'] },
      fileHashes: { $in: validFileHashes }
    });
    if (exactMatch) {
      return { complaint: exactMatch, reason: 'same_photo', distanceMeters: 0 };
    }
  }

  // Fetch open complaints for perceptual hash + 30-meter radius check
  const openComplaints = await Complaint.find({
    status: { $nin: ['Resolved', 'Rejected'] }
  })
    .sort({ createdAt: -1 })
    .limit(200);

  // 2. Perceptual hash match (identical photo re-saved or re-uploaded)
  if (validImageHashes.length > 0) {
    for (const existing of openComplaints) {
      const existingHashes = existing.imageHashes || [];
      for (const h1 of validImageHashes) {
        for (const h2 of existingHashes) {
          if (hammingDistance(h1, h2) <= 5) {
            return { complaint: existing, reason: 'same_photo', distanceMeters: 0 };
          }
        }
      }
    }
  }

  // 3. 30-Meter Radius Check: any complaint within 30 meters is merged into the SAME complaint!
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    for (const existing of openComplaints) {
      if (existing.location?.coordinates?.length === 2) {
        const dist = distanceMeters(coordinates, existing.location.coordinates);
        if (dist <= 30) {
          return {
            complaint: existing,
            reason: 'same_location',
            distanceMeters: Math.round(dist)
          };
        }
      }
    }
  }

  return null;
}

/**
 * Lightweight list projection: keeps only the first image/media thumbnail so list
 * endpoints (dashboards) don't ship every full Base64 photo/video.
 */
function slimComplaintForList(doc) {
  const c = typeof doc?.toObject === 'function' ? doc.toObject() : { ...doc };
  const firstOnly = (arr) => (Array.isArray(arr) && arr.length ? [arr[0]] : []);
  const isVideoData = (v) => typeof v === 'string' && v.startsWith('data:video/');
  c.mediaCount = (c.beforeImages?.length || c.images?.length || 0);
  c.images = firstOnly(c.images).filter((v) => !isVideoData(v));
  c.beforeImages = firstOnly(c.beforeImages).filter((v) => !isVideoData(v));
  c.beforeMedia = firstOnly(c.beforeMedia).map((m) =>
    m && isVideoData(m.url) ? { ...m, url: '' } : m
  );
  c.afterImages = [];
  c.afterMedia = [];
  delete c.frameBase64;
  return c;
}

module.exports = {
  slimComplaintForList,
  computeFileHash,
  hammingDistance,
  distanceMeters,
  findExistingDuplicate,
  syncLegacyComplaintsFromEdubridge
};
