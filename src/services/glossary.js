import { supabase } from '../lib/supabase.js';

function mapTerm(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id || '',
    term: row.term || '',
    def: row.def || '',
    analogy: row.analogy || '',
    mediaName: row.media_name || '',
    mediaType: row.media_type || '',
    mediaUrl: row.media_url || ''
  };
}

export async function listTerms() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: (data || []).map(mapTerm), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createTerm(payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('glossary_terms')
      .insert({
        legacy_id: payload.legacyId || null,
        term: payload.term || '',
        def: payload.def || '',
        analogy: payload.analogy || '',
        media_name: payload.mediaName || '',
        media_type: payload.mediaType || null,
        media_url: payload.mediaUrl || ''
      })
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapTerm(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateTerm(id, payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const row = {};
  if ('term' in payload) row.term = payload.term;
  if ('def' in payload) row.def = payload.def;
  if ('analogy' in payload) row.analogy = payload.analogy;
  if ('mediaName' in payload) row.media_name = payload.mediaName || '';
  if ('mediaType' in payload) row.media_type = payload.mediaType || null;
  if ('mediaUrl' in payload) row.media_url = payload.mediaUrl || '';

  try {
    const { data, error } = await supabase
      .from('glossary_terms')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapTerm(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteTerm(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('glossary_terms').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function restoreTerm(item) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('glossary_terms').upsert(
      {
        id: item.id,
        legacy_id: item.legacyId || null,
        term: item.term || '',
        def: item.def || '',
        analogy: item.analogy || '',
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
