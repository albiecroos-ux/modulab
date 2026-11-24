// src/views/auth/login-user.js
// Halaman login untuk user (mahasiswa / praktikan) dengan proteksi peran.

import * as authService from '../../services/auth.js';
import { navigate } from '../../lib/router.js';
import { refreshProfile } from '../../lib/session.js';

export function renderLoginUser(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
        <div class="mb-6 flex items-center gap-3">
          <a href="#/" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <div>
            <h1 class="text-xl font-bold text-slate-800">Masuk sebagai User</h1>
            <p class="text-xs text-slate-500">Gunakan akun Anda yang telah terdaftar</p>
          </div>
        </div>

        <form id="form-login-user" class="space-y-4">
          <div>
            <label for="login-email" class="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email</label>
            <input id="login-email" type="email" autocomplete="email" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="nama@email.com">
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-password" class="block text-xs font-bold text-slate-700">Kata Sandi</label>
              <a href="#/lupa-password" class="text-xs font-medium text-primary-600 hover:underline">Lupa password?</a>
            </div>
            <div class="relative">
              <input id="login-password" type="password" autocomplete="current-password" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Masukkan kata sandi">
              <button type="button" id="btn-toggle-pwd" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="login-error-msg" class="hidden rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium"></div>

          <button id="btn-submit-login" type="submit"
            class="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow transition flex items-center justify-center">
            <span id="btn-text">Masuk</span>
            <i id="btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden ml-2"></i>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Belum punya akun? 
          <a href="#/daftar" class="font-bold text-primary-600 hover:underline">Daftar sekarang</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-login-user');
  const emailInput = container.querySelector('#login-email');
  const pwdInput = container.querySelector('#login-password');
  const btnToggle = container.querySelector('#btn-toggle-pwd');
  const errorBox = container.querySelector('#login-error-msg');
  const submitBtn = container.querySelector('#btn-submit-login');
  const btnText = container.querySelector('#btn-text');
  const btnSpinner = container.querySelector('#btn-spinner');

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
        errorBox.textContent = 'Email atau password salah.';
        errorBox.classList.remove('hidden');
        return;
      }

      // Ambil profil untuk evaluasi role
      const profile = await refreshProfile();
      if (!profile) {
        errorBox.textContent = 'Gagal memuat profil akun. Coba beberapa saat lagi.';
        errorBox.classList.remove('hidden');
        return;
      }

      // Sesuai aturan: jika role admin mencoba login di halaman user, batalkan sesi
      if (profile.role === 'admin') {
        await authService.signOut();
        errorBox.textContent = 'Gunakan halaman login admin.';
        errorBox.classList.remove('hidden');
        return;
      }

      if (profile.role === 'pending') {
        navigate('#/menunggu');
      } else if (profile.role === 'rejected') {
        navigate('#/ditolak');
      } else {
        navigate('#/app');
      }
    } catch (err) {
      errorBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Masuk';
      btnSpinner.classList.add('hidden');
    }
  });
}

