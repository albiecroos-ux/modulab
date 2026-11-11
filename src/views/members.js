import { state } from '../state.js';
import { escapeHtml, roleLabel } from '../lib/ui.js';

export function renderMembers() {
  const allowedContainer = document.getElementById('allowed-emails-list');
  if (allowedContainer) {
    if (state.allowedEmails.length === 0) {
      allowedContainer.innerHTML = `<p class="text-xs text-slate-500 italic">Belum ada email yang diizinkan. Tambahkan email anggota di atas.</p>`;
    } else {
      allowedContainer.innerHTML = state.allowedEmails
        .map((item) => {
          const email = item.email || '';
          return `
            <div class="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-800">${escapeHtml(email)}</p>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${item.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">${escapeHtml(item.role)}</span>
              </div>
              <button type="button" data-email="${escapeHtml(email)}" onclick="removeAllowedEmail(this.dataset.email)" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold">
                Hapus Akses
              </button>
            </div>
          `;
        })
        .join('');
    }
  }

  const membersContainer = document.getElementById('members-list');
  if (membersContainer) {
    if (state.members.length === 0) {
      membersContainer.innerHTML = `<p class="text-xs text-slate-500 italic">Belum ada akun terdaftar.</p>`;
    } else {
      membersContainer.innerHTML = state.members
        .map((member) => {
          const id = escapeHtml(member.id);
          return `
            <div class="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-800">${escapeHtml(member.email)}</p>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : member.role === 'member' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">${escapeHtml(roleLabel(member.role))}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <select id="role-select-${id}" class="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold bg-white">
                  <option value="member" ${member.role === 'member' ? 'selected' : ''}>Member</option>
                  <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                  <option value="pending" ${member.role === 'pending' ? 'selected' : ''}>Pending</option>
                </select>
                <button type="button" data-id="${id}" onclick="changeMemberRole(this.dataset.id)" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold">
                  Ubah Role
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }
}

export function renderImportSummary(summary) {
  const container = document.getElementById('import-summary');
  if (!container) return;
  if (!summary) {
    container.innerHTML = '';
    return;
  }

  const rows = [
    ['Modul', summary.modules.inserted, summary.modules.skipped],
    ['Langkah', summary.steps.inserted, 0],
    ['Lampiran', summary.attachments.inserted, 0],
    ['Troubleshooting', summary.troubleshooting.inserted, summary.troubleshooting.skipped],
    ['Glosarium', summary.glossary.inserted, summary.glossary.skipped],
    ['Checklist', summary.checklist.inserted, summary.checklist.skipped],
    ['Evaluasi', summary.evaluations.inserted, summary.evaluations.skipped]
  ];

  container.innerHTML = `
    <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 space-y-1.5">
      <p class="font-bold">Ringkasan impor (sumber: ${escapeHtml(summary.sources.join(', ') || '-')})</p>
      ${rows
        .map(
          ([label, inserted, skipped]) =>
            `<p>${escapeHtml(label)}: <strong>${inserted}</strong> ditambahkan${skipped ? `, ${skipped} dilewati (sudah ada)` : ''}</p>`
        )
        .join('')}
      <p>Media dipindahkan ke Storage: <strong>${summary.media.uploaded}</strong>, gagal: <strong>${summary.media.failed}</strong></p>
      ${summary.warnings.length
        ? `<details class="pt-1"><summary class="cursor-pointer font-semibold">${summary.warnings.length} peringatan</summary><ul class="mt-1 space-y-0.5 list-disc pl-4">${summary.warnings
            .map((w) => `<li>${escapeHtml(w)}</li>`)
            .join('')}</ul></details>`
        : ''}
    </div>
  `;
}
