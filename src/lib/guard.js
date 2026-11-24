// src/lib/guard.js
// Route guard untuk menentukan izin akses berdasarkan sesi dan role profiles.

import { sessionState } from './session.js';

export const PUBLIC_ROUTES = new Set([
  '#/',
  '#/login',
  '#/daftar',
  '#/lupa-password',
  '#/reset-password',
  '#/admin/login'
]);

/**
 * Mengevaluasi apakah rute target diizinkan untuk keadaan sesi saat ini.
 * Mengembalikan: { allowed: boolean, redirect: string | null }
 */
export function checkRouteAccess(targetPath) {
  const path = targetPath || '#/';
  const { session, role, loading, error } = sessionState;

  // Jika masih proses inisialisasi, jangan tolak atau izinkan langsung (tampilkan loader)
  if (loading) {
    return { allowed: false, redirect: null, loading: true };
  }

  // Jika ada sesi tapi gagal mengambil profil dan tidak ada role fallback
  if (session && !role && error) {
    return { allowed: false, redirect: null, loading: false, error };
  }

  // 1. Belum login
  if (!session) {
    if (PUBLIC_ROUTES.has(path)) {
      return { allowed: true, redirect: null, loading: false };
    }
    // Akses rute terlindungi tanpa login dialihkan ke landing #/
    return { allowed: false, redirect: '#/', loading: false };
  }

  // Normalisasi role pengguna (termasuk kompatibilitas role 'member' lama dan email admin)
  const effectiveRole = sessionState.user?.email === 'adminmodullab@ui.ac.id'
    ? 'admin'
    : (role === 'member' ? 'user' : role);

  // 2. Sudah login - buka rute auth publik (login, daftar, landing)
  // Harus diarahkan ke tujuan yang sesuai role
  const isAuthPage = ['#/', '#/login', '#/daftar', '#/admin/login'].includes(path);

  // 3. Evaluasi berdasarkan role pengguna
  if (effectiveRole === 'pending') {
    if (path === '#/menunggu') {
      return { allowed: true, redirect: null, loading: false };
    }
    return { allowed: false, redirect: '#/menunggu', loading: false };
  }

  if (effectiveRole === 'rejected') {
    if (path === '#/ditolak') {
      return { allowed: true, redirect: null, loading: false };
    }
    return { allowed: false, redirect: '#/ditolak', loading: false };
  }

  if (effectiveRole === 'user') {
    if (path.startsWith('#/admin')) {
      return { allowed: false, redirect: '#/app', loading: false };
    }
    if (isAuthPage) {
      return { allowed: false, redirect: '#/app', loading: false };
    }
    if (path === '#/menunggu' || path === '#/ditolak') {
      return { allowed: false, redirect: '#/app', loading: false };
    }
    return { allowed: true, redirect: null, loading: false };
  }

  if (effectiveRole === 'admin') {
    if (isAuthPage) {
      return { allowed: false, redirect: '#/app', loading: false };
    }
    if (path === '#/menunggu' || path === '#/ditolak') {
      return { allowed: false, redirect: '#/app', loading: false };
    }
    return { allowed: true, redirect: null, loading: false };
  }

  // Default fallback bila role belum terdefinisi namun ada session
  return { allowed: false, redirect: '#/menunggu', loading: false };
}
