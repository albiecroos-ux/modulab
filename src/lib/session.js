// src/lib/session.js
// Pengelola state sesi global dan profil pengguna dengan Supabase Auth & Realtime.

import { supabase } from './supabase.js';
import * as authService from '../services/auth.js';

export const sessionState = {
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  error: null
};

const listeners = new Set();
let profileSubscription = null;

export function getSessionState() {
  return sessionState;
}

export function onSessionChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifySessionListeners() {
  listeners.forEach((callback) => {
    try {
      callback({ ...sessionState });
    } catch (err) {
      console.error('Error in session change listener:', err);
    }
  });
}

export async function refreshProfile() {
  if (!sessionState.user?.id) {
    sessionState.profile = null;
    sessionState.role = null;
    notifySessionListeners();
    return null;
  }
  
  const { data: profile, error } = await authService.getProfile(sessionState.user.id);
  if (error) {
    console.warn('Gagal mengambil profil:', error);
    sessionState.error = error;
    // Fallback role untuk admin utama bila ada kendala query
    if (sessionState.user.email === 'adminmodullab@ui.ac.id') {
      sessionState.role = 'admin';
    }
  } else {
    sessionState.profile = profile || null;
    sessionState.role = profile?.role || (sessionState.user.email === 'adminmodullab@ui.ac.id' ? 'admin' : null);
    sessionState.error = null;
  }
  notifySessionListeners();
  return sessionState.profile;
}

function setupProfileRealtime(userId) {
  if (profileSubscription) {
    profileSubscription.unsubscribe();
    profileSubscription = null;
  }
  if (!userId || !supabase) return;

  profileSubscription = supabase
    .channel(`profile-watcher-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        if (payload?.new) {
          const newProfile = { ...payload.new };
          if (newProfile.email === 'adminmodullab@ui.ac.id') {
            newProfile.role = 'admin';
          } else if (newProfile.role === 'member') {
            newProfile.role = 'user';
          }
          sessionState.profile = newProfile;
          sessionState.role = newProfile.role || null;
          sessionState.error = null;
          notifySessionListeners();
        }
      }
    )
    .subscribe();
}

export async function initSession() {
  sessionState.loading = true;
  sessionState.error = null;
  sessionState.profile = null;
  sessionState.role = null;
  notifySessionListeners();

  try {
    const { data: session, error } = await authService.getSession();
    if (error) throw error;
    sessionState.session = session;
    sessionState.user = session?.user || null;

    if (sessionState.user?.id) {
      await refreshProfile();
      setupProfileRealtime(sessionState.user.id);
    } else {
      sessionState.profile = null;
      sessionState.role = null;
    }
  } catch (err) {
    console.error('Error inisialisasi sesi:', err);
    sessionState.error = err;
  } finally {
    sessionState.loading = false;
    notifySessionListeners();
  }

  // Dengarkan perubahan autentikasi Supabase
  authService.onAuthStateChange(async (event, newSession) => {
    sessionState.session = newSession;
    sessionState.user = newSession?.user || null;

    if (event === 'SIGNED_OUT') {
      if (profileSubscription) {
        profileSubscription.unsubscribe();
        profileSubscription = null;
      }
      sessionState.profile = null;
      sessionState.role = null;
      sessionState.error = null;
      sessionState.loading = false;
      notifySessionListeners();
    } else if (newSession?.user?.id) {
      await refreshProfile();
      setupProfileRealtime(newSession.user.id);
      sessionState.loading = false;
      notifySessionListeners();
    }
  });
}

export async function clearSession() {
  if (profileSubscription) {
    profileSubscription.unsubscribe();
    profileSubscription = null;
  }
  sessionState.session = null;
  sessionState.user = null;
  sessionState.profile = null;
  sessionState.role = null;
  sessionState.error = null;
  sessionState.loading = false;
  notifySessionListeners();
  await authService.signOut();
}
