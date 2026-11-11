import { supabase } from '../lib/supabase.js';

function mapLog(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id || '',
    date: row.date || '',
    session: row.session || '',
    confused: row.confused || '',
    action: row.action || '',
    mediaName: row.media_name || '',
    mediaType: row.media_type || '',
    mediaUrl: row.media_url || ''
  };
}

export async function listLogs() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('eval_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: (data || []).map(mapLog), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createLog(payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('eval_logs')
      .insert({
        legacy_id: payload.legacyId || null,
        date: payload.date || 'Baru saja',
        session: payload.session || '',
        confused: payload.confused || '',
        action: payload.action || '',
        media_name: payload.mediaName || '',
        media_type: payload.mediaType || null,
        media_url: payload.mediaUrl || ''
      })
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapLog(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateLog(id, payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const row = {};
  if ('date' in payload) row.date = payload.date;
  if ('session' in payload) row.session = payload.session;
  if ('confused' in payload) row.confused = payload.confused;
  if ('action' in payload) row.action = payload.action;
  if ('mediaName' in payload) row.media_name = payload.mediaName || '';
  if ('mediaType' in payload) row.media_type = payload.mediaType || null;
  if ('mediaUrl' in payload) row.media_url = payload.mediaUrl || '';

  try {
    const { data, error } = await supabase
      .from('eval_logs')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapLog(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteLog(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('eval_logs').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function restoreLog(item) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('eval_logs').upsert(
      {
        id: item.id,
        legacy_id: item.legacyId || null,
        date: item.date || '',
        session: item.session || '',
        confused: item.confused || '',
        action: item.action || '',
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
