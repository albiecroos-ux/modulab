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

export async function signUp(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { data, error: null };
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
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
