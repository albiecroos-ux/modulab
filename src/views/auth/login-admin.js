// src/views/auth/login-admin.js
// Halaman login khusus admin (adminmodullab@ui.ac.id) dengan tampilan berbeda.

import * as authService from '../../services/auth.js';
import { navigate } from '../../lib/router.js';
import { refreshProfile } from '../../lib/session.js';

export function renderLoginAdmin(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-slate-900 p-8 shadow-2xl border border-slate-800 text-white">
        <div class="mb-6 flex items-center justify-between">
          <a href="#/" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-sm">
            <i class="fa-solid fa-shield-halved text-xs"></i> ADMINISTRATOR
          </span>
        </div>

        <div class="mb-6">
          <h1 class="text-xl font-bold tracking-tight">Login Portal Admin</h1>
          <p class="text-xs text-slate-400 mt-1">Hanya untuk pengelola resmi laboratorium MODULAB</p>
        </div>

        <form id="form-login-admin" class="space-y-4">
          <div>
            <label for="admin-email" class="block text-xs font-bold text-slate-300 mb-1.5">Email Administrator</label>
            <input id="admin-email" type="email" autocomplete="email" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="adminmodullab@ui.ac.id">
          </div>

          <div>
            <label for="admin-password" class="block text-xs font-bold text-slate-300 mb-1.5">Kata Sandi</label>
            <div class="relative">
              <input id="admin-password" type="password" autocomplete="current-password" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"
                placeholder="Masukkan kata sandi">
              <button type="button" id="btn-toggle-admin-pwd" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 text-sm">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="admin-error-msg" class="hidden rounded-xl bg-rose-950/50 border border-rose-800 p-3 text-xs text-rose-300 font-medium"></div>

          <button id="btn-submit-admin" type="submit"
            class="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow transition flex items-center justify-center">
            <span id="admin-btn-text">Masuk Admin</span>
            <i id="admin-btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden ml-2"></i>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          Kembali ke 
          <a href="#/login" class="font-bold text-amber-400 hover:underline">Login User</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-login-admin');
  const emailInput = container.querySelector('#admin-email');
  const pwdInput = container.querySelector('#admin-password');
  const btnToggle = container.querySelector('#btn-toggle-admin-pwd');
  const errorBox = container.querySelector('#admin-error-msg');
  const submitBtn = container.querySelector('#btn-submit-admin');
  const btnText = container.querySelector('#admin-btn-text');
  const btnSpinner = container.querySelector('#admin-btn-spinner');

  btnToggle.addEventListener('click', () => {
    const isPwd = pwdInput.type === 'password';
    pwdInput.type = isPwd ? 'text' : 'password';
    btnToggle.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
    submitBtn.disabled = true;
    btnText.textContent = 'Memverifikasi…';
    btnSpinner.classList.remove('hidden');

    const email = emailInput.value.trim().toLowerCase();
    const password = pwdInput.value;

    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          errorBox.textContent = 'Email admin belum dikonfirmasi. Periksa kotak masuk email atau matikan "Confirm Email" di dashboard Supabase Auth.';
        } else {
          errorBox.textContent = 'Email atau password salah.';
        }
        errorBox.classList.remove('hidden');
        return;
      }

      const profile = await refreshProfile();
      // Aturan: Jika bukan admin, panggil signOut dan tampilkan pesan generik "Email atau password salah."
      if (!profile || profile.role !== 'admin') {
        await authService.signOut();
        errorBox.textContent = 'Email atau password salah.';
        errorBox.classList.remove('hidden');
        return;
      }

      navigate('#/app');
    } catch (err) {
      errorBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Masuk Admin';
      btnSpinner.classList.add('hidden');
    }
  });
}

