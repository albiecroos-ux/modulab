import { supabase, isSupabaseConfigured } from './lib/supabase.js';
import { getHashPath, navigate, onRoute } from './lib/router.js';
import { sessionState, initSession, clearSession, onSessionChange, refreshProfile } from './lib/session.js';
import { checkRouteAccess } from './lib/guard.js';
import { renderLanding } from './views/auth/landing.js';
import { renderLoginUser } from './views/auth/login-user.js';
import { renderLoginAdmin } from './views/auth/login-admin.js';
import { renderRegister } from './views/auth/register.js';
import { renderForgot } from './views/auth/forgot.js';
import { renderReset } from './views/auth/reset.js';
import { renderPending } from './views/auth/pending.js';
import { renderRejected } from './views/auth/rejected.js';
import { renderProfile } from './views/profile.js';
import { renderMembersView, cleanupMembersRealtime } from './views/admin/members.js';
import {
  parseYoutubeEmbed,
  isSafeHttpUrl,
  showToast,
  setSyncStatus,
  setAuthMessage,
  switchTab,
  toggleMobileMenu,
  undoLastDelete,
  setUndoAction,
  roleLabel,
  escapeHtml,
  renderMediaAttachmentBlock,
  formatListText
} from './lib/ui.js';
import * as authService from './services/auth.js';
import * as modulesService from './services/modules.js';
import * as troubleService from './services/troubleshooting.js';
import * as glossaryService from './services/glossary.js';
import * as checklistService from './services/checklist.js';
import * as evalService from './services/evaluations.js';
import * as storageService from './services/storage.js';
import * as membersService from './services/members.js';
import { importLegacyData as runLegacyImport } from './services/importLegacy.js';
import { state, resetContentState, getActiveModule } from './state.js';
import { renderDashboard } from './views/dashboard.js';
import {
  renderSavedModulesBar,
  renderModuleAttachmentsList,
  renderModuleStepsList,
  updateLivePreview,
  copyModuleText,
  renderModuleTab
} from './views/modules.js';
import { renderTroubleshooting } from './views/troubleshooting.js';
import { renderChecklist, renderEvalLogs } from './views/checklist.js';
import { renderMembers, renderImportSummary } from './views/members.js';
import { defaultInitialData } from './data/defaults.js';

let authMode = 'signin';
let realtimeChannel = null;
let realtimeTimer = null;
let realtimePending = false;

let tempTroubleMedia = emptyMedia();
let tempEvalMedia = emptyMedia();

const saveTimers = new Map();

function emptyMedia() {
  return { mediaName: '', mediaType: '', mediaUrl: '', mediaPreviewUrl: '' };
}

function scheduleSave(key, fn, wait = 500) {
  const previous = saveTimers.get(key);
  if (previous) clearTimeout(previous);
  saveTimers.set(
    key,
    setTimeout(async () => {
      saveTimers.delete(key);
      try {
        await fn();
      } catch (error) {
        reportError('Gagal menyimpan perubahan', error);
      }
    }, wait)
  );
}

function throwIfError(result, context) {
  if (result?.error) throw result.error;
  return result?.data;
}

function reportError(context, error) {
  console.error(context, error);
  const msg = error?.message || String(error);
  if (msg.includes('row-level security') || msg.includes('policy') || msg.includes('permission denied')) {
    showToast('Kamu hanya punya akses lihat.');
  } else {
    showToast(`${context}: ${msg}`);
  }
  setSyncStatus(context, true);
}

function ensureAdmin() {
  const role = sessionState.role || state.profile?.role;
  if (role !== 'admin') {
    showToast('Kamu hanya punya akses lihat.');
    return false;
  }
  return true;
}

async function runWithStatus(action, context) {
  setSyncStatus('Menyimpan…');
  try {
    const result = await action();
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      throw result.error;
    }
    setSyncStatus('Tersimpan');
    return result;
  } catch (error) {
    reportError(context, error);
    return null;
  }
}

async function previewFor(mediaUrl) {
  return storageService.resolveMediaUrl(mediaUrl);
}

function detailField(label, value) {
  return `
    <div>
      <h3 class="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">${escapeHtml(label)}</h3>
      <p class="whitespace-pre-wrap leading-relaxed text-slate-800">${escapeHtml(formatListText(value || '-'))}</p>
    </div>
  `;
}

function viewContent(type, id) {
  const collections = {
    module: state.modules,
    troubleshooting: state.troubleshooting,
    checklist: state.checklist,
    evaluation: state.evalLogs
  };
  const item = collections[type]?.find((entry) => entry.id === id);
  if (!item) {
    showToast('Data yang ingin dilihat tidak ditemukan.');
    return;
  }

  let title = '';
  let content = '';
  if (type === 'module') {
    title = item.title || 'Detail Modul';
    const tools = (item.tools || '')
      .split(',')
      .map((tool) => tool.trim())
      .filter(Boolean);
    content = `
      ${detailField('Estimasi waktu', item.duration)}
      ${detailField('Tujuan praktikum', item.goal)}
      ${detailField('Alat dan Bahan', tools.join(', '))}
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">Langkah kerja</h3>
        ${(item.steps || []).length
        ? item.steps.map((step, index) => `
            <div class="rounded-xl border border-slate-200 bg-white/80 p-3">
              <p class="font-semibold text-slate-800 whitespace-pre-line">${index + 1}. ${escapeHtml(formatListText(step.instruction || '(Instruksi belum diisi)'))}</p>
              ${step.tip ? `<p class="mt-2 text-xs text-amber-900 whitespace-pre-line"><strong>Tips:</strong> ${escapeHtml(formatListText(step.tip))}</p>` : ''}
              ${step.mediaUrl ? renderMediaAttachmentBlock(step.mediaType, step.mediaPreviewUrl || step.mediaUrl, step.mediaName) : ''}
            </div>
          `).join('')
        : '<p class="text-slate-500">Belum ada langkah kerja.</p>'}
      </section>
      ${(item.attachments || []).length
        ? `<section class="space-y-2"><h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">Lampiran</h3>${item.attachments.map((attachment) => renderMediaAttachmentBlock(attachment.type, attachment.previewUrl || attachment.url, attachment.name)).join('')}</section>`
        : ''}
    `;
  } else if (type === 'troubleshooting') {
    title = item.symptom || 'Detail Troubleshooting';
    content = `
      ${detailField('Kategori', item.category)}
      ${detailField('Gejala / keluhan', item.symptom)}
      ${detailField('Penyebab utama', item.cause)}
      ${detailField('Solusi', item.solution)}
      ${item.mediaUrl ? renderMediaAttachmentBlock(item.mediaType, item.mediaPreviewUrl || item.mediaUrl, item.mediaName) : ''}
    `;
  } else if (type === 'checklist') {
    title = 'Detail Checklist';
    content = `
      ${detailField('Poin persiapan', item.text)}
      ${detailField('Status', item.checked ? 'Selesai' : 'Belum selesai')}
    `;
  } else {
    title = item.session || 'Detail Evaluasi';
    content = `
      ${detailField('Sesi / nama modul', item.session)}
      ${detailField('Tanggal', item.date)}
      ${detailField('Instruksi yang membingungkan', item.confused)}
      ${detailField('Rencana tindak lanjut', item.action)}
      ${item.mediaUrl ? renderMediaAttachmentBlock(item.mediaType, item.mediaPreviewUrl || item.mediaUrl, item.mediaName) : ''}
    `;
  }

  document.getElementById('detail-modal-title').textContent = title;
  document.getElementById('detail-modal-content').innerHTML = content;
  document.getElementById('detail-modal').classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.getElementById('detail-modal-close')?.focus();
}

function closeDetailModal() {
  document.getElementById('detail-modal')?.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadModules() {
  const modules = throwIfError(await modulesService.listModules(), 'memuat modul');
  await storageService.hydrateModules(modules);
  state.modules = modules;
  if (!state.modules.some((m) => m.id === state.activeModuleId)) {
    state.activeModuleId = state.modules[0]?.id || null;
  }
}

async function loadTroubleshooting() {
  const cases = throwIfError(await troubleService.listCases(), 'memuat troubleshooting');
  await storageService.hydrateList(cases);
  state.troubleshooting = cases;
}

async function loadGlossary() {
  const terms = throwIfError(await glossaryService.listTerms(), 'memuat glosarium');
  await storageService.hydrateList(terms);
  state.analogies = terms;
}

async function loadChecklist() {
  state.checklist = throwIfError(await checklistService.listItems(), 'memuat checklist');
}

async function loadEvaluations() {
  const logs = throwIfError(await evalService.listLogs(), 'memuat evaluasi');
  await storageService.hydrateList(logs);
  state.evalLogs = logs;
}

async function loadMembers() {
  if (state.profile?.role !== 'admin') return;
  const [members, allowed] = await Promise.all([
    membersService.listMembers(),
    membersService.listAllowedEmails()
  ]);
  state.members = throwIfError(members, 'memuat anggota');
  state.allowedEmails = throwIfError(allowed, 'memuat daftar akses');
}

async function refreshAll({ render = true } = {}) {
  await Promise.all([
    loadModules(),
    loadTroubleshooting(),
    loadGlossary(),
    loadChecklist(),
    loadEvaluations(),
    loadMembers()
  ]);
  if (render) renderAllViews();
}

function renderAllViews() {
  renderModuleTab();
  renderTroubleshooting();
  renderChecklist();
  renderEvalLogs();
  renderDashboard();
  if (state.profile?.role === 'admin') renderMembers();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function updateAuthMode() {
  const isSignUp = authMode === 'signup';
  const submit = document.getElementById('auth-submit');
  const password = document.getElementById('auth-password');
  const toggle = document.getElementById('auth-toggle-mode');
  if (submit) submit.textContent = isSignUp ? 'Buat akun' : 'Masuk';
  if (password) password.autocomplete = isSignUp ? 'new-password' : 'current-password';
  if (toggle) {
    toggle.textContent = isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
  }
  setAuthMessage('');
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    setAuthMessage('Konfigurasi Supabase belum tersedia.', true);
    return;
  }
  const submitButton = document.getElementById('auth-submit');
  submitButton.disabled = true;
  setAuthMessage('');
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  try {
    const result =
      authMode === 'signup'
        ? await authService.signUp(email, password)
        : await authService.signIn(email, password);
    if (result.error) {
      setAuthMessage(result.error.message, true);
      return;
    }

    const session = authMode === 'signup' ? result.data.session : result.data.session;
    if (session?.user) {
      await boot(session.user);
    } else {
      setAuthMessage(
        'Akun berhasil dibuat. Bila email verifikasi aktif, cek email lalu masuk. Setelah itu tunggu persetujuan admin.',
        false
      );
    }
  } catch (error) {
    setAuthMessage(`Autentikasi gagal: ${error.message || 'Periksa koneksi Supabase.'}`, true);
  } finally {
    submitButton.disabled = false;
  }
}

function applyRoleVisibility() {
  const role = sessionState.role || state.profile?.role;
  const isAdmin = role === 'admin';
  document.body.classList.toggle('is-readonly', !isAdmin);
  const navMembers = document.getElementById('nav-members');
  const resetButton = document.getElementById('btn-reset-default');
  if (navMembers) navMembers.style.display = isAdmin ? '' : 'none';
  if (resetButton) resetButton.style.display = isAdmin ? '' : 'none';
}

function handleSwitchTab(tabId) {
  const role = sessionState.role || state.profile?.role;
  if (tabId === 'members') {
    if (role !== 'admin') {
      showToast('Kamu hanya punya akses lihat.');
      switchTab('dashboard');
      return;
    }
    const container = document.getElementById('tab-members');
    if (container) renderMembersView(container);
  } else {
    cleanupMembersRealtime();
  }
  switchTab(tabId);
}

let isRenderingRoute = false;
let isBooting = false;
let isBooted = false;

function renderRoute(path) {
  if (isRenderingRoute) return;
  isRenderingRoute = true;
  try {
    const normalizedPath = path || getHashPath();
    const authRoot = document.getElementById('auth-root');
    const profileRoot = document.getElementById('profile-root');
    const appShell = document.getElementById('app-shell');

    const access = checkRouteAccess(normalizedPath);

    if (access.loading) {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        const errorMessage = sessionState.error?.message;
        authRoot.innerHTML = errorMessage || (sessionState.session && !sessionState.role)
          ? `
            <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
              <div class="max-w-md rounded-2xl bg-slate-800 p-6 text-center space-y-3">
                <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400"></i>
                <p class="font-semibold">Sesi atau profil akun gagal dimuat.</p>
                <p class="text-xs text-slate-300">Periksa koneksi dan skema database Supabase, lalu coba lagi.</p>
                ${errorMessage ? `<p class="text-xs text-rose-300 break-words">${escapeHtml(errorMessage)}</p>` : ''}
                <div class="pt-2 flex justify-center gap-2">
                  <button id="btn-session-retry" type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold hover:bg-primary-500">Coba lagi</button>
                  <button id="btn-session-signout" type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600">Keluar</button>
                </div>
              </div>
            </div>
          `
          : `
            <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
              <div class="text-center space-y-3">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl text-primary-500"></i>
                <p class="text-xs text-slate-400">Memuat MODULAB…</p>
              </div>
            </div>
          `;
        authRoot.querySelector('#btn-session-retry')?.addEventListener('click', () => window.location.reload());
        authRoot.querySelector('#btn-session-signout')?.addEventListener('click', () => signOut());
      }
      if (profileRoot) profileRoot.classList.add('hidden');
      if (appShell) appShell.classList.add('hidden');
      return;
    }

    if (access.redirect && access.redirect !== normalizedPath) {
      navigate(access.redirect);
      return;
    }

    if (authRoot) authRoot.classList.add('hidden');
    if (profileRoot) profileRoot.classList.add('hidden');
    if (appShell) appShell.classList.add('hidden');

    if (normalizedPath === '#/' || normalizedPath === '') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderLanding(authRoot);
      }
    } else if (normalizedPath === '#/login') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderLoginUser(authRoot);
      }
    } else if (normalizedPath === '#/admin/login') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderLoginAdmin(authRoot);
      }
    } else if (normalizedPath === '#/daftar') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderRegister(authRoot);
      }
    } else if (normalizedPath === '#/lupa-password') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderForgot(authRoot);
      }
    } else if (normalizedPath === '#/reset-password') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderReset(authRoot);
      }
    } else if (normalizedPath === '#/menunggu') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderPending(authRoot);
      }
    } else if (normalizedPath === '#/ditolak') {
      if (authRoot) {
        authRoot.classList.remove('hidden');
        renderRejected(authRoot);
      }
    } else if (normalizedPath === '#/profil') {
      if (profileRoot) {
        profileRoot.classList.remove('hidden');
        renderProfile(profileRoot);
      }
    } else {
      // #/app
      if (appShell) appShell.classList.remove('hidden');
      applyRoleVisibility();
      const accountEmail = document.getElementById('account-email');
      const accountRole = document.getElementById('account-role');
      if (accountEmail) accountEmail.textContent = sessionState.user?.email || '';
      if (accountRole) accountRole.textContent = roleLabel(sessionState.role);

      if (sessionState.user && !isBooted && !isBooting) {
        boot(sessionState.user);
      }
    }
  } finally {
    isRenderingRoute = false;
  }
}

async function boot(user) {
  if (isBooting || isBooted) return;
  isBooting = true;
  try {
    state.user = user;
    setSyncStatus('Memuat profil…');
    const profileRes = await authService.getProfile(user.id);
    const profile = profileRes?.data;

    if (!profile) {
      await authService.signOut();
      state.user = null;
      isBooted = false;
      navigate('#/');
      return;
    }

    state.profile = profile;
    const accountEmail = document.getElementById('account-email');
    const accountRole = document.getElementById('account-role');
    if (accountEmail) accountEmail.textContent = user.email || '';
    if (accountRole) accountRole.textContent = roleLabel(profile.role);

    if (profile.role === 'pending') {
      navigate('#/menunggu');
      return;
    }
    if (profile.role === 'rejected') {
      navigate('#/ditolak');
      return;
    }

    applyRoleVisibility();
    switchTab('dashboard');
    setSyncStatus('Memuat data…');

    try {
      await refreshAll();
      setupRealtime();
      isBooted = true;
      setSyncStatus('Tersambung ke cloud');
    } catch (err) {
      reportError('Gagal memuat data awal', err);
    }
  } finally {
    isBooting = false;
  }
}

function handleSignedOut() {
  isBooted = false;
  isBooting = false;
  state.user = null;
  state.profile = null;
  resetContentState();
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  applyRoleVisibility();
  const accountEmail = document.getElementById('account-email');
  if (accountEmail) accountEmail.textContent = '';
  const accountRole = document.getElementById('account-role');
  if (accountRole) accountRole.textContent = '';
  setSyncStatus('Belum tersambung');
  navigate('#/');
}

function showSignOutModal() {
  const existingModal = document.getElementById('modal-signout-confirm');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-signout-confirm';
  modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200';
  modal.innerHTML = `
    <div class="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-center transform transition-all scale-100">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
        <i class="fa-solid fa-arrow-right-from-bracket text-2xl"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-800">Konfirmasi Keluar</h3>
      <p class="mt-1.5 text-xs text-slate-500 leading-relaxed">
        Apakah Anda yakin ingin keluar dari akun MODULAB? Anda harus masuk kembali untuk mengakses modul praktikum.
      </p>
      <div class="mt-6 flex items-center gap-3">
        <button id="btn-cancel-signout" type="button"
          class="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition">
          Batal
        </button>
        <button id="btn-confirm-signout" type="button"
          class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Ya, Keluar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector('#btn-cancel-signout').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#btn-confirm-signout').addEventListener('click', async () => {
    closeModal();
    await performSignOut();
  });
}

async function performSignOut() {
  try {
    await clearSession();
  } catch (error) {
    showToast(`Gagal keluar: ${error.message || 'Periksa koneksi Supabase.'}`);
  }
  handleSignedOut();
}

async function signOut() {
  showSignOutModal();
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------
function isEditingContent() {
  const el = document.activeElement;
  if (!el) return false;
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return false;
  return Boolean(
    el.closest('#tab-modul, #form-add-trouble, #tab-checklist, #tab-members')
  );
}

const REALTIME_TABLES = new Set([
  'modules',
  'module_steps',
  'module_attachments',
  'troubleshooting_cases',
  'glossary_terms',
  'checklist_items',
  'eval_logs'
]);

function setupRealtime() {
  if (!supabase || realtimeChannel) return;
  let channel = supabase.channel('labassist-content');
  for (const table of REALTIME_TABLES) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => scheduleRealtimeRefresh()
    );
  }
  realtimeChannel = channel.subscribe();
}

function scheduleRealtimeRefresh() {
  if (realtimeTimer) clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(async () => {
    if (isEditingContent() || saveTimers.size > 0) {
      realtimePending = true;
      if (!isEditingContent()) scheduleRealtimeRefresh();
      return;
    }
    if (!state.user || state.profile?.role === 'pending') return;
    try {
      await refreshAll();
      setSyncStatus('Diperbarui pengguna lain');
      showToast('Data terbaru dari pengguna lain telah dimuat.');
    } catch (error) {
      reportError('Gagal memuat pembaruan realtime', error);
    }
  }, 650);
}

document.addEventListener('focusout', () => {
  if (!realtimePending) return;
  setTimeout(async () => {
    if (isEditingContent()) return;
    if (saveTimers.size > 0) {
      setTimeout(() => {
        if (realtimePending) scheduleRealtimeRefresh();
      }, 300);
      return;
    }
    realtimePending = false;
    try {
      await refreshAll();
      setSyncStatus('Diperbarui pengguna lain');
    } catch (error) {
      reportError('Gagal memuat pembaruan realtime', error);
    }
  }, 400);
});

// ---------------------------------------------------------------------------
// Module builder
// ---------------------------------------------------------------------------
async function createNewModule() {
  if (!ensureAdmin()) return;
  const created = await runWithStatus(async () => {
    const id = throwIfError(
      await modulesService.createModule({
        title: 'Modul Praktikum Baru',
        duration: '60 Menit',
        goal: 'Tuliskan tujuan praktikum yang mudah dipahami mahasiswa.',
        tools: 'Komputer Lab, Software Praktikum'
      }),
      'membuat modul'
    );
    throwIfError(
      await modulesService.addStep(id, {
        position: 0,
        instruction: 'Tulis langkah pertama praktikum di sini...',
        tip: 'Tambahkan tips agar mahasiswa tidak bingung atau salah langkah.'
      }),
      'menambah langkah'
    );
    state.activeModuleId = id;
    await loadModules();
    renderModuleTab();
    renderDashboard();
    return id;
  }, 'Gagal membuat modul');
  if (created) showToast('Modul baru berhasil dibuat dan siap diedit!');
}

function selectModuleById(id) {
  state.activeModuleId = id;
  renderModuleTab();
}

async function deleteModuleById(id) {
  if (!ensureAdmin()) return;
  const target = state.modules.find((m) => m.id === id);
  if (!target) return;
  const snapshot = JSON.parse(JSON.stringify(target));
  const deleted = await runWithStatus(
    () => modulesService.deleteModule(id),
    'Gagal menghapus modul'
  );
  if (!deleted) return;

  state.modules = state.modules.filter((m) => m.id !== id);
  if (state.activeModuleId === id) {
    state.activeModuleId = state.modules[0]?.id || null;
  }
  renderModuleTab();
  renderDashboard();
  setUndoAction(async () => {
    throwIfError(await modulesService.restoreModule(snapshot), 'restore modul');
    await loadModules();
    renderModuleTab();
    renderDashboard();
  });
  showToast(`Modul "${target.title}" telah dihapus.`, true);
}

function deleteActiveModule() {
  const active = getActiveModule();
  if (!active) {
    showToast('Tidak ada modul aktif untuk dihapus.');
    return;
  }
  deleteModuleById(active.id);
}

function syncActiveModuleFromForm() {
  if (!ensureAdmin()) return;
  let mod = getActiveModule();
  if (!mod) {
    createNewModule().then(() => syncActiveModuleFromForm());
    return;
  }
  mod.title = document.getElementById('mod-title').value;
  mod.duration = document.getElementById('mod-duration').value;
  mod.goal = document.getElementById('mod-goal').value;
  mod.tools = document.getElementById('mod-tools').value;

  renderSavedModulesBar();
  updateLivePreview();
  scheduleSave(`module:${mod.id}`, () => modulesService.updateModule(mod.id, {
    title: mod.title,
    duration: mod.duration,
    goal: mod.goal,
    tools: mod.tools
  }));
}

async function saveCurrentModule() {
  if (!ensureAdmin()) return;
  const mod = getActiveModule();
  if (!mod) {
    await createNewModule();
    return;
  }
  mod.title = document.getElementById('mod-title').value;
  mod.duration = document.getElementById('mod-duration').value;
  mod.goal = document.getElementById('mod-goal').value;
  mod.tools = document.getElementById('mod-tools').value;
  const timer = saveTimers.get(`module:${mod.id}`);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(`module:${mod.id}`);
  }
  await runWithStatus(
    () =>
      modulesService.updateModule(mod.id, {
        title: mod.title,
        duration: mod.duration,
        goal: mod.goal,
        tools: mod.tools
      }),
    'Gagal menyimpan modul'
  );
  renderSavedModulesBar();
  updateLivePreview();
  showToast('Modul praktikum beserta lampirannya berhasil disimpan!');
}

async function handleModuleFilesUpload(event) {
  if (!ensureAdmin()) return;
  let mod = getActiveModule();
  if (!mod) {
    await createNewModule();
    mod = getActiveModule();
  }
  if (!mod) {
    event.target.value = '';
    return;
  }
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (files.length === 0) return;

  setSyncStatus('Mengunggah media…');
  let uploaded = 0;
  for (const file of files) {
    try {
      const result = await storageService.uploadMedia(file, state.user.id);
      if (result.error) throw result.error;
      const position = mod.attachments.length;
      const id = throwIfError(
        await modulesService.addAttachment(mod.id, {
          position,
          name: file.name,
          type: result.data.type,
          url: result.data.path,
          size: result.data.size
        }),
        'menambah lampiran'
      );
      mod.attachments.push({
        id,
        position,
        name: file.name,
        type: result.data.type,
        url: result.data.path,
        size: result.data.size,
        previewUrl: await previewFor(result.data.path)
      });
      uploaded += 1;
    } catch (error) {
      showToast(`Gagal mengunggah "${file.name}": ${error.message || error}`);
    }
  }
  renderModuleAttachmentsList();
  updateLivePreview();
  setSyncStatus(uploaded ? 'Tersimpan' : 'Gagal mengunggah media', uploaded === 0);
  if (uploaded > 0) showToast(`${uploaded} lampiran berhasil ditambahkan!`);
}

async function addModuleLinkAttachment() {
  if (!ensureAdmin()) return;
  const urlInput = document.getElementById('mod-attachment-url');
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) {
    showToast('Masukkan URL YouTube atau link file terlebih dahulu!');
    return;
  }
  if (!isSafeHttpUrl(rawUrl)) {
    showToast('URL harus diawali http:// atau https://');
    return;
  }

  let mod = getActiveModule();
  if (!mod) {
    await createNewModule();
    mod = getActiveModule();
  }
  if (!mod) return;

  const ytEmbed = parseYoutubeEmbed(rawUrl);
  const payload = ytEmbed
    ? {
      name: 'Video Tutorial YouTube (' + rawUrl + ')',
      type: 'youtube',
      url: ytEmbed
    }
    : { name: rawUrl, type: 'link', url: rawUrl };

  try {
    const position = mod.attachments.length;
    const id = throwIfError(
      await modulesService.addAttachment(mod.id, { ...payload, position, size: '' }),
      'menambah lampiran'
    );
    mod.attachments.push({ id, position, size: '', previewUrl: payload.url, ...payload });
    urlInput.value = '';
    renderModuleAttachmentsList();
    updateLivePreview();
    showToast('Link media pembelajaran berhasil dilampirkan!');
  } catch (error) {
    reportError('Gagal melampirkan link', error);
  }
}

async function deleteModuleAttachment(attId) {
  if (!ensureAdmin()) return;
  const mod = getActiveModule();
  if (!mod) return;
  const att = mod.attachments.find((a) => a.id === attId);
  if (!att) return;
  const position = mod.attachments.findIndex((a) => a.id === attId);
  const deleted = await runWithStatus(
    () => modulesService.deleteAttachment(attId),
    'Gagal menghapus lampiran'
  );
  if (!deleted) return;
  mod.attachments = mod.attachments.filter((a) => a.id !== attId);
  renderModuleAttachmentsList();
  updateLivePreview();
  setUndoAction(async () => {
    throwIfError(
      await modulesService.addAttachment(mod.id, {
        position,
        name: att.name,
        type: att.type,
        url: att.url,
        size: att.size
      }),
      'restore lampiran'
    );
    await loadModules();
    renderModuleTab();
  });
  showToast('Lampiran modul berhasil dihapus.', true);
}

async function addStepToActiveModule() {
  if (!ensureAdmin()) return;
  let mod = getActiveModule();
  if (!mod) {
    await createNewModule();
    mod = getActiveModule();
    if (!mod) return;
  }
  const position = mod.steps.length;
  try {
    const id = throwIfError(
      await modulesService.addStep(mod.id, {
        position,
        instruction: '',
        tip: ''
      }),
      'menambah langkah'
    );
    mod.steps.push({
      id,
      moduleId: mod.id,
      position,
      instruction: '',
      tip: '',
      mediaName: '',
      mediaType: '',
      mediaUrl: ''
    });
    renderModuleStepsList();
    updateLivePreview();
    showToast('Langkah kerja baru ditambahkan!');
  } catch (error) {
    reportError('Gagal menambah langkah', error);
  }
}

function updateStepField(idx, field, value) {
  if (!ensureAdmin()) return;
  const mod = getActiveModule();
  if (!mod || !mod.steps[idx]) return;
  mod.steps[idx][field] = value;
  updateLivePreview();
  const step = mod.steps[idx];
  scheduleSave(`step:${step.id}`, () =>
    modulesService.updateStep(step.id, { [field]: value })
  );
}

async function deleteStepFromActiveModule(idx) {
  if (!ensureAdmin()) return;
  const mod = getActiveModule();
  if (!mod || !mod.steps[idx]) return;
  const step = mod.steps[idx];
  const snapshot = { ...step, position: idx };
  const deleted = await runWithStatus(
    () => modulesService.deleteStep(step.id),
    'Gagal menghapus langkah'
  );
  if (!deleted) return;
  mod.steps.splice(idx, 1);
  renderModuleStepsList();
  updateLivePreview();
  setUndoAction(async () => {
    throwIfError(
      await modulesService.addStep(mod.id, {
        position: idx,
        instruction: snapshot.instruction,
        tip: snapshot.tip,
        mediaName: snapshot.mediaName,
        mediaType: snapshot.mediaType,
        mediaUrl: snapshot.mediaUrl
      }),
      'restore langkah'
    );
    await loadModules();
    renderModuleTab();
  });
  showToast(`Langkah ${idx + 1} berhasil dihapus.`, true);
}

async function handleStepMediaUpload(event, idx) {
  if (!ensureAdmin()) return;
  const file = event.target.files?.[0];
  event.target.value = '';
  const mod = getActiveModule();
  if (!file || !mod || !mod.steps[idx]) return;

  setSyncStatus('Mengunggah media langkah…');
  try {
    const result = await storageService.uploadMedia(file, state.user.id);
    if (result.error) throw result.error;
    const step = mod.steps[idx];
    step.mediaName = file.name;
    step.mediaType = result.data.type;
    step.mediaUrl = result.data.path;
    step.mediaPreviewUrl = await previewFor(result.data.path);
    throwIfError(
      await modulesService.updateStep(step.id, {
        mediaName: step.mediaName,
        mediaType: step.mediaType,
        mediaUrl: step.mediaUrl
      }),
      'menyimpan media langkah'
    );
    renderModuleStepsList();
    updateLivePreview();
    setSyncStatus('Tersimpan');
    showToast(`Media "${file.name}" dilampirkan pada Langkah ${idx + 1}!`);
  } catch (error) {
    reportError('Gagal mengunggah media langkah', error);
  }
}

async function deleteStepMedia(idx) {
  if (!ensureAdmin()) return;
  const mod = getActiveModule();
  if (!mod || !mod.steps[idx]) return;
  const step = mod.steps[idx];
  const snapshot = { mediaName: step.mediaName, mediaType: step.mediaType, mediaUrl: step.mediaUrl };
  const updated = await runWithStatus(
    () =>
      modulesService.updateStep(step.id, {
        mediaName: '',
        mediaType: '',
        mediaUrl: ''
      }),
    'Gagal menghapus media langkah'
  );
  if (!updated) return;
  step.mediaName = '';
  step.mediaType = '';
  step.mediaUrl = '';
  step.mediaPreviewUrl = '';
  renderModuleStepsList();
  updateLivePreview();
  setUndoAction(async () => {
    throwIfError(
      await modulesService.updateStep(step.id, {
        mediaName: snapshot.mediaName,
        mediaType: snapshot.mediaType,
        mediaUrl: snapshot.mediaUrl
      }),
      'restore media langkah'
    );
    await loadModules();
    renderModuleTab();
  });
  showToast(`Media pada Langkah ${idx + 1} berhasil dihapus.`, true);
}

// ---------------------------------------------------------------------------
// Troubleshooting
// ---------------------------------------------------------------------------
function openTroubleFormForCreate() {
  const title = document.getElementById('trouble-form-title');
  if (title) {
    title.innerHTML = `<i class="fa-solid fa-screwdriver-wrench text-amber-500"></i><span>Tambah Panduan Troubleshooting Baru</span>`;
  }
  document.getElementById('tr-edit-id').value = '';
  document.getElementById('tr-symptom').value = '';
  document.getElementById('tr-category').value = 'Basis Data';
  document.getElementById('tr-cause').value = '';
  document.getElementById('tr-solution').value = '';
  document.getElementById('tr-media-url').value = '';
  document.getElementById('tr-media-file').value = '';
  clearTroubleTempMedia();
  document.getElementById('form-add-trouble').classList.remove('hidden');
}

function closeTroubleForm() {
  document.getElementById('form-add-trouble').classList.add('hidden');
}

async function handleTroubleMediaSelect(event) {
  if (!ensureAdmin()) return;
  const file = event.target.files?.[0];
  if (!file) return;
  setSyncStatus('Mengunggah media…');
  try {
    const result = await storageService.uploadMedia(file, state.user.id);
    if (result.error) throw result.error;
    tempTroubleMedia = {
      mediaName: file.name,
      mediaType: result.data.type,
      mediaUrl: result.data.path,
      mediaPreviewUrl: await previewFor(result.data.path)
    };
    document.getElementById('tr-media-name').textContent = `Lampiran siap: ${file.name}`;
    document.getElementById('tr-media-badge').classList.remove('hidden');
    setSyncStatus('Tersimpan');
  } catch (error) {
    event.target.value = '';
    reportError('Gagal mengunggah media', error);
  }
}

function clearTroubleTempMedia() {
  tempTroubleMedia = emptyMedia();
  document.getElementById('tr-media-badge').classList.add('hidden');
  document.getElementById('tr-media-file').value = '';
}

function editTroubleshootingItem(id) {
  const item = state.troubleshooting.find((t) => t.id === id);
  if (!item) return;

  const title = document.getElementById('trouble-form-title');
  if (title) {
    title.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i><span>Edit Kasus Troubleshooting</span>`;
  }
  document.getElementById('tr-edit-id').value = item.id;
  document.getElementById('tr-symptom').value = item.symptom;
  document.getElementById('tr-category').value = item.category;
  document.getElementById('tr-cause').value = item.cause;
  document.getElementById('tr-solution').value = item.solution;
  document.getElementById('tr-media-url').value = item.mediaType === 'youtube' ? item.mediaUrl : '';

  tempTroubleMedia = {
    mediaName: item.mediaName || '',
    mediaType: item.mediaType || '',
    mediaUrl: item.mediaUrl || '',
    mediaPreviewUrl: item.mediaPreviewUrl || ''
  };

  if (tempTroubleMedia.mediaUrl) {
    document.getElementById('tr-media-name').textContent = `Terlampir: ${tempTroubleMedia.mediaName || 'Media Solusi'
      }`;
    document.getElementById('tr-media-badge').classList.remove('hidden');
  } else {
    document.getElementById('tr-media-badge').classList.add('hidden');
  }

  document.getElementById('form-add-trouble').classList.remove('hidden');
  document.getElementById('form-add-trouble').scrollIntoView({ behavior: 'smooth' });
}

async function saveTroubleshootingItem() {
  if (!ensureAdmin()) return;
  const editId = document.getElementById('tr-edit-id').value;
  const symptom = document.getElementById('tr-symptom').value.trim();
  const category = document.getElementById('tr-category').value;
  const cause = document.getElementById('tr-cause').value.trim();
  const solution = document.getElementById('tr-solution').value.trim();
  const urlVal = document.getElementById('tr-media-url').value.trim();

  if (!symptom || !cause || !solution) {
    showToast('Mohon lengkapi keluhan, penyebab, dan solusi kasus!');
    return;
  }

  let media = { ...tempTroubleMedia };
  if (urlVal && !media.mediaUrl) {
    if (!isSafeHttpUrl(urlVal)) {
      showToast('URL media harus diawali http:// atau https://');
      return;
    }
    const yt = parseYoutubeEmbed(urlVal);
    media = {
      mediaName: yt ? 'Video Solusi YouTube' : urlVal,
      mediaType: yt ? 'youtube' : 'link',
      mediaUrl: yt || urlVal,
      mediaPreviewUrl: yt || urlVal
    };
  }

  const payload = {
    category,
    symptom,
    cause,
    solution,
    mediaName: media.mediaName || '',
    mediaType: media.mediaType || '',
    mediaUrl: media.mediaUrl || ''
  };

  try {
    if (editId) {
      throwIfError(await troubleService.updateCase(editId, payload), 'update kasus');
      showToast('Kasus troubleshooting berhasil diperbarui!');
    } else {
      throwIfError(await troubleService.createCase(payload), 'simpan kasus');
      showToast('Kasus troubleshooting baru berhasil ditambahkan!');
    }
    closeTroubleForm();
    await loadTroubleshooting();
    renderTroubleshooting();
    renderDashboard();
    setSyncStatus('Tersimpan');
  } catch (error) {
    reportError('Gagal menyimpan kasus', error);
  }
}

async function deleteTroubleshootingItem(id) {
  if (!ensureAdmin()) return;
  const target = state.troubleshooting.find((t) => t.id === id);
  if (!target) return;
  const deleted = await runWithStatus(
    () => troubleService.deleteCase(id),
    'Gagal menghapus kasus'
  );
  if (!deleted) return;
  state.troubleshooting = state.troubleshooting.filter((t) => t.id !== id);
  renderTroubleshooting();
  renderDashboard();
  setUndoAction(async () => {
    throwIfError(await troubleService.restoreCase(target), 'restore kasus');
    await loadTroubleshooting();
    renderTroubleshooting();
    renderDashboard();
  });
  showToast('Kasus troubleshooting telah dihapus.', true);
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------
async function toggleCheckItem(id) {
  if (!ensureAdmin()) {
    renderChecklist();
    return;
  }
  const item = state.checklist.find((i) => i.id === id);
  if (!item) return;
  item.checked = !item.checked;
  renderChecklist();
  try {
    throwIfError(
      await checklistService.updateItem(id, { checked: item.checked }),
      'update checklist'
    );
  } catch (error) {
    item.checked = !item.checked;
    renderChecklist();
    reportError('Gagal memperbarui checklist', error);
  }
}

async function saveChecklistItem() {
  if (!ensureAdmin()) return;
  const editId = document.getElementById('check-edit-id').value;
  const input = document.getElementById('new-check-input');
  const text = input.value.trim();
  if (!text) {
    showToast('Tulis isi poin checklist terlebih dahulu!');
    return;
  }

  try {
    if (editId) {
      throwIfError(await checklistService.updateItem(editId, { text }), 'update checklist');
      cancelCheckEdit();
      showToast('Poin checklist berhasil diperbarui!');
    } else {
      throwIfError(
        await checklistService.createItem({ text, checked: false, position: state.checklist.length }),
        'simpan checklist'
      );
      input.value = '';
      showToast('Poin checklist baru ditambahkan!');
    }
    await loadChecklist();
    renderChecklist();
    setSyncStatus('Tersimpan');
  } catch (error) {
    reportError('Gagal menyimpan checklist', error);
  }
}

function editChecklistItem(id) {
  const item = state.checklist.find((i) => i.id === id);
  if (!item) return;
  document.getElementById('check-edit-id').value = item.id;
  document.getElementById('new-check-input').value = item.text;
  document.getElementById('btn-save-check').textContent = 'Simpan Edit';
  document.getElementById('btn-cancel-check').classList.remove('hidden');
  document.getElementById('new-check-input').focus();
}

function cancelCheckEdit() {
  document.getElementById('check-edit-id').value = '';
  document.getElementById('new-check-input').value = '';
  document.getElementById('btn-save-check').textContent = '+ Tambah';
  document.getElementById('btn-cancel-check').classList.add('hidden');
}

async function deleteChecklistItem(id) {
  if (!ensureAdmin()) return;
  const target = state.checklist.find((i) => i.id === id);
  if (!target) return;
  const deleted = await runWithStatus(
    () => checklistService.deleteItem(id),
    'Gagal menghapus checklist'
  );
  if (!deleted) return;
  state.checklist = state.checklist.filter((i) => i.id !== id);
  renderChecklist();
  setUndoAction(async () => {
    throwIfError(await checklistService.restoreItems([target]), 'restore checklist');
    await loadChecklist();
    renderChecklist();
  });
  showToast('Poin checklist berhasil dihapus.', true);
}

async function deleteCompletedChecklist() {
  if (!ensureAdmin()) return;
  const completed = state.checklist.filter((i) => i.checked);
  if (completed.length === 0) {
    showToast('Tidak ada item checklist selesai untuk dihapus.');
    return;
  }
  const deleted = await runWithStatus(
    () => checklistService.deleteItems(completed.map((i) => i.id)),
    'Gagal menghapus checklist selesai'
  );
  if (!deleted) return;
  state.checklist = state.checklist.filter((i) => !i.checked);
  renderChecklist();
  setUndoAction(async () => {
    throwIfError(await checklistService.restoreItems(completed), 'restore checklist');
    await loadChecklist();
    renderChecklist();
  });
  showToast('Semua item checklist yang selesai telah dihapus.', true);
}

async function resetChecklist() {
  if (!ensureAdmin()) return;
  const updated = await runWithStatus(
    () => checklistService.resetChecked(),
    'Gagal mereset checklist'
  );
  if (!updated) return;
  state.checklist.forEach((i) => {
    i.checked = false;
  });
  renderChecklist();
  showToast('Semua centang checklist telah direset.');
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------
async function handleEvalMediaSelect(event) {
  if (!ensureAdmin()) return;
  const file = event.target.files?.[0];
  if (!file) return;
  setSyncStatus('Mengunggah media…');
  try {
    const result = await storageService.uploadMedia(file, state.user.id);
    if (result.error) throw result.error;
    tempEvalMedia = {
      mediaName: file.name,
      mediaType: result.data.type,
      mediaUrl: result.data.path,
      mediaPreviewUrl: await previewFor(result.data.path)
    };
    document.getElementById('eval-media-name').textContent = `Bukti terlampir: ${file.name}`;
    document.getElementById('eval-media-badge').classList.remove('hidden');
    setSyncStatus('Tersimpan');
  } catch (error) {
    event.target.value = '';
    reportError('Gagal mengunggah media', error);
  }
}

function clearEvalTempMedia() {
  tempEvalMedia = emptyMedia();
  document.getElementById('eval-media-badge').classList.add('hidden');
  document.getElementById('eval-media-file').value = '';
}

async function saveEvaluationLog() {
  if (!ensureAdmin()) return;
  const editId = document.getElementById('eval-edit-id').value;
  const session = document.getElementById('eval-session').value.trim();
  const confused = document.getElementById('eval-confused').value.trim();
  const action = document.getElementById('eval-action').value.trim();

  if (!session || !confused || !action) {
    showToast('Mohon isi ketiga pertanyaan evaluasi terlebih dahulu!');
    return;
  }

  const payload = {
    session,
    confused,
    action,
    mediaName: tempEvalMedia.mediaName || '',
    mediaType: tempEvalMedia.mediaType || '',
    mediaUrl: tempEvalMedia.mediaUrl || ''
  };

  try {
    if (editId) {
      throwIfError(await evalService.updateLog(editId, payload), 'update evaluasi');
      cancelEvalEdit();
      showToast('Catatan evaluasi berhasil diperbarui!');
    } else {
      throwIfError(
        await evalService.createLog({ ...payload, date: 'Baru saja' }),
        'simpan evaluasi'
      );
      document.getElementById('eval-session').value = '';
      document.getElementById('eval-confused').value = '';
      document.getElementById('eval-action').value = '';
      clearEvalTempMedia();
      showToast('Catatan evaluasi pasca-praktikum tersimpan!');
    }
    await loadEvaluations();
    renderEvalLogs();
    setSyncStatus('Tersimpan');
  } catch (error) {
    reportError('Gagal menyimpan evaluasi', error);
  }
}

function editEvaluationLog(id) {
  const log = state.evalLogs.find((l) => l.id === id);
  if (!log) return;

  document.getElementById('eval-edit-id').value = log.id;
  document.getElementById('eval-session').value = log.session;
  document.getElementById('eval-confused').value = log.confused;
  document.getElementById('eval-action').value = log.action;

  tempEvalMedia = {
    mediaName: log.mediaName || '',
    mediaType: log.mediaType || '',
    mediaUrl: log.mediaUrl || '',
    mediaPreviewUrl: log.mediaPreviewUrl || ''
  };

  if (tempEvalMedia.mediaUrl) {
    document.getElementById('eval-media-name').textContent = `Bukti: ${tempEvalMedia.mediaName}`;
    document.getElementById('eval-media-badge').classList.remove('hidden');
  } else {
    document.getElementById('eval-media-badge').classList.add('hidden');
  }

  document.getElementById('btn-save-eval').innerHTML =
    '<i class="fa-solid fa-check mr-1.5"></i>Update Evaluasi';
  document.getElementById('btn-cancel-eval').classList.remove('hidden');
}

function cancelEvalEdit() {
  document.getElementById('eval-edit-id').value = '';
  document.getElementById('eval-session').value = '';
  document.getElementById('eval-confused').value = '';
  document.getElementById('eval-action').value = '';
  clearEvalTempMedia();
  document.getElementById('btn-save-eval').innerHTML =
    '<i class="fa-solid fa-paper-plane mr-1.5"></i>Simpan Catatan Evaluasi';
  document.getElementById('btn-cancel-eval').classList.add('hidden');
}

async function deleteEvaluationLog(id) {
  if (!ensureAdmin()) return;
  const target = state.evalLogs.find((l) => l.id === id);
  if (!target) return;
  const deleted = await runWithStatus(
    () => evalService.deleteLog(id),
    'Gagal menghapus evaluasi'
  );
  if (!deleted) return;
  state.evalLogs = state.evalLogs.filter((l) => l.id !== id);
  renderEvalLogs();
  setUndoAction(async () => {
    throwIfError(await evalService.restoreLog(target), 'restore evaluasi');
    await loadEvaluations();
    renderEvalLogs();
  });
  showToast('Catatan evaluasi berhasil dihapus.', true);
}

// ---------------------------------------------------------------------------
// Members (admin)
// ---------------------------------------------------------------------------
async function saveAllowedEmail() {
  const emailInput = document.getElementById('allowed-email-input');
  const roleSelect = document.getElementById('allowed-email-role');
  const email = emailInput.value.trim();
  const role = roleSelect.value;
  if (!email) {
    showToast('Masukkan email terlebih dahulu.');
    return;
  }
  try {
    throwIfError(
      await membersService.addAllowedEmail(email, role, state.user.id),
      'menambah email'
    );
    emailInput.value = '';
    const isSelf =
      String(email).trim().toLowerCase() ===
      String(state.user?.email || '').trim().toLowerCase();
    if (isSelf) {
      const profile = throwIfError(await authService.getProfile(state.user.id), 'memuat profil');
      state.profile = profile;
      const accountRole = document.getElementById('account-role');
      if (accountRole) accountRole.textContent = roleLabel(profile.role);
      applyRoleVisibility();
      if (profile.role === 'pending') {
        showPendingScreen(state.user);
        return;
      }
      if (profile.role !== 'admin') {
        state.members = [];
        state.allowedEmails = [];
        switchTab('dashboard');
      } else {
        await loadMembers();
        renderMembers();
      }
    } else {
      await loadMembers();
      renderMembers();
    }
    showToast(`Email ${email} diizinkan sebagai ${role}.`);
  } catch (error) {
    reportError('Gagal menambah email', error);
  }
}

async function removeAllowedEmail(email) {
  if (!email) return;
  if (!window.confirm(`Cabut akses untuk ${email}? Profil terkait akan menjadi pending.`)) {
    return;
  }
  const isSelf =
    String(email).trim().toLowerCase() ===
    String(state.user?.email || '').trim().toLowerCase();
  try {
    throwIfError(await membersService.removeAllowedEmail(email), 'mencabut akses');
    if (isSelf) {
      const profile = throwIfError(await authService.getProfile(state.user.id), 'memuat profil');
      state.profile = profile;
      state.members = [];
      state.allowedEmails = [];
      const accountRole = document.getElementById('account-role');
      if (accountRole) accountRole.textContent = roleLabel(profile.role);
      applyRoleVisibility();
      if (profile.role === 'pending') {
        showPendingScreen(state.user);
        return;
      }
      switchTab('dashboard');
    } else {
      await loadMembers();
      renderMembers();
    }
    showToast(`Akses ${email} dicabut.`);
  } catch (error) {
    reportError('Gagal mencabut akses', error);
  }
}

async function changeMemberRole(id) {
  const select = document.getElementById(`role-select-${id}`);
  if (!select) return;
  const role = select.value;
  if (id === state.user?.id && role !== 'admin') {
    if (!window.confirm('Anda akan menurunkan role akun sendiri. Lanjutkan?')) {
      select.value = state.profile?.role || 'admin';
      return;
    }
  }
  try {
    throwIfError(await membersService.updateMemberRole(id, role), 'mengubah role');
    if (id === state.user?.id) {
      const profile = throwIfError(await authService.getProfile(state.user.id), 'memuat profil');
      state.profile = profile;
      const accountRole = document.getElementById('account-role');
      if (accountRole) accountRole.textContent = roleLabel(profile.role);
      applyRoleVisibility();
      if (profile.role === 'pending') {
        showPendingScreen(state.user);
        return;
      }
      if (profile.role !== 'admin') {
        state.members = [];
        state.allowedEmails = [];
        switchTab('dashboard');
      } else {
        await loadMembers();
        renderMembers();
      }
    } else {
      await loadMembers();
      renderMembers();
    }
    showToast('Role anggota diperbarui.');
  } catch (error) {
    reportError('Gagal mengubah role', error);
  }
}

// ---------------------------------------------------------------------------
// Legacy import & reset
// ---------------------------------------------------------------------------
async function importLegacyData() {
  if (state.profile?.role !== 'admin') {
    showToast('Hanya admin yang dapat mengimpor data lama.');
    return;
  }
  if (
    !window.confirm(
      'Impor data lama dari database bersama/localStorage ke tabel baru? Proses ini aman diulang.'
    )
  ) {
    return;
  }
  setSyncStatus('Mengimpor data lama…');
  let result = null;
  try {
    result = await runLegacyImport(state.user.id);
    renderImportSummary(result.summary);
    if (result.error) throw result.error;
    await refreshAll();
    setSyncStatus('Tersimpan');
    showToast('Impor data lama selesai. Lihat ringkasan di panel Anggota.');
  } catch (error) {
    renderImportSummary(result?.summary);
    reportError('Gagal mengimpor data lama', error);
  }
}

async function clearAllContent() {
  for (const mod of state.modules) {
    throwIfError(await modulesService.deleteModule(mod.id), 'hapus modul');
  }
  for (const item of state.troubleshooting) {
    throwIfError(await troubleService.deleteCase(item.id), 'hapus kasus');
  }
  for (const item of state.analogies) {
    throwIfError(await glossaryService.deleteTerm(item.id), 'hapus istilah');
  }
  throwIfError(
    await checklistService.deleteItems(state.checklist.map((i) => i.id)),
    'hapus checklist'
  );
  for (const item of state.evalLogs) {
    throwIfError(await evalService.deleteLog(item.id), 'hapus evaluasi');
  }
}

async function insertDefaultData() {
  const data = defaultInitialData;
  for (const mod of data.modules) {
    const moduleId = throwIfError(
      await modulesService.createModule({
        title: mod.title,
        duration: mod.duration,
        goal: mod.goal,
        tools: mod.tools
      }),
      'seed modul'
    );
    for (const [index, step] of mod.steps.entries()) {
      throwIfError(
        await modulesService.addStep(moduleId, {
          position: index,
          instruction: step.instruction,
          tip: step.tip
        }),
        'seed langkah'
      );
    }
    for (const [index, att] of (mod.attachments || []).entries()) {
      throwIfError(
        await modulesService.addAttachment(moduleId, {
          position: index,
          name: att.name,
          type: att.type,
          url: att.url,
          size: ''
        }),
        'seed lampiran'
      );
    }
  }
  for (const item of data.troubleshooting) {
    throwIfError(await troubleService.createCase(item), 'seed kasus');
  }
  for (const item of data.analogies) {
    throwIfError(await glossaryService.createTerm(item), 'seed istilah');
  }
  for (const [index, item] of data.checklist.entries()) {
    throwIfError(
      await checklistService.createItem({ ...item, position: index }),
      'seed checklist'
    );
  }
  for (const item of data.evalLogs) {
    throwIfError(await evalService.createLog(item), 'seed evaluasi');
  }
}

async function restoreAllContent(snapshot) {
  for (const mod of snapshot.modules) {
    throwIfError(await modulesService.restoreModule(mod), 'restore modul');
  }
  for (const item of snapshot.troubleshooting) {
    throwIfError(await troubleService.restoreCase(item), 'restore kasus');
  }
  for (const item of snapshot.analogies) {
    throwIfError(await glossaryService.restoreTerm(item), 'restore istilah');
  }
  throwIfError(await checklistService.restoreItems(snapshot.checklist), 'restore checklist');
  for (const item of snapshot.evalLogs) {
    throwIfError(await evalService.restoreLog(item), 'restore evaluasi');
  }
  await loadModules();
  await loadTroubleshooting();
  await loadGlossary();
  await loadChecklist();
  await loadEvaluations();
}

async function resetAllDefaultData() {
  if (state.profile?.role !== 'admin') {
    showToast('Hanya admin yang dapat memulihkan data contoh.');
    return;
  }
  if (
    !window.confirm(
      'Semua data konten akan diganti dengan data contoh awal. Lanjutkan? Tindakan ini dapat diurungkan lewat tombol Undo.'
    )
  ) {
    return;
  }
  const snapshot = JSON.parse(
    JSON.stringify({
      modules: state.modules,
      troubleshooting: state.troubleshooting,
      analogies: state.analogies,
      checklist: state.checklist,
      evalLogs: state.evalLogs
    })
  );

  setSyncStatus('Memulihkan data contoh…');
  try {
    await clearAllContent();
    await insertDefaultData();
    await refreshAll();
    setUndoAction(async () => {
      await clearAllContent();
      await restoreAllContent(snapshot);
      await refreshAll();
    });
    setSyncStatus('Tersimpan');
    showToast('Data contoh awal berhasil dipulihkan!', true);
  } catch (error) {
    reportError('Gagal memulihkan data contoh', error);
  }
}

// ---------------------------------------------------------------------------
// Compatibility aliases used by inline attributes
// ---------------------------------------------------------------------------
const updateDashboardAndStats = renderDashboard;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function exposeHandlers() {
  Object.assign(window, {
    // layout & auth
    switchTab: handleSwitchTab,
    toggleMobileMenu,
    viewContent,
    closeDetailModal,
    signOut,
    undoLastDelete,
    // modules
    createNewModule,
    selectModuleById,
    deleteModuleById,
    deleteActiveModule,
    syncActiveModuleFromForm,
    saveCurrentModule,
    handleModuleFilesUpload,
    addModuleLinkAttachment,
    deleteModuleAttachment,
    addStepToActiveModule,
    updateStepField,
    deleteStepFromActiveModule,
    handleStepMediaUpload,
    deleteStepMedia,
    updateLivePreview,
    copyModuleText,
    // troubleshooting
    openTroubleFormForCreate,
    closeTroubleForm,
    handleTroubleMediaSelect,
    clearTroubleTempMedia,
    editTroubleshootingItem,
    saveTroubleshootingItem,
    deleteTroubleshootingItem,
    renderTroubleshooting,
    // checklist
    renderChecklist,
    toggleCheckItem,
    saveChecklistItem,
    editChecklistItem,
    cancelCheckEdit,
    deleteChecklistItem,
    deleteCompletedChecklist,
    resetChecklist,
    // evaluations
    handleEvalMediaSelect,
    clearEvalTempMedia,
    saveEvaluationLog,
    editEvaluationLog,
    cancelEvalEdit,
    deleteEvaluationLog,
    renderEvalLogs,
    // dashboard & utility
    updateDashboardAndStats,
    renderAllViews,
    // admin
    saveAllowedEmail,
    removeAllowedEmail,
    changeMemberRole,
    importLegacyData,
    resetAllDefaultData
  });
}

async function init() {
  exposeHandlers();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetailModal();
  });

  onRoute((path) => {
    renderRoute(path);
  });

  onSessionChange((currSession) => {
    state.user = currSession.user;
    state.profile = currSession.profile;
    applyRoleVisibility();

    if (currSession.loading) return;

    const currentPath = getHashPath();
    if (!currSession.user) {
      if (currentPath.startsWith('#/app') || currentPath === '#/menunggu' || currentPath === '#/ditolak' || currentPath === '#/profil') {
        navigate('#/');
      } else {
        renderRoute(currentPath);
      }
      return;
    }

    if (currSession.role === 'user' && currentPath === '#/menunggu') {
      showToast('Akun Anda telah disetujui! Mengalihkan ke aplikasi…');
      navigate('#/app');
    } else if (currSession.role === 'rejected' && currentPath === '#/menunggu') {
      navigate('#/ditolak');
    } else if ((currSession.role === 'pending' || currSession.role === 'rejected') && currentPath.startsWith('#/app')) {
      navigate(currSession.role === 'pending' ? '#/menunggu' : '#/ditolak');
    } else {
      renderRoute(currentPath);
    }
  });

  await initSession();
  renderRoute(getHashPath());
}

init();
