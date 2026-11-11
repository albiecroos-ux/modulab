import { supabase } from '../lib/supabase.js';
import { normalizeEmail } from '../state.js';

export async function listMembers() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateMemberRole(id, role) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  if (!['admin', 'member', 'pending'].includes(role)) {
    return { data: null, error: new Error('Role tidak valid.') };
  }
  try {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function listAllowedEmails() {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('email, role, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addAllowedEmail(email, role, userId) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { data: null, error: new Error('Format email tidak valid.') };
  }
  if (!['admin', 'member'].includes(role)) {
    return { data: null, error: new Error('Role harus admin atau member.') };
  }
  try {
    const { error } = await supabase.from('allowed_emails').upsert(
      { email: normalized, role, created_by: userId || null },
      { onConflict: 'email' }
    );
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function removeAllowedEmail(email) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('email', normalizeEmail(email));
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
