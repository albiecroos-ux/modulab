import { supabase } from '../lib/supabase.js';

function mapItem(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id || '',
    text: row.text || '',
    checked: Boolean(row.checked),
    position: row.position ?? 0
  };
}

export async function listItems() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(mapItem), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createItem(payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        legacy_id: payload.legacyId || null,
        text: payload.text || '',
        checked: Boolean(payload.checked),
        position: payload.position ?? 0
      })
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapItem(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateItem(id, payload) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const row = {};
  if ('text' in payload) row.text = payload.text;
  if ('checked' in payload) row.checked = Boolean(payload.checked);
  if ('position' in payload) row.position = payload.position;

  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { data: mapItem(data), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteItem(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteItems(ids) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  if (!ids?.length) return { data: true, error: null };
  try {
    const { error } = await supabase.from('checklist_items').delete().in('id', ids);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function resetChecked() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase
      .from('checklist_items')
      .update({ checked: false })
      .eq('checked', true);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function restoreItems(items) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  if (!items?.length) return { data: true, error: null };
  try {
    const rows = items.map((item, index) => ({
      id: item.id,
      legacy_id: item.legacyId || null,
      text: item.text || '',
      checked: Boolean(item.checked),
      position: item.position ?? index
    }));
    const { error } = await supabase.from('checklist_items').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
