// src/services/members.js
// Layanan manajemen profil pengguna dan persetujuan admin.

import { supabase } from '../lib/supabase.js';

export async function listProfiles(roleFilter = null) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, reviewed_at, reviewed_by, rejection_reason')
      .order('created_at', { ascending: false });

    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    let { data, error } = await query;

    // Fallback untuk skema lama sebelum kolom baru ditambahkan
    if (error && error.code === '42703') {
      let fallbackQuery = supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });
      if (roleFilter) {
        fallbackQuery = fallbackQuery.eq('role', roleFilter);
      }
      const fallback = await fallbackQuery;
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const normalized = (data || []).map((p) => ({
      ...p,
      role: p.email === 'adminmodullab@ui.ac.id' ? 'admin' : (p.role === 'member' ? 'user' : p.role),
      full_name: p.full_name || ''
    }));

    return { data: normalized, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function approveUser(id) {
  return setUserRole(id, 'user');
}

export async function rejectUser(id, reason = '') {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'rejected',
        rejection_reason: reason.trim()
      })
      .eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function setUserRole(id, role) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  if (!['admin', 'user', 'pending', 'rejected'].includes(role)) {
    return { data: null, error: new Error('Role tidak valid.') };
  }
  try {
    const updateData = { role };
    if (role !== 'rejected') {
      updateData.rejection_reason = '';
    }
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteUser(id) {
  if (!supabase) return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
  try {
    // Memanggil fungsi RPC security definer admin_delete_user
    const { data, error } = await supabase.rpc('admin_delete_user', { p_user_id: id });
    if (error) throw error;
    return { data: data || true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Kompatibilitas mundur fungsi allowed_emails lama (deprecated)
export async function listMembers() {
  return listProfiles();
}

export async function updateMemberRole(id, role) {
  return setUserRole(id, role);
}

export async function listAllowedEmails() {
  return { data: [], error: null };
}

export async function addAllowedEmail() {
  return { data: null, error: new Error('Fitur allowed_emails sudah digantikan dengan alur persetujuan admin.') };
}

export async function removeAllowedEmail() {
  return { data: null, error: new Error('Fitur allowed_emails sudah digantikan dengan alur persetujuan admin.') };
}
