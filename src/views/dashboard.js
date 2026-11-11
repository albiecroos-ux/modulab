import { state } from '../state.js';
import { escapeHtml } from '../lib/ui.js';

export function renderDashboard() {
  const statModul = document.getElementById('stat-modul');
  const statTrouble = document.getElementById('stat-troubleshooting');
  if (statModul) statModul.textContent = state.modules.length + ' Modul';
  if (statTrouble) statTrouble.textContent = state.troubleshooting.length + ' Kasus';

  const dashModContainer = document.getElementById('dashboard-module-list');
  if (dashModContainer) {
    if (state.modules.length === 0) {
      dashModContainer.innerHTML = `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">Belum ada modul praktikum tersimpan.</div>`;
    } else {
      dashModContainer.innerHTML = state.modules
        .map((m) => {
          const id = escapeHtml(m.id);
          return `
            <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white transition-all flex flex-wrap items-center justify-between gap-2">
              <div class="flex-1 min-w-[180px]">
                <h4 class="font-bold text-xs text-slate-800">${escapeHtml(m.title)}</h4>
                <span class="text-[11px] text-slate-500"><i class="fa-regular fa-clock mr-1"></i>${escapeHtml(m.duration)} • ${(m.steps || []).length} Langkah • ${(m.attachments || []).length} Lampiran</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="viewContent('module', '${id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                  <i class="fa-solid fa-eye mr-1"></i>Lihat
                </button>
                <button onclick="selectModuleById('${id}'); switchTab('modul');" class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition">
                  <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
                </button>
                <button onclick="deleteModuleById('${id}')" class="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition">
                  <i class="fa-solid fa-trash-can mr-1"></i>Hapus
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  const dashTroubleContainer = document.getElementById('dashboard-trouble-list');
  if (dashTroubleContainer) {
    if (state.troubleshooting.length === 0) {
      dashTroubleContainer.innerHTML = `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">Belum ada kasus troubleshooting.</div>`;
    } else {
      dashTroubleContainer.innerHTML = state.troubleshooting
        .slice(0, 4)
        .map((t) => {
          const id = escapeHtml(t.id);
          return `
            <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white transition-all flex flex-wrap items-center justify-between gap-2">
              <div class="flex-1 min-w-[180px]">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">${escapeHtml(t.category)}</span>
                <h4 class="font-bold text-xs text-slate-800 mt-1 line-clamp-1">${escapeHtml(t.symptom)}</h4>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="viewContent('troubleshooting', '${id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                  <i class="fa-solid fa-eye mr-1"></i>Lihat
                </button>
                <button onclick="switchTab('troubleshooting'); editTroubleshootingItem('${id}');" class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition">
                  <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
                </button>
                <button onclick="deleteTroubleshootingItem('${id}')" class="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition">
                  <i class="fa-solid fa-trash-can mr-1"></i>Hapus
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }
}
