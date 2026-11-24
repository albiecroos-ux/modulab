// src/views/auth/forgot.js
// Halaman permintaan tautan reset password.

import * as authService from '../../services/auth.js';

export function renderForgot(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
        <div class="mb-6 flex items-center gap-3">
          <a href="#/login" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <div>
            <h1 class="text-xl font-bold text-slate-800">Lupa Kata Sandi</h1>
            <p class="text-xs text-slate-500">Kirim tautan pemulihan ke email Anda</p>
          </div>
        </div>

        <form id="form-forgot-pwd" class="space-y-4">
          <div>
            <label for="forgot-email" class="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email Terdaftar</label>
            <input id="forgot-email" type="email" autocomplete="email" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="nama@email.com">
          </div>

          <div id="forgot-msg-box" class="hidden rounded-xl p-3 text-xs font-medium"></div>

          <button id="btn-submit-forgot" type="submit"
            class="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow transition flex items-center justify-center">
            <span id="forgot-btn-text">Kirim Tautan Reset</span>
            <i id="forgot-btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden ml-2"></i>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Ingat kata sandi? 
          <a href="#/login" class="font-bold text-primary-600 hover:underline">Kembali ke Login</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-forgot-pwd');
  const emailInput = container.querySelector('#forgot-email');
  const msgBox = container.querySelector('#forgot-msg-box');
  const submitBtn = container.querySelector('#btn-submit-forgot');
  const btnText = container.querySelector('#forgot-btn-text');
  const btnSpinner = container.querySelector('#forgot-btn-spinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgBox.classList.add('hidden');
    submitBtn.disabled = true;
    btnText.textContent = 'Mengirim…';
    btnSpinner.classList.remove('hidden');

    const email = emailInput.value.trim().toLowerCase();
    // Redirect ke root origin tanpa hash sesuai rekomendasi PRD Bagian 6
    const redirectTo = window.location.origin;

    try {
      await authService.resetPasswordForEmail(email, redirectTo);
      // Pesan selalu konsisten apa pun hasilnya untuk mencegah enumerasi email
      msgBox.className = 'rounded-xl p-3.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed';
      msgBox.textContent = 'Jika email terdaftar, tautan reset akan dikirim. Silakan periksa kotak masuk atau folder spam Anda.';
      msgBox.classList.remove('hidden');
      form.reset();
    } catch (err) {
      msgBox.className = 'rounded-xl p-3.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed';
      msgBox.textContent = 'Jika email terdaftar, tautan reset akan dikirim.';
      msgBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Kirim Tautan Reset';
      btnSpinner.classList.add('hidden');
    }
  });
}
