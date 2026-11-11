import { state } from '../state.js';
import { escapeHtml, renderMediaAttachmentBlock } from '../lib/ui.js';

export function renderChecklist() {
  const container = document.getElementById('checklist-container');
  if (container) {
    if (state.checklist.length === 0) {
      container.innerHTML = `<div class="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-400">Daftar checklist kosong. Tambahkan poin persiapan di atas.</div>`;
    } else {
      container.innerHTML = state.checklist
        .map((item) => {
          const id = escapeHtml(item.id);
          return `
            <div class="flex items-center justify-between gap-2 p-3.5 rounded-xl border ${item.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'} hover:bg-slate-50 transition-all">
              <label class="flex items-start space-x-3 cursor-pointer flex-1">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleCheckItem('${id}')" class="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                <span class="text-xs sm:text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}">${escapeHtml(item.text)}</span>
              </label>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="viewContent('checklist', '${id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                  <i class="fa-solid fa-eye mr-1"></i>Lihat
                </button>
                <button type="button" onclick="editChecklistItem('${id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold transition">
                  Edit
                </button>
                <button type="button" onclick="deleteChecklistItem('${id}')" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1">
                  <i class="fa-solid fa-trash-can"></i> Hapus
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  const total = state.checklist.length;
  const done = state.checklist.filter((i) => i.checked).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const percentLabel = document.getElementById('checklist-percent-label');
  const mainBar = document.getElementById('checklist-main-bar');
  const sidebarBar = document.getElementById('sidebar-progress-bar');
  const sidebarText = document.getElementById('sidebar-progress-text');
  const statChecklist = document.getElementById('stat-checklist');

  if (percentLabel) percentLabel.textContent = `${percent}% Selesai (${done}/${total})`;
  if (mainBar) mainBar.style.width = `${percent}%`;
  if (sidebarBar) sidebarBar.style.width = `${percent}%`;
  if (sidebarText) sidebarText.textContent = `${percent}%`;
  if (statChecklist) statChecklist.textContent = `${percent}%`;
}

export function renderEvalLogs() {
  const container = document.getElementById('eval-history-list');
  if (!container) return;
  if (state.evalLogs.length === 0) {
    container.innerHTML = `<div class="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-400">Belum ada riwayat evaluasi pasca-praktikum.</div>`;
    return;
  }

  container.innerHTML = state.evalLogs
    .map((log) => {
      const id = escapeHtml(log.id);
      return `
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
          <div class="flex flex-wrap justify-between items-center gap-2">
            <div>
              <span class="font-bold text-slate-900 text-sm">${escapeHtml(log.session)}</span>
              <span class="block text-[11px] text-slate-400">${escapeHtml(log.date)}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="viewContent('evaluation', '${id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                <i class="fa-solid fa-eye mr-1"></i>Lihat
              </button>
              <button type="button" onclick="editEvaluationLog('${id}')" class="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 font-bold text-xs transition">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button type="button" onclick="deleteEvaluationLog('${id}')" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1">
                <i class="fa-solid fa-trash-can"></i> Hapus Evaluasi
              </button>
            </div>
          </div>
          <p class="text-slate-700"><strong>Kendala Instruksi:</strong> ${escapeHtml(log.confused)}</p>
          <p class="text-primary-700"><strong>Tindak Lanjut:</strong> ${escapeHtml(log.action)}</p>
          ${log.mediaUrl ? renderMediaAttachmentBlock(log.mediaType, log.mediaPreviewUrl || log.mediaUrl, log.mediaName) : ''}
        </div>
      `;
    })
    .join('');
}
