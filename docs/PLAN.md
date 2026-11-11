# Rencana Migrasi LabAssist ke Fullstack Supabase

Dokumen ini adalah hasil audit Tahap 0 (read-only) atas `index.html` lama (±2.393 baris)
dan rencana pemetaan ke struktur modular baru.

## 1. Kondisi awal

- Frontend satu file: `index.html` berisi seluruh markup 5 tab + ±90 fungsi JS inline.
- State global `appState` (`modules`, `troubleshooting`, `analogies`, `checklist`, `evalLogs`,
  `activeModuleId`) disimpan ke `localStorage` key `LABASSIST_PORTAL_V3_CRUD`.
- Supabase hanya dipakai untuk Auth Email/Password dan menyimpan seluruh `appState` sebagai
  satu baris JSON di `public.labassist_shared_state` (id = 1).
- Semua lampiran memakai `FileReader.readAsDataURL` sehingga base64 ikut masuk ke state/database.
- Semua akun yang berhasil daftar dapat mengubah seluruh data.

## 2. Peta fungsi lama → modul baru

| Fitur / fungsi lama | Lokasi lama | Modul baru |
| --- | --- | --- |
| `loadAppState`, `saveAppState`, `scheduleCloudSave` | baris 922–972 | dihapus; diganti `src/services/*` + `src/state.js` |
| Auth: `handleAuthSubmit`, `initializeAuthenticatedApp`, `signOut`, `updateAuthMode` | 974–1086 | `src/services/auth.js`, `src/main.js`, `src/views/auth` (inline) |
| `escapeHtml`, `parseYoutubeEmbed`, `renderMediaAttachmentBlock`, `showToast`, `switchTab`, `toggleMobileMenu` | 1113–1213 | `src/lib/ui.js` |
| Undo hapus / reset data | 1088–1110 | `src/state.js` (undo) + handler admin di `src/main.js` |
| Dashboard & statistik | 1216–1266 | `src/views/dashboard.js` |
| Builder modul + live preview + copy | 1269–1734 | `src/views/modules.js`, `src/services/modules.js` |
| Bank troubleshooting + filter | 1737–1923 | `src/views/troubleshooting.js`, `src/services/troubleshooting.js` |
| Glosarium & analogi + filter | 1926–2097 | `src/views/glossary.js`, `src/services/glossary.js` |
| Checklist | 2100–2210 | `src/views/checklist.js`, `src/services/checklist.js` |
| Log evaluasi + media | 2213–2354 | `src/views/checklist.js`, `src/services/evaluations.js` |
| `renderAllViews`, init | 2356–2390 | `src/main.js` |
| Upload base64 (semua form) | 1403–1435, 1604–1625, 1754–1771, 1942–1958, 2213–2230 | `src/services/storage.js` |
| Impor data lama | (baru) | `src/services/importLegacy.js` |
| Kelola anggota | (baru) | `src/services/members.js`, `src/views/members.js` |

## 3. Pemetaan state lama → tabel baru

| Field lama | Tabel |
| --- | --- |
| `modules[].title/duration/goal/tools` | `public.modules` |
| `modules[].steps[]` | `public.module_steps` (`position` menjaga urutan) |
| `modules[].attachments[]` | `public.module_attachments` |
| `troubleshooting[]` | `public.troubleshooting_cases` |
| `analogies[]` | `public.glossary_terms` |
| `checklist[]` | `public.checklist_items` |
| `evalLogs[]` | `public.eval_logs` |
| `activeModuleId` | state UI lokal (`src/state.js`), tidak disimpan ke DB |
| role akun | `public.profiles.role` + `public.allowed_emails` |
| file/base64 | bucket privat `lab-media`, kolom `media_url` menyimpan path |

## 4. Risiko yang ditemukan

1. **UUID vs angka**: id lama numerik, id baru UUID. Semua `onclick` harus memakai string
   berkutip; tidak boleh `Number(id)`.
2. **Autosave per ketikan**: input modul/langkah menyimpan ke cloud tiap `oninput`. Perlu
   debounce agar tidak membanjiri database.
3. **Undo hapus**: dulu snapshot seluruh `appState`. Sekarang harus re-insert baris; modul
   harus mengembalikan steps + attachments.
4. **Signed URL**: bucket privat, URL tampilan harus di-resolve async dan di-cache; data lama
   base64/URL eksternal tetap ditangani.
5. **Edit bersamaan**: realtime dapat menimpa form. Perlu deteksi fokus input dan menunda
   refresh.
6. **Pendaftaran terbuka**: trigger auth harus memetakan email ke `allowed_emails`; email
   lain menjadi `pending` tanpa akses data (RLS `is_member()`).
7. **Reset data contoh** bersifat destruktif; batasi untuk admin + konfirmasi.
8. **Tailwind/Font Awesome via CDN** dipertahankan agar tampilan identik; Vite hanya
   mem-bundle JS aplikasi.
