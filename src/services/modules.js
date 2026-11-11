import { supabase } from '../lib/supabase.js';

const MODULE_SELECT =
  'id,legacy_id,title,duration,goal,tools,created_at,updated_at,' +
  'module_steps(id,module_id,position,instruction,tip,media_name,media_type,media_url,created_at),' +
  'module_attachments(id,module_id,position,name,type,url,size,created_at)';

function mapStep(row) {
  return {
    id: row.id,
    moduleId: row.module_id,
    position: row.position ?? 0,
    instruction: row.instruction || '',
    tip: row.tip || '',
    mediaName: row.media_name || '',
    mediaType: row.media_type || '',
    mediaUrl: row.media_url || ''
  };
}

function mapAttachment(row) {
  return {
    id: row.id,
    moduleId: row.module_id,
    position: row.position ?? 0,
    name: row.name || '',
    type: row.type || 'file',
    url: row.url || '',
    size: row.size || ''
  };
}

function mapModule(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id || '',
    title: row.title || '',
    duration: row.duration || '',
    goal: row.goal || '',
    tools: row.tools || '',
    steps: (row.module_steps || [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapStep),
    attachments: (row.module_attachments || [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapAttachment)
  };
}

export async function listModules() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('modules')
      .select(MODULE_SELECT)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(mapModule), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createModule(payload = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('modules')
      .insert({
        legacy_id: payload.legacyId || null,
        title: payload.title ?? 'Modul Praktikum Baru',
        duration: payload.duration ?? '60 Menit',
        goal: payload.goal ?? 'Tuliskan tujuan praktikum yang mudah dipahami mahasiswa.',
        tools: payload.tools ?? 'Komputer Lab, Software Praktikum'
      })
      .select('id')
      .single();
    if (error) throw error;
    return { data: data.id, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateModule(id, patch) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const payload = {};
  if ('title' in patch) payload.title = patch.title;
  if ('duration' in patch) payload.duration = patch.duration;
  if ('goal' in patch) payload.goal = patch.goal;
  if ('tools' in patch) payload.tools = patch.tools;
  if (Object.keys(payload).length === 0) return { data: true, error: null };

  try {
    const { error } = await supabase.from('modules').update(payload).eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteModule(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addStep(moduleId, payload = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('module_steps')
      .insert({
        module_id: moduleId,
        position: payload.position ?? 0,
        instruction: payload.instruction ?? '',
        tip: payload.tip ?? '',
        media_name: payload.mediaName ?? '',
        media_type: payload.mediaType || null,
        media_url: payload.mediaUrl ?? ''
      })
      .select('id')
      .single();
    if (error) throw error;
    return { data: data.id, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateStep(id, patch) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const payload = {};
  if ('instruction' in patch) payload.instruction = patch.instruction;
  if ('tip' in patch) payload.tip = patch.tip;
  if ('mediaName' in patch) payload.media_name = patch.mediaName;
  if ('mediaType' in patch) payload.media_type = patch.mediaType || null;
  if ('mediaUrl' in patch) payload.media_url = patch.mediaUrl || '';
  if ('position' in patch) payload.position = patch.position;
  if (Object.keys(payload).length === 0) return { data: true, error: null };

  try {
    const { error } = await supabase.from('module_steps').update(payload).eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteStep(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('module_steps').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addAttachment(moduleId, payload = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('module_attachments')
      .insert({
        module_id: moduleId,
        position: payload.position ?? 0,
        name: payload.name ?? '',
        type: payload.type || 'file',
        url: payload.url ?? '',
        size: payload.size ?? ''
      })
      .select('id')
      .single();
    if (error) throw error;
    return { data: data.id, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteAttachment(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.from('module_attachments').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function restoreModule(snapshot) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error: moduleError } = await supabase.from('modules').upsert(
      {
        id: snapshot.id,
        legacy_id: snapshot.legacyId || null,
        title: snapshot.title || '',
        duration: snapshot.duration || '',
        goal: snapshot.goal || '',
        tools: snapshot.tools || ''
      },
      { onConflict: 'id' }
    );
    if (moduleError) throw moduleError;

    const steps = (snapshot.steps || []).map((step, index) => ({
      id: step.id,
      module_id: snapshot.id,
      position: index,
      instruction: step.instruction || '',
      tip: step.tip || '',
      media_name: step.mediaName || '',
      media_type: step.mediaType || null,
      media_url: step.mediaUrl || ''
    }));
    if (steps.length) {
      const { error } = await supabase
        .from('module_steps')
        .upsert(steps, { onConflict: 'id' });
      if (error) throw error;
    }

    const attachments = (snapshot.attachments || []).map((att, index) => ({
      id: att.id,
      module_id: snapshot.id,
      position: index,
      name: att.name || '',
      type: att.type || 'file',
      url: att.url || '',
      size: att.size || ''
    }));
    if (attachments.length) {
      const { error } = await supabase
        .from('module_attachments')
        .upsert(attachments, { onConflict: 'id' });
      if (error) throw error;
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
