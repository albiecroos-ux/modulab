// src/views/auth/reset.js
// Halaman pembuatan password baru dari tautan reset email.

import * as authService from '../../services/auth.js';
import { validatePassword } from '../../lib/password.js';
import { navigate } from '../../lib/router.js';
import { sessionState } from '../../lib/session.js';

export function renderReset(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
        <div class="mb-6">
          <h1 class="text-xl font-bold text-slate-800">Atur Ulang Kata Sandi</h1>
          <p class="text-xs text-slate-500 mt-1">Masukkan kata sandi baru yang memenuhi kriteria keamanan kuat</p>
        </div>

        <form id="form-reset-pwd" class="space-y-4">
          <div>
            <label for="new-password" class="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
            <div class="relative">
              <input id="new-password" type="password" autocomplete="new-password" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Minimal 12 karakter kombinasi">
              <button type="button" id="btn-toggle-reset-pwd" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
            
            <!-- Checklist Aturan Password Ringkas -->
            <div id="reset-rules-list" class="mt-2.5 space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            </div>
          </div>

          <div>
            <label for="confirm-new-password" class="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <input id="confirm-new-password" type="password" autocomplete="new-password" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ulangi kata sandi baru">
            <p id="confirm-match-error" class="text-[11px] mt-1 text-rose-500 hidden">Konfirmasi kata sandi tidak cocok.</p>
          </div>

          <div id="reset-error-msg" class="hidden rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium"></div>
          <div id="reset-success-msg" class="hidden rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium"></div>

          <button id="btn-submit-reset" type="submit" disabled
            class="w-full py-3 rounded-xl bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-primary-700 text-white font-bold text-sm shadow transition flex items-center justify-center">
            <span id="reset-btn-text">Simpan Kata Sandi Baru</span>
            <i id="reset-btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden ml-2"></i>
          </button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-reset-pwd');
  const pwdInput = container.querySelector('#new-password');
  const confirmInput = container.querySelector('#confirm-new-password');
  const matchError = container.querySelector('#confirm-match-error');
  const btnToggle = container.querySelector('#btn-toggle-reset-pwd');
  const rulesBox = container.querySelector('#reset-rules-list');
  const errorBox = container.querySelector('#reset-error-msg');
  const successBox = container.querySelector('#reset-success-msg');
  const submitBtn = container.querySelector('#btn-submit-reset');
  const btnText = container.querySelector('#reset-btn-text');
  const btnSpinner = container.querySelector('#reset-btn-spinner');

  btnToggle.addEventListener('click', () => {
    const isPwd = pwdInput.type === 'password';
    pwdInput.type = isPwd ? 'text' : 'password';
    btnToggle.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  function validate() {
    const pwd = pwdInput.value;
    const confirm = confirmInput.value;
    const email = sessionState.user?.email || '';

    const validation = validatePassword(pwd, { email });

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
        matchError.classList.remove('hidden');
      } else {
        matchError.classList.add('hidden');
        match = true;
      }
    } else {
      matchError.classList.add('hidden');
    }

    submitBtn.disabled = !(validation.isValid && match);
  }

  pwdInput.addEventListener('input', validate);
  confirmInput.addEventListener('input', validate);
  validate();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');
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

      successBox.textContent = 'Kata sandi berhasil diperbarui! Mengalihkan…';
      successBox.classList.remove('hidden');

      setTimeout(() => {
        navigate('#/app');
      }, 1500);
    } catch (err) {
      errorBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Simpan Kata Sandi Baru';
      btnSpinner.classList.add('hidden');
    }
  });
}

