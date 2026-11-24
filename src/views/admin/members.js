// src/views/admin/members.js
// Menu Anggota & Akses untuk admin dengan antrian persetujuan (Menunggu, Disetujui, Ditolak) dan Realtime.

import * as membersService from '../../services/members.js';
import { supabase } from '../../lib/supabase.js';
import { showToast, escapeHtml } from '../../lib/ui.js';

let activeTab = 'pending'; // 'pending' | 'user' | 'rejected'
let membersCache = [];
let searchQuery = '';
let realtimeChannel = null;

export async function renderMembersView(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Manajemen Anggota & Akses</h2>
          <p class="text-xs text-slate-500">Kelola persetujuan pendaftaran akun dan hak akses pengguna</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative w-full sm:w-64">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
            <input id="members-search-input" type="text" placeholder="Cari nama atau email…"
              value="${escapeHtml(searchQuery)}"
              class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          </div>
          <button id="btn-refresh-members" type="button" class="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition" title="Muat ulang data">
            <i class="fa-solid fa-rotate-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Tab Navigasi Persetujuan -->
      <div class="flex border-b border-slate-200 gap-2">
        <button type="button" data-tab="pending" class="members-tab-btn flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'pending' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          <i class="fa-solid fa-hourglass-half"></i> Menunggu
          <span id="badge-pending-count" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">0</span>
        </button>
        <button type="button" data-tab="user" class="members-tab-btn flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'user' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          <i class="fa-solid fa-user-check"></i> Disetujui
          <span id="badge-user-count" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">0</span>
        </button>
        <button type="button" data-tab="rejected" class="members-tab-btn flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'rejected' ? 'border-rose-500 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          <i class="fa-solid fa-user-xmark"></i> Ditolak
          <span id="badge-rejected-count" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">0</span>
        </button>
      </div>

      <!-- Konten Daftar Anggota -->
      <div id="members-table-container" class="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div class="p-8 text-center text-xs text-slate-400">
          <i class="fa-solid fa-circle-notch fa-spin text-lg mb-2"></i>
          <p>Memuat data anggota…</p>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Tolak -->
    <div id="modal-reject-user" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <h3 class="text-base font-bold text-slate-800 mb-1">Tolak Pendaftaran Pengguna</h3>
        <p class="text-xs text-slate-500 mb-4">Pengguna tidak akan dapat mengakses data praktikum.</p>
        <div class="mb-4">
          <label for="reject-reason-input" class="block text-xs font-bold text-slate-700 mb-1.5">Alasan Penolakan (Opsional)</label>
          <textarea id="reject-reason-input" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500" placeholder="Contoh: Bukan mahasiswa aktif laboratorium angkatan ini."></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button id="btn-cancel-reject" type="button" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Batal</button>
          <button id="btn-confirm-reject" type="button" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">Tolak Akun</button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Akun 2 Langkah -->
    <div id="modal-delete-user" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
        <div class="flex items-center gap-2.5 text-rose-600 mb-2">
          <i class="fa-solid fa-triangle-exclamation text-lg"></i>
          <h3 class="text-base font-bold text-slate-800">Hapus Akun Pengguna</h3>
        </div>
        <p class="text-xs text-slate-600 mb-3 leading-relaxed">
          Tindakan ini permanen. Akun <strong id="delete-user-email" class="text-slate-800"></strong> akan dihapus dari sistem autentikasi dan profil.
        </p>
        <p class="text-xs text-slate-500 mb-4">
          Ketik <strong>HAPUS</strong> untuk mengonfirmasi:
        </p>
        <input id="delete-confirm-input" type="text" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs mb-4 focus:ring-2 focus:ring-rose-500 uppercase" placeholder="Ketik HAPUS">
        <div class="flex justify-end gap-2">
          <button id="btn-cancel-delete" type="button" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Batal</button>
          <button id="btn-confirm-delete" type="button" disabled class="px-4 py-2 rounded-xl bg-rose-600 disabled:bg-slate-200 disabled:cursor-not-allowed hover:bg-rose-700 text-white text-xs font-bold">Hapus Akun</button>
        </div>
      </div>
    </div>
  `;

  const tableContainer = container.querySelector('#members-table-container');
  const searchInput = container.querySelector('#members-search-input');
  const refreshBtn = container.querySelector('#btn-refresh-members');
  const tabBtns = container.querySelectorAll('.members-tab-btn');

  // Modal elements
  const modalReject = container.querySelector('#modal-reject-user');
  const rejectReasonInput = container.querySelector('#reject-reason-input');
  const cancelRejectBtn = container.querySelector('#btn-cancel-reject');
  const confirmRejectBtn = container.querySelector('#btn-confirm-reject');
  let selectedRejectId = null;

  const modalDelete = container.querySelector('#modal-delete-user');
  const deleteEmailText = container.querySelector('#delete-user-email');
  const deleteConfirmInput = container.querySelector('#delete-confirm-input');
  const cancelDeleteBtn = container.querySelector('#btn-cancel-delete');
  const confirmDeleteBtn = container.querySelector('#btn-confirm-delete');
  let selectedDeleteId = null;

  async function loadData() {
    const { data, error } = await membersService.listProfiles();
    if (error) {
      tableContainer.innerHTML = `<div class="p-6 text-center text-xs text-rose-500 font-medium">Gagal memuat data: ${escapeHtml(error.message || error)}</div>`;
      return;
    }
    membersCache = data || [];
    updateBadges();
    renderTable();
  }

  function updateBadges() {
    const pendingCount = membersCache.filter((m) => m.role === 'pending').length;
    const userCount = membersCache.filter((m) => m.role === 'user' || m.role === 'admin').length;
    const rejectedCount = membersCache.filter((m) => m.role === 'rejected').length;

    const bPending = container.querySelector('#badge-pending-count');
    const bUser = container.querySelector('#badge-user-count');
    const bRejected = container.querySelector('#badge-rejected-count');

    if (bPending) bPending.textContent = pendingCount;
    if (bUser) bUser.textContent = userCount;
    if (bRejected) bRejected.textContent = rejectedCount;
  }

  function renderTable() {
    let filtered = membersCache.filter((m) => {
      if (activeTab === 'pending') return m.role === 'pending';
      if (activeTab === 'user') return m.role === 'user' || m.role === 'admin';
      if (activeTab === 'rejected') return m.role === 'rejected';
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((m) =>
        (m.email || '').toLowerCase().includes(q) ||
        (m.full_name || '').toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      tableContainer.innerHTML = `
        <div class="p-12 text-center text-xs text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 text-slate-300"></i>
          <p>Tidak ada data pengguna dalam tab ini.</p>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Nama Lengkap</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Terdaftar</th>
              <th class="py-3 px-4">Status / Role</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${filtered.map((item) => {
      const isAdmin = item.role === 'admin';
      const isUser = item.role === 'user';
      const isPending = item.role === 'pending';
      const isRejected = item.role === 'rejected';

      let statusBadge = '';
      if (isAdmin) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">Admin</span>';
      } else if (isUser) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">User (Disetujui)</span>';
      } else if (isPending) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">Menunggu ACC</span>';
      } else {
        statusBadge = '<span class="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">Ditolak</span>';
      }

      const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

      return `
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-4 font-semibold text-slate-800">
                    ${escapeHtml(item.full_name || '(Tanpa Nama)')}
                  </td>
                  <td class="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    ${escapeHtml(item.email)}
                  </td>
                  <td class="py-3 px-4 text-slate-400">
                    ${dateStr}
                  </td>
                  <td class="py-3 px-4">
                    ${statusBadge}
                    ${item.rejection_reason ? `<p class="text-[10px] text-rose-600 mt-0.5">Alasan: ${escapeHtml(item.rejection_reason)}</p>` : ''}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      ${isPending ? `
                        <button type="button" data-action="approve" data-id="${item.id}"
                          class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm">
                          <i class="fa-solid fa-check mr-1"></i> Setujui
                        </button>
                        <button type="button" data-action="reject" data-id="${item.id}"
                          class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition">
                          <i class="fa-solid fa-xmark mr-1"></i> Tolak
                        </button>
                      ` : ''}

                      ${isUser && !isAdmin ? `
                        <button type="button" data-action="revoke" data-id="${item.id}"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition">
                          Cabut Akses
                        </button>
                      ` : ''}

                      ${isRejected ? `
                        <button type="button" data-action="approve" data-id="${item.id}"
                          class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm">
                          Setujui Kembali
                        </button>
                      ` : ''}

                      ${!isAdmin ? `
                        <button type="button" data-action="delete" data-id="${item.id}" data-email="${escapeHtml(item.email)}"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus akun permanen">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Pasang listener pada tombol aksi tabel
    tableContainer.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const email = btn.dataset.email;

        if (action === 'approve') {
          btn.disabled = true;
          const { error } = await membersService.approveUser(id);
          if (error) {
            showToast('Gagal menyetujui akun: ' + (error.message || error));
          } else {
            showToast('Akun berhasil disetujui.');
            await loadData();
          }
        } else if (action === 'reject') {
          selectedRejectId = id;
          rejectReasonInput.value = '';
          modalReject.classList.remove('hidden');
        } else if (action === 'revoke') {
          if (confirm('Cabut akses pengguna ini dan kembalikan ke status Menunggu?')) {
            btn.disabled = true;
            const { error } = await membersService.setUserRole(id, 'pending');
            if (error) {
              showToast('Gagal mencabut akses: ' + (error.message || error));
            } else {
              showToast('Akses berhasil dicabut.');
              await loadData();
            }
          }
        } else if (action === 'delete') {
          selectedDeleteId = id;
          deleteEmailText.textContent = email;
          deleteConfirmInput.value = '';
          confirmDeleteBtn.disabled = true;
          modalDelete.classList.remove('hidden');
        }
      });
    });
  }

  // Event modal Tolak
  cancelRejectBtn.addEventListener('click', () => {
    modalReject.classList.add('hidden');
    selectedRejectId = null;
  });

  confirmRejectBtn.addEventListener('click', async () => {
    if (!selectedRejectId) return;
    confirmRejectBtn.disabled = true;
    const reason = rejectReasonInput.value.trim();
    const { error } = await membersService.rejectUser(selectedRejectId, reason);
    confirmRejectBtn.disabled = false;
    modalReject.classList.add('hidden');

    if (error) {
      showToast('Gagal menolak akun: ' + (error.message || error));
    } else {
      showToast('Akun telah ditolak.');
      await loadData();
    }
  });

  // Event modal Hapus (Konfirmasi 2 Langkah)
  deleteConfirmInput.addEventListener('input', () => {
    confirmDeleteBtn.disabled = deleteConfirmInput.value.trim().toUpperCase() !== 'HAPUS';
  });

  cancelDeleteBtn.addEventListener('click', () => {
    modalDelete.classList.add('hidden');
    selectedDeleteId = null;
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!selectedDeleteId) return;
    confirmDeleteBtn.disabled = true;
    const { error } = await membersService.deleteUser(selectedDeleteId);
    confirmDeleteBtn.disabled = false;
    modalDelete.classList.add('hidden');

    if (error) {
      showToast('Gagal menghapus akun: ' + (error.message || error));
    } else {
      showToast('Akun berhasil dihapus permanen.');
      await loadData();
    }
  });

  // Event filter search & tabs
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
  });

  refreshBtn.addEventListener('click', loadData);

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      tabBtns.forEach((b) => {
        const isCurrent = b.dataset.tab === activeTab;
        b.className = `members-tab-btn flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${isCurrent ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`;
      });
      renderTable();
    });
  });

  // Realtime subscription untuk tabel profiles
  if (supabase) {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
    }
    realtimeChannel = supabase
      .channel('admin-members-watcher')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadData();
        }
      )
      .subscribe();
  }

  // Load awal
  loadData();
}

export function cleanupMembersRealtime() {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
}

