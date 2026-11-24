// src/views/auth/pending.js
// Layanan tampilan layar menunggu persetujuan admin dengan Realtime listener.

import { sessionState, clearSession } from '../../lib/session.js';
import { navigate } from '../../lib/router.js';

export function renderPending(container) {
  const email = sessionState.user?.email || sessionState.profile?.email || 'akun Anda';
  const name = sessionState.profile?.full_name || '';

  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100 text-center">
        <div class="mb-5 flex justify-center">
          <div class="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm animate-pulse">
            <i class="fa-solid fa-clock text-3xl"></i>
          </div>
        </div>

        <h1 class="text-xl font-bold text-slate-800">Menunggu Persetujuan Admin</h1>
        ${name ? `<p class="text-xs font-bold text-slate-600 mt-1">Halo, ${name}</p>` : ''}
        
        <p class="text-xs text-slate-500 mt-2.5 leading-relaxed">
          Akun dengan email <span class="font-semibold text-slate-700">${email}</span> telah terdaftar.
          Akses modul dan data praktikum akan terbuka secara otomatis segera setelah disetujui oleh pengelola laboratorium.
        </p>

        <div class="my-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-[11px] text-slate-600">
          <div class="flex items-center gap-2 text-primary-700 font-semibold">
            <i class="fa-solid fa-circle-info"></i>
            <span>Status Akun: Menunggu Konfirmasi (Pending)</span>
          </div>
          <p class="text-slate-500">
            Halaman ini akan berpindah secara otomatis tanpa perlu memuat ulang browser ketika admin menyetujui akun Anda.
          </p>
        </div>

        <button id="btn-pending-logout" type="button"
          class="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition">
          <i class="fa-solid fa-arrow-right-from-bracket mr-1.5"></i> Keluar
        </button>
      </div>
    </div>
  `;

  const logoutBtn = container.querySelector('#btn-pending-logout');
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    await clearSession();
    navigate('#/');
  });
}
