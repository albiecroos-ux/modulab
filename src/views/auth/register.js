// src/views/auth/register.js
// Halaman pendaftaran user baru dengan meter kekuatan dan live check validasi aturan.

import * as authService from '../../services/auth.js';
import { validatePassword } from '../../lib/password.js';
import { navigate } from '../../lib/router.js';

export function renderRegister(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 py-8">
      <div class="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
        <div class="mb-6 flex items-center gap-3">
          <a href="#/" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <div>
            <h1 class="text-xl font-bold text-slate-800">Daftar Akun Baru</h1>
            <p class="text-xs text-slate-500">Akun akan aktif setelah disetujui oleh admin</p>
          </div>
        </div>

        <form id="form-register" class="space-y-4">
          <div>
            <label for="reg-fullname" class="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
            <input id="reg-fullname" type="text" autocomplete="name" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: Budi Santoso">
          </div>

          <div>
            <label for="reg-email" class="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email</label>
            <input id="reg-email" type="email" autocomplete="email" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="nama@email.com">
          </div>

          <div>
            <label for="reg-password" class="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
            <div class="relative">
              <input id="reg-password" type="password" autocomplete="new-password" required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Minimal 12 karakter kombinasi">
              <button type="button" id="btn-toggle-reg-pwd" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
            
            <!-- Meter Kekuatan Password -->
            <div class="mt-2.5">
              <div class="flex items-center justify-between text-[11px] mb-1">
                <span class="font-medium text-slate-500">Kekuatan Kata Sandi:</span>
                <span id="strength-label" class="font-bold text-slate-400">-</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                <div id="bar-1" class="h-full w-1/3 bg-slate-200 rounded-full transition-all duration-300"></div>
                <div id="bar-2" class="h-full w-1/3 bg-slate-200 rounded-full transition-all duration-300"></div>
                <div id="bar-3" class="h-full w-1/3 bg-slate-200 rounded-full transition-all duration-300"></div>
              </div>
            </div>

            <!-- Checklist Aturan Password Langsung -->
            <div id="rules-list" class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
            </div>
          </div>

          <div>
            <label for="reg-confirm-pwd" class="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Kata Sandi</label>
            <input id="reg-confirm-pwd" type="password" autocomplete="new-password" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ketik ulang kata sandi">
            <p id="confirm-pwd-msg" class="text-[11px] mt-1 text-rose-500 hidden"></p>
          </div>

          <div id="reg-error-msg" class="hidden rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium"></div>

          <button id="btn-submit-reg" type="submit" disabled
            class="w-full py-3 rounded-xl bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-primary-700 text-white font-bold text-sm shadow transition flex items-center justify-center">
            <span id="reg-btn-text">Daftar Akun</span>
            <i id="reg-btn-spinner" class="fa-solid fa-circle-notch fa-spin hidden ml-2"></i>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Sudah punya akun? 
          <a href="#/login" class="font-bold text-primary-600 hover:underline">Masuk</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-register');
  const nameInput = container.querySelector('#reg-fullname');
  const emailInput = container.querySelector('#reg-email');
  const pwdInput = container.querySelector('#reg-password');
  const confirmPwdInput = container.querySelector('#reg-confirm-pwd');
  const confirmMsg = container.querySelector('#confirm-pwd-msg');
  const btnToggle = container.querySelector('#btn-toggle-reg-pwd');
  const rulesContainer = container.querySelector('#rules-list');
  const strengthLabel = container.querySelector('#strength-label');
  const bar1 = container.querySelector('#bar-1');
  const bar2 = container.querySelector('#bar-2');
  const bar3 = container.querySelector('#bar-3');
  const errorBox = container.querySelector('#reg-error-msg');
  const submitBtn = container.querySelector('#btn-submit-reg');
  const btnText = container.querySelector('#reg-btn-text');
  const btnSpinner = container.querySelector('#reg-btn-spinner');

  btnToggle.addEventListener('click', () => {
    const isPwd = pwdInput.type === 'password';
    pwdInput.type = isPwd ? 'text' : 'password';
    btnToggle.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  function updateValidation() {
    const pwd = pwdInput.value;
    const confirm = confirmPwdInput.value;
    const email = emailInput.value;
    const fullName = nameInput.value;

    const validation = validatePassword(pwd, { email, fullName });

    // Render aturan
    rulesContainer.innerHTML = Object.entries(validation.rules).map(([key, rule]) => {
      const icon = rule.passed ? 'fa-check text-emerald-600 font-bold' : 'fa-xmark text-slate-400';
      const textColor = rule.passed ? 'text-emerald-800' : 'text-slate-500';
      return `
        <div class="flex items-center gap-1.5 ${textColor}">
          <i class="fa-solid ${icon} w-3.5"></i>
          <span>${rule.label}</span>
        </div>
      `;
    }).join('');

    // Meter kekuatan
    strengthLabel.textContent = pwd ? validation.strength : '-';
    bar1.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-slate-200';
    bar2.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-slate-200';
    bar3.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-slate-200';

    if (pwd) {
      if (validation.strength === 'Lemah') {
        strengthLabel.className = 'font-bold text-rose-500';
        bar1.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-rose-500';
      } else if (validation.strength === 'Sedang') {
        strengthLabel.className = 'font-bold text-amber-500';
        bar1.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-amber-500';
        bar2.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-amber-500';
      } else if (validation.strength === 'Kuat') {
        strengthLabel.className = 'font-bold text-emerald-500';
        bar1.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-emerald-500';
        bar2.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-emerald-500';
        bar3.className = 'h-full w-1/3 rounded-full transition-all duration-300 bg-emerald-500';
      }
    }

    // Cek kesamaan konfirmasi password
    let match = false;
    if (confirm) {
      if (pwd !== confirm) {
        confirmMsg.textContent = 'Konfirmasi kata sandi tidak cocok.';
        confirmMsg.classList.remove('hidden');
      } else {
        confirmMsg.classList.add('hidden');
        match = true;
      }
    } else {
      confirmMsg.classList.add('hidden');
    }

    // Tombol aktif HANYA bila semua aturan lolos & konfirmasi cocok & field nama/email terisi
    const canSubmit = validation.isValid && match && email.trim() && fullName.trim();
    submitBtn.disabled = !canSubmit;
  }

  pwdInput.addEventListener('input', updateValidation);
  confirmPwdInput.addEventListener('input', updateValidation);
  emailInput.addEventListener('input', updateValidation);
  nameInput.addEventListener('input', updateValidation);
  updateValidation();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    const email = emailInput.value.trim().toLowerCase();
    const fullName = nameInput.value.trim();
    const password = pwdInput.value;

    // Sesuai PRD Bagian 4 & 7: Email adminmodullab@ui.ac.id ditolak di form daftar
    if (email === 'adminmodullab@ui.ac.id') {
      errorBox.textContent = 'Email ini tidak bisa digunakan untuk mendaftar.';
      errorBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = 'Mendaftarkan…';
    btnSpinner.classList.remove('hidden');

    try {
      const { data, error } = await authService.signUp(email, password, fullName);
      if (error) {
        errorBox.textContent = error.message?.includes('already registered')
          ? 'Email ini sudah terdaftar. Silakan login.'
          : error.message || 'Gagal mendaftar. Silakan coba lagi.';
        errorBox.classList.remove('hidden');
        return;
      }

      // Jika pendaftaran berhasil dan langsung mendapat sesi
      if (data?.session) {
        navigate('#/menunggu');
        return;
      }

      // Jika pendaftaran berhasil tapi email memerlukan konfirmasi di Supabase Auth
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 py-8">
          <div class="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-slate-100 text-center space-y-4">
            <div class="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
              <i class="fa-solid fa-envelope-circle-check"></i>
            </div>
            <h1 class="text-xl font-bold text-slate-800">Pendaftaran Berhasil!</h1>
            <p class="text-xs text-slate-600 leading-relaxed">
              Akun Anda telah dibuat di sistem. Jika akun Anda belum langsung aktif, periksa email masuk untuk tautan konfirmasi, atau tunggu persetujuan dari Administrator.
            </p>
            <div class="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <a href="#/login" class="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition">
                Ke Halaman Masuk
              </a>
              <a href="#/" class="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition">
                Halaman Utama
              </a>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      errorBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Daftar Akun';
      btnSpinner.classList.add('hidden');
    }
  });
}

