import { createClient } from './client';

export async function uploadProofPhoto(file: File, opts?: { prefix?: string }): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  try {
    const bucket = 'delivery-proofs';
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${opts?.prefix || 'proofs'}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });
    if (error) return { success: false, error: error.message };

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return { success: true, url: pub.publicUrl };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
