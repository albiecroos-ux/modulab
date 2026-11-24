// src/services/auth.js
// Layanan autentikasi menggunakan Supabase Auth.

import { supabase } from '../lib/supabase.js';

export async function getSession() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signUp(email, password, fullName = '') {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName
        }
      }
    });
    if (error) throw error;

    let session = data?.session || null;

    // Jika Supabase belum mengembalikan sesi (misal auto-confirm aktif tapi session belum di-attach), coba signIn
    if (!session && data?.user) {
      try {
        const signInRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (signInRes.data?.session) {
          session = signInRes.data.session;
        }
      } catch (signInErr) {
        // Abaikan jika email belum dikonfirmasi
      }
    }

    // Fallback upsert profiles dari sisi klien untuk menjamin data pasti masuk ke tabel profiles
    if (data?.user?.id) {
      const initialRole = cleanEmail === 'adminmodullab@ui.ac.id' ? 'admin' : 'pending';
      try {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: cleanEmail,
            role: initialRole,
            full_name: cleanName
          }, { onConflict: 'id' });

        if (upsertErr && upsertErr.code === '42703') {
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: cleanEmail,
              role: initialRole
            }, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Fallback upsert profile client-side:', err);
      }
    }

    return { data: { ...data, session }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getProfile(userId) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    let { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    // Fallback jika kolom baru belum ada di database Supabase (error 42703)
    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
      if (data) {
        data.full_name = data.full_name || '';
      }
    }

    if (error) throw error;

    // Normalisasi role lama (member -> user) dan deteksi admin utama
    if (data) {
      if (data.email === 'adminmodullab@ui.ac.id') {
        data.role = 'admin';
      } else if (data.role === 'member') {
        data.role = 'user';
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function resetPasswordForEmail(email, redirectTo) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const options = {};
    if (redirectTo) {
      options.redirectTo = redirectTo;
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateUserPassword(password) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange(callback);
}
