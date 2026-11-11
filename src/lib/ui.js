let toastTimeout = null;
let undoAction = null;

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseYoutubeEmbed(url) {
  if (!url || !isSafeHttpUrl(url)) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return 'https://www.youtube.com/embed/' + match[2];
  }
  return null;
}

export function renderMediaAttachmentBlock(type, url, name) {
  if (!url) return '';
  const safeName = escapeHtml(name || 'Lampiran Media');
  const safeUrl = isSafeHttpUrl(url) ? escapeHtml(url) : '';
  if (!safeUrl) return '';

  if (type === 'video') {
    return `
      <div class="mt-2.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
        <video controls class="w-full max-h-64">
          <source src="${safeUrl}">
          Browser Anda tidak mendukung pemutar video HTML5.
        </video>
        <div class="px-3 py-1.5 bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between">
          <span class="truncate"><i class="fa-solid fa-film text-rose-400 mr-1.5"></i>${safeName}</span>
          <a href="${safeUrl}" download="${safeName}" class="text-indigo-300 hover:underline font-semibold shrink-0 ml-2">Unduh Video</a>
        </div>
      </div>
    `;
  }
  if (type === 'youtube') {
    return `
      <div class="mt-2.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video">
        <iframe src="${safeUrl}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
      </div>
    `;
  }
  if (type === 'image') {
    return `
      <div class="mt-2.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
        <img src="${safeUrl}" alt="${safeName}" class="w-full max-h-64 object-contain rounded-lg mx-auto">
        <div class="text-[11px] text-slate-500 text-center mt-1 font-medium">${safeName}</div>
      </div>
    `;
  }
  return `
    <a href="${safeUrl}" download="${safeName}" target="_blank" rel="noopener noreferrer" class="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-800 transition">
      <span class="truncate flex items-center gap-2"><i class="fa-solid fa-file-arrow-down text-indigo-600 text-sm"></i>${safeName}</span>
      <span class="px-2 py-0.5 bg-white rounded-md border border-indigo-200 text-[10px] uppercase shrink-0">Buka / Unduh</span>
    </a>
  `;
}

export function setUndoAction(fn) {
  undoAction = typeof fn === 'function' ? fn : null;
}

export function clearUndo() {
  undoAction = null;
  document.getElementById('toast-undo-btn')?.classList.add('hidden');
}

export async function undoLastDelete() {
  if (!undoAction) return;
  const fn = undoAction;
  undoAction = null;
  document.getElementById('toast-undo-btn')?.classList.add('hidden');
  try {
    await fn();
    showToast('Penghapusan berhasil dibatalkan (Data dipulihkan)!', false);
  } catch (error) {
    console.error('Gagal mengurungkan penghapusan:', error);
    showToast(`Gagal mengurungkan: ${error.message || 'Terjadi kesalahan.'}`);
  }
}

export function showToast(message, showUndo = false) {
  const toast = document.getElementById('toast');
  const undoBtn = document.getElementById('toast-undo-btn');
  const messageEl = document.getElementById('toast-message');
  if (!toast || !messageEl) return;

  messageEl.textContent = message;
  if (showUndo && undoAction) {
    undoBtn?.classList.remove('hidden');
  } else {
    undoBtn?.classList.add('hidden');
  }

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 4500);
}

export function setSyncStatus(message, isError = false) {
  const status = document.getElementById('sync-status');
  if (!status) return;
  status.textContent = message;
  status.className = `text-[11px] ${isError ? 'text-rose-600' : 'text-slate-400'}`;
}

export function setAuthMessage(message, isError = false) {
  const element = document.getElementById('auth-message');
  if (!element) return;
  element.textContent = message || '';
  element.classList.toggle('hidden', !message);
  element.className = `text-sm ${isError ? 'text-rose-600' : 'text-emerald-700'} ${message ? '' : 'hidden'}`;
}

export function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.className =
      'nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all';
  });

  const tab = document.getElementById('tab-' + tabId);
  if (tab) tab.classList.add('active');
  const activeBtn = document.getElementById('nav-' + tabId);
  if (activeBtn) {
    activeBtn.className =
      'nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-primary-50 text-primary-700';
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
    toggleMobileMenu();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
}

export function roleLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'member') return 'Member';
  return 'Menunggu persetujuan';
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
