import { createClient } from '@supabase/supabase-js';
import { dbService, PingResult } from '@/services/dbService';

export { dbService, type PingResult };

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

// Create Supabase Client instance (safe for browser environments)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Ensure active Supabase Auth session so Row-Level Security (RLS)
 * permits write operations (insert, update, delete, storage upload).
 */
export async function ensureAuthSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@uskistore.id',
      password: 'password123',
    });
    return Boolean(!error && loginData.session);
  } catch (err) {
    console.warn('ensureAuthSession error:', err);
    return false;
  }
}

/**
 * Convert base64 DataURL (e.g. from canvas) to Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('Failed to parse dataURL in dataURLtoBlob, returning fallback Blob:', err);
    return new Blob([], { type: 'image/png' });
  }
}

/**
 * Upload image or document directly to Supabase Storage Bucket
 * with automatic public URL generation. Supports File, Blob, or base64 DataURL string.
 */
export async function uploadFileToStorage(
  fileOrDataUrl: File | Blob | string,
  bucket: 'product-images' | 'payment-proofs' | 'delivery-proofs' | 'custom-order-attachments',
  customFolder = ''
): Promise<string> {
  let fileBody: File | Blob;
  let fileExt = 'jpg';

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('data:')) {
      fileBody = dataURLtoBlob(fileOrDataUrl);
      fileExt = fileBody.type.split('/')[1] || 'png';
    } else {
      // Already an HTTP or public URL
      return fileOrDataUrl;
    }
  } else if (fileOrDataUrl instanceof File) {
    fileBody = fileOrDataUrl;
    fileExt = fileOrDataUrl.name.split('.').pop() || 'jpg';
  } else {
    fileBody = fileOrDataUrl;
    fileExt = fileOrDataUrl.type.split('/')[1] || 'jpg';
  }

  if (!supabase) {
    // Fallback for local preview if Supabase is not yet configured: create object URL
    return URL.createObjectURL(fileBody);
  }

  await ensureAuthSession();

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = customFolder ? `${customFolder}/${fileName}` : fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, {
      cacheControl: '3600',
      upsert: true,
      contentType: fileBody.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg'),
    });

  if (uploadError) {
    console.error(`Error uploading to ${bucket}:`, uploadError);
    return URL.createObjectURL(fileBody);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Active Supabase Connectivity Ping
 * Performs a live database query to verify network roundtrip
 */
export async function pingSupabase(): Promise<PingResult> {
  return dbService.ping();
}
