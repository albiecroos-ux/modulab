import { supabase } from '../lib/supabase.js';

export const BUCKET = 'lab-media';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/x-python',
  'text/x-php',
  'application/x-httpd-php',
  'application/sql',
  'application/octet-stream'
]);

const signedUrlCache = new Map();
const SIGNED_URL_TTL_SECONDS = 3600;

export function inferMediaType(file) {
  const mime = file?.type || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  return 'file';
}

export function validateMediaFile(file) {
  if (!file) return 'File tidak ditemukan.';
  if (file.size > MAX_FILE_SIZE) {
    return `Ukuran file "${file.name}" melebihi batas 10 MB.`;
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mime)) {
    return `Tipe file "${file.name}" (${mime}) tidak diizinkan.`;
  }
  return null;
}

export function sanitizeFileName(name) {
  const cleaned = String(name || 'file')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (cleaned || 'file').slice(-120);
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadMedia(file, userId) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const validationError = validateMediaFile(file);
  if (validationError) return { data: null, error: new Error(validationError) };
  if (!userId) return { data: null, error: new Error('Sesi pengguna tidak ditemukan.') };

  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const contentType = file.type || 'application/octet-stream';

  try {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: false
    });
    if (error) throw error;
    return {
      data: {
        path,
        name: file.name,
        type: inferMediaType(file),
        size: formatFileSize(file.size)
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

export function isStoragePath(value) {
  if (!value) return false;
  return !/^https?:\/\//i.test(value) && !value.startsWith('data:');
}

export async function getSignedUrl(path) {
  if (!supabase || !path) return '';
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    if (!data?.signedUrl) return '';
    signedUrlCache.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000
    });
    return data.signedUrl;
  } catch (error) {
    console.warn('Gagal membuat signed URL:', error?.message || error);
    return '';
  }
}

export async function resolveMediaUrl(value) {
  if (!value) return '';
  if (!isStoragePath(value)) return value;
  return getSignedUrl(value);
}

export async function removeMedia(path) {
  if (!supabase || !path || !isStoragePath(path)) return { data: null, error: null };
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
    signedUrlCache.delete(path);
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function hydrateMediaFields(entity, urlField, previewField) {
  if (!entity) return entity;
  const raw = entity[urlField];
  if (!raw) {
    entity[previewField] = '';
    return entity;
  }
  entity[previewField] = await resolveMediaUrl(raw);
  return entity;
}

export async function hydrateModule(module) {
  if (!module) return module;
  await Promise.all([
    ...(module.steps || []).map((step) =>
      hydrateMediaFields(step, 'mediaUrl', 'mediaPreviewUrl')
    ),
    ...(module.attachments || []).map((att) =>
      hydrateMediaFields(att, 'url', 'previewUrl')
    )
  ]);
  return module;
}

export async function hydrateModules(modules) {
  await Promise.all((modules || []).map((module) => hydrateModule(module)));
  return modules;
}

export async function hydrateList(items) {
  await Promise.all(
    (items || []).map((item) => hydrateMediaFields(item, 'mediaUrl', 'mediaPreviewUrl'))
  );
  return items;
}

export function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || '');
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const raw = isBase64 ? atob(match[3]) : decodeURIComponent(match[3]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadDataUrl(dataUrl, fileName, userId) {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return { data: null, error: new Error('Data media lama tidak valid.') };
  const mime = blob.type || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mime)) {
    return { data: null, error: new Error(`Tipe media lama tidak diizinkan: ${mime}`) };
  }
  if (blob.size > MAX_FILE_SIZE) {
    return { data: null, error: new Error('Media lama melebihi batas 10 MB.') };
  }
  const pseudoFile = new File([blob], fileName || 'media-lama', { type: mime });
  return uploadMedia(pseudoFile, userId);
}
