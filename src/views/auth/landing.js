// src/views/auth/landing.js
// Halaman pembuka MODULAB dengan navigasi yang jelas.

export function renderLanding(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center border border-slate-100">
        <div class="mb-6 flex justify-center">
          <div class="relative">
            <img src="/images/modulab-logo.png" alt="Logo MODULAB" class="h-20 w-20 rounded-2xl object-cover shadow-md mx-auto">
            <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white shadow">v2.0</span>
          </div>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">MODULAB</h1>
        <p class="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
          Pusat Modul, Dokumentasi Praktikum, dan Asistensi Laboratorium
        </p>

        <div class="space-y-3.5">
          <a href="#/login" class="flex items-center justify-center w-full px-5 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition">
            <i class="fa-solid fa-user mr-2"></i> Masuk sebagai User
          </a>
          <a href="#/admin/login" class="flex items-center justify-center w-full px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow transition">
            <i class="fa-solid fa-shield-halved mr-2 text-amber-400"></i> Masuk sebagai Admin
          </a>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
          Belum punya akun?&nbsp;
          <a href="#/daftar" class="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2">
            Daftar akun baru
          </a>
        </div>
      </div>
    </div>
  `;
}

