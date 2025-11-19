// src/services/profile.ts
// Profile management

import { supabase } from '../lib/supabaseClient';

export async function ensureProfile(userId: string, name?: string) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: name || 'New User'
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: {
  name?: string;
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  timezone?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

