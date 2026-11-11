import { supabase } from '../lib/supabase.js';
import { isSafeHttpUrl } from '../lib/ui.js';
import { uploadDataUrl } from './storage.js';
import { createModule, updateModule, addStep, addAttachment } from './modules.js';
import { createCase } from './troubleshooting.js';
import { createTerm } from './glossary.js';
import { createItem } from './checklist.js';
import { createLog } from './evaluations.js';

const LEGACY_STORAGE_KEY = 'LABASSIST_PORTAL_V3_CRUD';
const LEGACY_TABLE = 'labassist_shared_state';

function emptySummary() {
  return {
    sources: [],
    modules: { inserted: 0, skipped: 0 },
    steps: { inserted: 0 },
    attachments: { inserted: 0 },
    troubleshooting: { inserted: 0, skipped: 0 },
    glossary: { inserted: 0, skipped: 0 },
    checklist: { inserted: 0, skipped: 0 },
    evaluations: { inserted: 0, skipped: 0 },
    media: { uploaded: 0, failed: 0 },
    warnings: []
  };
}

async function readSharedState(summary) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(LEGACY_TABLE)
      .select('state')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    if (data?.state) {
      summary.sources.push('tabel labassist_shared_state');
      return data.state;
    }
  } catch (error) {
    summary.warnings.push(
      `Tabel lama labassist_shared_state tidak dapat dibaca: ${error.message || error}`
    );
  }
  return null;
}

function readLocalState(summary) {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      summary.sources.push('localStorage browser');
      return parsed;
    }
  } catch (error) {
    summary.warnings.push(`localStorage lama tidak dapat dibaca: ${error.message || error}`);
  }
  return null;
}

async function legacyIdsIn(table) {
  if (!supabase) return new Set();
  try {
    const { data, error } = await supabase
      .from(table)
      .select('legacy_id')
      .not('legacy_id', 'is', null);
    if (error) throw error;
    return new Set((data || []).map((row) => String(row.legacy_id)));
  } catch {
    return new Set();
  }
}

async function moveMedia(value, name, userId, summary) {
  const empty = { mediaName: name || '', mediaType: '', mediaUrl: '', size: '' };
  if (!value) return empty;

  if (String(value).startsWith('data:')) {
    const result = await uploadDataUrl(value, name || 'media-lama', userId);
    if (result.error) {
      summary.media.failed += 1;
      summary.warnings.push(
        `Media "${name || 'tanpa nama'}" gagal dipindahkan: ${result.error.message || result.error}`
      );
      return { ...empty, mediaName: name || '' };
    }
    summary.media.uploaded += 1;
    return {
      mediaName: result.data.name,
      mediaType: result.data.type,
      mediaUrl: result.data.path,
      size: result.data.size
    };
  }

  if (isSafeHttpUrl(value)) {
    return { ...empty, mediaUrl: value };
  }

  summary.warnings.push(`URL media "${name || value}" dilewati karena bukan http/https.`);
  return empty;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const MEDIA_TYPES = new Set(['image', 'video', 'pdf', 'youtube', 'link', 'file']);

function safeMediaType(value) {
  return MEDIA_TYPES.has(value) ? value : '';
}

export async function importLegacyData(userId) {
  const summary = emptySummary();
  if (!supabase) {
    return { data: null, error: new Error('Supabase belum dikonfigurasi.'), summary };
  }
  if (!userId) {
    return { data: null, error: new Error('Sesi admin tidak ditemukan.'), summary };
  }

  const shared = await readSharedState(summary);
  const local = readLocalState(summary);
  const sources = [];
  if (shared) sources.push(shared);
  if (local && local !== shared) sources.push(local);

  if (sources.length === 0) {
    return {
      data: summary,
      error: new Error('Tidak ada data lama yang ditemukan untuk diimpor.'),
      summary
    };
  }

  const [existingModules, existingCases, existingTerms, existingChecklist, existingLogs] =
    await Promise.all([
      legacyIdsIn('modules'),
      legacyIdsIn('troubleshooting_cases'),
      legacyIdsIn('glossary_terms'),
      legacyIdsIn('checklist_items'),
      legacyIdsIn('eval_logs')
    ]);

  for (const source of sources) {
    for (const [index, mod] of asArray(source.modules).entries()) {
      const legacyId = mod?.id != null ? String(mod.id) : `module-${index}`;
      if (existingModules.has(legacyId)) {
        summary.modules.skipped += 1;
        continue;
      }

      const created = await createModule({
        legacyId,
        title: mod.title || 'Modul Tanpa Judul',
        duration: mod.duration || '',
        goal: mod.goal || '',
        tools: mod.tools || ''
      });
      if (created.error) {
        summary.warnings.push(`Modul "${mod.title}" gagal diimpor: ${created.error.message}`);
        continue;
      }
      const moduleId = created.data;
      existingModules.add(legacyId);
      summary.modules.inserted += 1;

      for (const [stepIndex, step] of asArray(mod.steps).entries()) {
        const media = await moveMedia(
          step.mediaUrl,
          step.mediaName,
          userId,
          summary
        );
        const stepResult = await addStep(moduleId, {
          position: stepIndex,
          instruction: step.instruction || '',
          tip: step.tip || '',
          mediaName: media.mediaName,
          mediaType: media.mediaType || safeMediaType(step.mediaType),
          mediaUrl: media.mediaUrl
        });
        if (stepResult.error) {
          summary.warnings.push(
            `Langkah ${stepIndex + 1} modul "${mod.title}" gagal: ${stepResult.error.message}`
          );
        } else {
          summary.steps.inserted += 1;
        }
      }

      for (const [attIndex, att] of asArray(mod.attachments).entries()) {
        const media = await moveMedia(att.url, att.name, userId, summary);
        const isYoutube = att.type === 'youtube' && isSafeHttpUrl(att.url);
        const fallbackType = ['image', 'video', 'pdf', 'link', 'file'].includes(att.type)
          ? att.type
          : 'file';
        const type = isYoutube ? 'youtube' : media.mediaType || fallbackType;
        const attResult = await addAttachment(moduleId, {
          position: attIndex,
          name: att.name || media.mediaName || 'Lampiran',
          type,
          url: isYoutube ? att.url : media.mediaUrl,
          size: att.size || media.size || ''
        });
        if (attResult.error) {
          summary.warnings.push(
            `Lampiran "${att.name}" gagal: ${attResult.error.message}`
          );
        } else {
          summary.attachments.inserted += 1;
        }
      }

      await updateModule(moduleId, {
        title: mod.title || 'Modul Tanpa Judul',
        duration: mod.duration || '',
        goal: mod.goal || '',
        tools: mod.tools || ''
      });
    }

    for (const [index, item] of asArray(source.troubleshooting).entries()) {
      const legacyId = item?.id != null ? String(item.id) : `case-${index}`;
      if (existingCases.has(legacyId)) {
        summary.troubleshooting.skipped += 1;
        continue;
      }
      const media = await moveMedia(item.mediaUrl, item.mediaName, userId, summary);
      const result = await createCase({
        legacyId,
        category: item.category || '',
        symptom: item.symptom || '',
        cause: item.cause || '',
        solution: item.solution || '',
        mediaName: media.mediaName,
        mediaType: media.mediaType || safeMediaType(item.mediaType),
        mediaUrl: media.mediaUrl
      });
      if (result.error) {
        summary.warnings.push(`Kasus "${item.symptom}" gagal: ${result.error.message}`);
      } else {
        summary.troubleshooting.inserted += 1;
        existingCases.add(legacyId);
      }
    }

    for (const [index, item] of asArray(source.analogies).entries()) {
      const legacyId = item?.id != null ? String(item.id) : `term-${index}`;
      if (existingTerms.has(legacyId)) {
        summary.glossary.skipped += 1;
        continue;
      }
      const media = await moveMedia(item.mediaUrl, item.mediaName, userId, summary);
      const result = await createTerm({
        legacyId,
        term: item.term || '',
        def: item.def || '',
        analogy: item.analogy || '',
        mediaName: media.mediaName,
        mediaType: media.mediaType || safeMediaType(item.mediaType),
        mediaUrl: media.mediaUrl
      });
      if (result.error) {
        summary.warnings.push(`Istilah "${item.term}" gagal: ${result.error.message}`);
      } else {
        summary.glossary.inserted += 1;
        existingTerms.add(legacyId);
      }
    }

    for (const [index, item] of asArray(source.checklist).entries()) {
      const legacyId = item?.id != null ? String(item.id) : `check-${index}`;
      if (existingChecklist.has(legacyId)) {
        summary.checklist.skipped += 1;
        continue;
      }
      const result = await createItem({
        legacyId,
        text: item.text || '',
        checked: Boolean(item.checked),
        position: index
      });
      if (result.error) {
        summary.warnings.push(`Checklist "${item.text}" gagal: ${result.error.message}`);
      } else {
        summary.checklist.inserted += 1;
        existingChecklist.add(legacyId);
      }
    }

    for (const [index, item] of asArray(source.evalLogs).entries()) {
      const legacyId = item?.id != null ? String(item.id) : `eval-${index}`;
      if (existingLogs.has(legacyId)) {
        summary.evaluations.skipped += 1;
        continue;
      }
      const media = await moveMedia(item.mediaUrl, item.mediaName, userId, summary);
      const result = await createLog({
        legacyId,
        date: item.date || 'Sesi Sebelumnya',
        session: item.session || '',
        confused: item.confused || '',
        action: item.action || '',
        mediaName: media.mediaName,
        mediaType: media.mediaType || safeMediaType(item.mediaType),
        mediaUrl: media.mediaUrl
      });
      if (result.error) {
        summary.warnings.push(`Evaluasi "${item.session}" gagal: ${result.error.message}`);
      } else {
        summary.evaluations.inserted += 1;
        existingLogs.add(legacyId);
      }
    }
  }

  return { data: summary, error: null, summary };
}
