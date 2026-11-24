// src/views/profile.js
// Halaman Profil pengguna dan ganti kata sandi mandiri.

import * as authService from '../services/auth.js';
import { sessionState, clearSession } from '../lib/session.js';
import { validatePassword } from '../lib/password.js';
import { navigate } from '../lib/router.js';
import { showToast, escapeHtml } from '../lib/ui.js';

export function renderProfile(container) {
  const profile = sessionState.profile || {};
  const user = sessionState.user || {};
  const role = profile.role || 'user';
  const roleDisplay = role === 'admin' ? 'Administrator' : 'User (Mahasiswa)';
  const roleBadgeClass = role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';

  container.innerHTML = `
    <div class="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="#/app" class="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Profil Saya</h1>
            <p class="text-xs text-slate-500">Kelola informasi akun dan keamanan kata sandi</p>
          </div>
        </div>
        <button id="btn-profile-logout" type="button"
          class="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Keluar
        </button>
      </div>

      <!-- Ringkasan Profil -->
      <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 class="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <i class="fa-solid fa-id-card text-primary-600"></i> Informasi Akun
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-1">Nama Lengkap</span>
            <span class="font-bold text-slate-800 text-sm">${escapeHtml(profile.full_name || 'Tidak ada nama')}</span>
          </div>
          <div>
            <span class="text-slate-400 block mb-1">Alamat Email</span>
            <span class="font-bold text-slate-800 text-sm">${escapeHtml(user.email || profile.email || '-')}</span>
          </div>
          <div>
            <span class="text-slate-400 block mb-1">Peran / Hak Akses</span>
            <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${roleBadgeClass}">
              ${roleDisplay}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block mb-1">Status Keanggotaan</span>
            <span class="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <i class="fa-solid fa-circle-check"></i> Aktif & Terverifikasi
            </span>
          </div>
        </div>
      </div>

      <!-- Ganti Kata Sandi -->
      <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 class="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <i class="fa-solid fa-key text-amber-500"></i> Ganti Kata Sandi
        </h2>
        
        <form id="form-change-password" class="space-y-4 max-w-lg">
          <div>
            <label for="prof-new-password" class="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
            <div class="relative">
              <input id="prof-new-password" type="password" autocomplete="new-password" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Minimal 12 karakter kombinasi">
              <button type="button" id="btn-toggle-prof-pwd" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
            
            <div id="prof-rules-box" class="mt-2.5 space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            </div>
          </div>

          <div>
            <label for="prof-confirm-password" class="block text-xs font-bold text-slate-700 mb-1.5">Ulangi Kata Sandi Baru</label>
            <input id="prof-confirm-password" type="password" autocomplete="new-password" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Konfirmasi kata sandi baru">
            <p id="prof-confirm-error" class="text-[11px] mt-1 text-rose-500 hidden">Konfirmasi kata sandi tidak cocok.</p>
          </div>

          <div id="prof-pwd-error" class="hidden rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium"></div>

          <button id="btn-submit-change-pwd" type="submit" disabled
            class="px-5 py-2.5 rounded-xl bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-primary-700 text-white font-bold text-xs shadow transition flex items-center gap-2">
            <span id="prof-btn-text">Perbarui Kata Sandi</span>
            <i id="prof-btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden"></i>
          </button>
        </form>
      </div>
    </div>
  `;

  // Listener logout dengan modal konfirmasi
  container.querySelector('#btn-profile-logout').addEventListener('click', () => {
    if (typeof window.signOut === 'function') {
      window.signOut();
    } else {
      clearSession().then(() => navigate('#/'));
    }
  });

  // Logika validasi dan ganti kata sandi
  const form = container.querySelector('#form-change-password');
  const pwdInput = container.querySelector('#prof-new-password');
  const confirmInput = container.querySelector('#prof-confirm-password');
  const confirmError = container.querySelector('#prof-confirm-error');
  const btnToggle = container.querySelector('#btn-toggle-prof-pwd');
  const rulesBox = container.querySelector('#prof-rules-box');
  const errorBox = container.querySelector('#prof-pwd-error');
  const submitBtn = container.querySelector('#btn-submit-change-pwd');
  const btnText = container.querySelector('#prof-btn-text');
  const btnSpinner = container.querySelector('#prof-btn-spinner');

  btnToggle.addEventListener('click', () => {
    const isPwd = pwdInput.type === 'password';
    pwdInput.type = isPwd ? 'text' : 'password';
    btnToggle.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  function validate() {
    const pwd = pwdInput.value;
    const confirm = confirmInput.value;
    const email = user.email || '';
    const fullName = profile.full_name || '';

    const validation = validatePassword(pwd, { email, fullName });

    rulesBox.innerHTML = Object.entries(validation.rules).slice(0, 5).map(([key, rule]) => {
      const icon = rule.passed ? 'fa-check text-emerald-600 font-bold' : 'fa-xmark text-slate-400';
      const textColor = rule.passed ? 'text-emerald-800' : 'text-slate-500';
      return `
        <div class="flex items-center gap-1.5 ${textColor}">
          <i class="fa-solid ${icon} w-3.5"></i>
          <span>${rule.label}</span>
        </div>
      `;
    }).join('');

    let match = false;
    if (confirm) {
      if (pwd !== confirm) {
        confirmError.classList.remove('hidden');
      } else {
        confirmError.classList.add('hidden');
        match = true;
      }
    } else {
      confirmError.classList.add('hidden');
    }

    submitBtn.disabled = !(validation.isValid && match);
  }

  pwdInput.addEventListener('input', validate);
  confirmInput.addEventListener('input', validate);
  validate();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    btnText.textContent = 'Menyimpan…';
    btnSpinner.classList.remove('hidden');

    try {
      const { data, error } = await authService.updateUserPassword(pwdInput.value);
      if (error) {
        errorBox.textContent = error.message || 'Gagal mengubah kata sandi.';
        errorBox.classList.remove('hidden');
        return;
      }

      showToast('Kata sandi berhasil diperbarui.');
      form.reset();
      validate();
    } catch (err) {
      errorBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Perbarui Kata Sandi';
      btnSpinner.classList.add('hidden');
    }
  });
}

