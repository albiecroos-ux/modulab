import { state } from '../state.js';
import { escapeHtml, renderMediaAttachmentBlock } from '../lib/ui.js';

export function renderAnalogies() {
  const query = (document.getElementById('search-analogy')?.value || '').toLowerCase();
  const filtered = state.analogies.filter(
    (item) =>
      item.term.toLowerCase().includes(query) ||
      item.def.toLowerCase().includes(query) ||
      item.analogy.toLowerCase().includes(query)
  );

  const container = document.getElementById('analogy-list');
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">Istilah atau analogi tidak ditemukan.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const id = escapeHtml(item.id);
      return `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">
                  <i class="fa-solid fa-lightbulb"></i>
                </div>
                <h4 class="font-bold text-slate-900 text-sm">${escapeHtml(item.term)}</h4>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button type="button" onclick="editAnalogyItem('${id}')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-[11px] font-bold transition">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button type="button" onclick="deleteAnalogyItem('${id}')" class="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition">
                  <i class="fa-solid fa-trash-can"></i> Hapus Istilah
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-3">${escapeHtml(item.def)}</p>
          </div>
          <div class="space-y-2">
            <div class="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-slate-800 leading-relaxed">
              <span class="font-bold text-purple-800 block mb-1">Analogi untuk Mahasiswa:</span>
              "${escapeHtml(item.analogy)}"
            </div>
            ${item.mediaUrl ? renderMediaAttachmentBlock(item.mediaType, item.mediaPreviewUrl || item.mediaUrl, item.mediaName) : ''}
          </div>
        </div>
      `;
    })
    .join('');
}
