import { state, getActiveModule } from '../state.js';
import { escapeHtml, renderMediaAttachmentBlock, showToast } from '../lib/ui.js';

export function renderSavedModulesBar() {
  const bar = document.getElementById('saved-modules-bar');
  if (!bar) return;

  if (state.modules.length === 0) {
    bar.innerHTML = `
      <div class="w-full p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs text-slate-500">Daftar modul kosong. Silakan klik tombol <strong>+ Buat Modul Baru</strong> untuk mulai menyusun modul.</span>
        <button onclick="createNewModule()" class="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold">+ Buat Modul Baru</button>
      </div>
    `;
    return;
  }

  bar.innerHTML = state.modules
    .map((m) => {
      const isActive = m.id === state.activeModuleId;
      const id = escapeHtml(m.id);
      return `
        <div class="inline-flex items-center rounded-xl border p-1 transition-all ${isActive ? 'bg-primary-50 border-primary-500 shadow-xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}">
          <button type="button" onclick="viewContent('module', '${id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1">
            <i class="fa-solid fa-eye"></i> Lihat
          </button>
          <button type="button" onclick="selectModuleById('${id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${isActive ? 'text-primary-700' : 'text-slate-700'}">
            <i class="fa-solid fa-file-lines"></i>
            <span>${escapeHtml(m.title || 'Modul Tanpa Judul')}</span>
          </button>
          <button type="button" onclick="deleteModuleById('${id}')" class="ml-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 transition" title="Hapus Modul Ini">
            <i class="fa-solid fa-trash-can"></i> Hapus
          </button>
        </div>
      `;
    })
    .join('');
}

export function loadActiveModuleIntoBuilder() {
  renderSavedModulesBar();
  const mod = getActiveModule();
  const title = document.getElementById('mod-title');
  const duration = document.getElementById('mod-duration');
  const goal = document.getElementById('mod-goal');
  const tools = document.getElementById('mod-tools');
  if (!title || !duration || !goal || !tools) return;

  if (!mod) {
    title.value = '';
    duration.value = '';
    goal.value = '';
    tools.value = '';
    const attContainer = document.getElementById('mod-attachments-container');
    if (attContainer) {
      attContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Pilih atau buat modul terlebih dahulu.</p>`;
    }
    const stepsContainer = document.getElementById('steps-container');
    if (stepsContainer) stepsContainer.innerHTML = '';
    updateLivePreview();
    return;
  }

  title.value = mod.title || '';
  duration.value = mod.duration || '';
  goal.value = mod.goal || '';
  tools.value = mod.tools || '';

  renderModuleAttachmentsList();
  renderModuleStepsList();
  updateLivePreview();
}

export function renderModuleAttachmentsList() {
  const mod = getActiveModule();
  const container = document.getElementById('mod-attachments-container');
  if (!container) return;
  const atts = mod?.attachments || [];

  if (atts.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-500 italic">Belum ada lampiran video/file pada modul ini.</p>`;
    return;
  }

  container.innerHTML = atts
    .map((att) => {
      const id = escapeHtml(att.id);
      return `
        <div class="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-indigo-200/80 shadow-2xs">
          <div class="flex items-center gap-2 truncate text-xs font-semibold text-slate-700">
            <i class="fa-solid ${att.type === 'video' || att.type === 'youtube' ? 'fa-circle-play text-rose-500' : att.type === 'image' ? 'fa-image text-emerald-600' : 'fa-file-lines text-primary-600'}"></i>
            <span class="truncate">${escapeHtml(att.name)}</span>
            ${att.size ? `<span class="text-[10px] text-slate-400">(${escapeHtml(att.size)})</span>` : ''}
          </div>
          <button type="button" onclick="deleteModuleAttachment('${id}')" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 transition">
            <i class="fa-solid fa-trash-can"></i> Hapus Lampiran
          </button>
        </div>
      `;
    })
    .join('');
}

export function renderModuleStepsList() {
  const mod = getActiveModule();
  const container = document.getElementById('steps-container');
  if (!container) return;
  if (!mod) {
    container.innerHTML = '';
    return;
  }

  if (!mod.steps || mod.steps.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
        <p class="text-xs text-slate-500">Belum ada langkah kerja pada modul ini.</p>
        <button type="button" onclick="addStepToActiveModule()" class="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold">+ Tambah Langkah Pertama</button>
      </div>
    `;
    return;
  }

  container.innerHTML = mod.steps
    .map(
      (s, idx) => `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-lg">Langkah ${idx + 1}</span>
          <button type="button" onclick="deleteStepFromActiveModule(${idx})" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition">
            <i class="fa-solid fa-trash-can"></i> Hapus Langkah
          </button>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">Instruksi Langkah ${idx + 1}</label>
          <textarea rows="2" oninput="updateStepField(${idx}, 'instruction', this.value)" placeholder="Tulis kalimat instruksi yang jelas..." class="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">${escapeHtml(s.instruction)}</textarea>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-lightbulb text-amber-500 text-xs shrink-0"></i>
          <input type="text" oninput="updateStepField(${idx}, 'tip', this.value)" value="${escapeHtml(s.tip)}" placeholder="Catatan / Tips Anti-Bingung bagi mahasiswa (Opsional)" class="w-full px-3 py-1.5 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
        </div>
        <div class="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
          <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-[11px] font-bold text-primary-700 transition">
            <i class="fa-solid fa-paperclip"></i> Lampirkan Video/Gambar/File di Langkah ${idx + 1}
            <input type="file" accept="video/*,image/*,.pdf,.py,.php,.sql,.zip" onchange="handleStepMediaUpload(event, ${idx})" class="hidden">
          </label>
          ${s.mediaUrl ? `
            <div class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-800">
              <span class="truncate max-w-[160px]"><i class="fa-solid fa-check-circle mr-1"></i>${escapeHtml(s.mediaName)}</span>
              <button type="button" onclick="deleteStepMedia(${idx})" class="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]">
                Hapus Media Langkah
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `
    )
    .join('');
}

export function updateLivePreview() {
  const mod = getActiveModule();
  const previewEl = document.getElementById('module-preview-area');
  if (!previewEl) return;

  if (!mod) {
    previewEl.innerHTML = `
      <div class="p-8 text-center text-slate-400 space-y-2">
        <i class="fa-solid fa-folder-open text-3xl"></i>
        <p class="text-sm font-medium">Belum ada modul yang dipilih.</p>
      </div>
    `;
    return;
  }

  const toolsArray = mod.tools
    ? mod.tools.split(',').map((t) => t.trim()).filter(Boolean)
    : ['Perangkat Komputer Lab'];
  const attachments = mod.attachments || [];
  const steps = mod.steps || [];

  previewEl.innerHTML = `
    <div class="border-b border-slate-100 pb-4">
      <div class="flex items-center justify-between text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">
        <span>Modul Panduan Praktikum</span>
        <span class="bg-primary-50 px-2.5 py-1 rounded-full"><i class="fa-regular fa-clock mr-1"></i>${escapeHtml(mod.duration || '60 Menit')}</span>
      </div>
      <h3 class="text-lg font-bold text-slate-900">${escapeHtml(mod.title || 'Judul Modul Praktikum')}</h3>
    </div>

    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tujuan Praktikum</h4>
      <p class="text-xs text-slate-700 leading-relaxed">${escapeHtml(mod.goal || '-')}</p>
    </div>

    <div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Alat & Bahan</h4>
      <div class="flex flex-wrap gap-1.5">
        ${toolsArray
          .map(
            (tool) => `
          <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
            <i class="fa-solid fa-check text-[10px] mr-1"></i>${escapeHtml(tool)}
          </span>
        `
          )
          .join('')}
      </div>
    </div>

    ${attachments.length > 0
      ? `
      <div class="space-y-2 pt-1">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Lampiran Media & Video Pembelajaran</h4>
        <div class="space-y-3">
          ${attachments
            .map((att) =>
              renderMediaAttachmentBlock(att.type, att.previewUrl || att.url, att.name)
            )
            .join('')}
        </div>
      </div>
    `
      : ''}

    <div class="space-y-3 pt-1">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Langkah Kerja Praktikum</h4>
      ${steps.length === 0
        ? `<p class="text-xs text-slate-400 italic">Belum ada langkah kerja.</p>`
        : steps
            .map(
              (s, i) => `
        <div class="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
          <div class="flex items-start space-x-3">
            <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
            <p class="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">${escapeHtml(s.instruction || '(Instruksi belum diisi)')}</p>
          </div>
          ${s.tip
            ? `
            <div class="ml-9 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
              <i class="fa-solid fa-lightbulb text-amber-500 mt-0.5 shrink-0"></i>
              <span><strong>Tips Anti-Bingung:</strong> ${escapeHtml(s.tip)}</span>
            </div>
          `
            : ''}
          ${s.mediaUrl
            ? `<div class="ml-9">${renderMediaAttachmentBlock(s.mediaType, s.mediaPreviewUrl || s.mediaUrl, s.mediaName)}</div>`
            : ''}
        </div>
      `
            )
            .join('')}
    </div>
  `;
}

export function copyModuleText() {
  const mod = getActiveModule();
  if (!mod) return;
  let text = `MODUL PRAKTIKUM: ${(mod.title || '').toUpperCase()}\n`;
  text += `Estimasi Waktu: ${mod.duration}\n\n`;
  text += `TUJUAN:\n${mod.goal}\n\n`;
  text += `ALAT & BAHAN:\n${mod.tools}\n\n`;
  text += `LANGKAH KERJA:\n`;
  (mod.steps || []).forEach((s, i) => {
    text += `${i + 1}. ${s.instruction}\n`;
    if (s.tip) text += `   *Catatan Penting: ${s.tip}\n`;
  });

  const tempArea = document.createElement('textarea');
  tempArea.value = text;
  document.body.appendChild(tempArea);
  tempArea.select();
  document.execCommand('copy');
  document.body.removeChild(tempArea);

  showToast('Instruksi modul berhasil disalin ke Clipboard!');
}

export function renderModuleTab() {
  loadActiveModuleIntoBuilder();
}
