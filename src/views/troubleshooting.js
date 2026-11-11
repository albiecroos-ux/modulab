import { state } from '../state.js';
import { escapeHtml, renderMediaAttachmentBlock } from '../lib/ui.js';

export function renderTroubleshooting() {
  const query = (document.getElementById('search-trouble')?.value || '').toLowerCase();
  const cat = document.getElementById('filter-trouble-cat')?.value || 'Semua';

  const filtered = state.troubleshooting.filter((item) => {
    const matchCat = cat === 'Semua' || item.category === cat;
    const matchQuery =
      item.symptom.toLowerCase().includes(query) ||
      item.cause.toLowerCase().includes(query) ||
      item.solution.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  const container = document.getElementById('troubleshooting-list');
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">Tidak ditemukan kasus yang sesuai.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const id = escapeHtml(item.id);
      return `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span class="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg text-[11px] font-bold">
                ${escapeHtml(item.category)}
              </span>
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="viewContent('troubleshooting', '${id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1">
                  <i class="fa-solid fa-eye"></i> Lihat
                </button>
                <button type="button" onclick="editTroubleshootingItem('${id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition flex items-center gap-1">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button type="button" onclick="deleteTroubleshootingItem('${id}')" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1">
                  <i class="fa-solid fa-trash-can"></i> Hapus Kasus
                </button>
              </div>
            </div>
            <h4 class="font-bold text-slate-800 text-sm leading-snug mb-3">
              <i class="fa-solid fa-triangle-exclamation text-rose-500 mr-1.5"></i>"${escapeHtml(item.symptom)}"
            </h4>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-3">
              <strong class="text-slate-700 block mb-0.5">Penyebab Utama:</strong>
              ${escapeHtml(item.cause)}
            </div>
          </div>
          <div class="space-y-2">
            <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs text-emerald-950">
              <strong class="text-emerald-800 flex items-center mb-1">
                <i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i>Cara Menjelaskan & Solusi Cepat:
              </strong>
              <p class="leading-relaxed">${escapeHtml(item.solution)}</p>
            </div>
            ${item.mediaUrl ? renderMediaAttachmentBlock(item.mediaType, item.mediaPreviewUrl || item.mediaUrl, item.mediaName) : ''}
          </div>
        </div>
      `;
    })
    .join('');
}
