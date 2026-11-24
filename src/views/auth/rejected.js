// src/views/auth/rejected.js
// Layar pemberitahuan pendaftaran ditolak oleh admin.

import { sessionState, clearSession } from '../../lib/session.js';
import { navigate } from '../../lib/router.js';

export function renderRejected(container) {
  const reason = sessionState.profile?.rejection_reason;

  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-rose-100 text-center">
        <div class="mb-5 flex justify-center">
          <div class="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm">
            <i class="fa-solid fa-ban text-3xl"></i>
          </div>
        </div>

        <h1 class="text-xl font-bold text-slate-800">Pendaftaran Ditolak</h1>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          Mohon maaf, permintaan akses akun Anda ke portal laboratorium MODULAB belum disetujui oleh administrator.
        </p>

        ${reason ? `
          <div class="my-5 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-left">
            <div class="text-[11px] font-bold text-rose-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-exclamation"></i> Alasan Penolakan:
            </div>
            <p class="text-xs text-rose-900 leading-relaxed font-medium">${reason}</p>
          </div>
        ` : `
          <div class="my-5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Tidak ada keterangan alasan tambahan dari administrator.
          </div>
        `}

        <button id="btn-rejected-logout" type="button"
          class="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition">
          <i class="fa-solid fa-arrow-right-from-bracket mr-1.5"></i> Keluar
        </button>
      </div>
    </div>
  `;

  const logoutBtn = container.querySelector('#btn-rejected-logout');
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    await clearSession();
    navigate('#/');
  });
}
