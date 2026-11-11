import { supabase } from '../lib/supabase.js';

function mapCase(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id || '',
    category: row.category || '',
    symptom: row.symptom || '',
    cause: row.cause || '',
    solution: row.solution || '',
    mediaName: row.media_name || '',
    mediaType: row.media_type || '',
    mediaUrl: row.media_url || ''
  };
}

export async function listCases() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('troubleshooting_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: (data || []).map(mapCase), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createCase(payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('troubleshooting_cases')
      .insert({
        legacy_id: payload.legacyId || null,
        category: payload.category || '',
        symptom: payload.symptom || '',
        cause: payload.cause || '',
        solution: payload.solution || '',
        media_name: payload.mediaName || '',
        media_type: payload.mediaType || null,
        media_url: payload.mediaUrl || ''
      })
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapCase(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateCase(id, payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const row = {};
  if ('category' in payload) row.category = payload.category;
  if ('symptom' in payload) row.symptom = payload.symptom;
  if ('cause' in payload) row.cause = payload.cause;
  if ('solution' in payload) row.solution = payload.solution;
  if ('mediaName' in payload) row.media_name = payload.mediaName || '';
  if ('mediaType' in payload) row.media_type = payload.mediaType || null;
  if ('mediaUrl' in payload) row.media_url = payload.mediaUrl || '';

  try {
    const { data, error } = await supabase
      .from('troubleshooting_cases')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapCase(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteCase(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('troubleshooting_cases').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function restoreCase(item) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('troubleshooting_cases').upsert(
      {
        id: item.id,
        legacy_id: item.legacyId || null,
        category: item.category || '',
        symptom: item.symptom || '',
        cause: item.cause || '',
        solution: item.solution || '',
        media_name: item.mediaName || '',
        media_type: item.mediaType || null,
        media_url: item.mediaUrl || ''
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
