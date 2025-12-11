import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveProfile = async (profile: any) => {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .upsert(profile)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving profile:', error);
    return null;
  }
};

export const loadProfile = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

export const saveGameHistory = async (history: any) => {
  try {
    const { data, error } = await supabase
      .from('game_history')
      .insert(history)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving history:', error);
    return null;
  }
};

export const loadGameHistory = async (playerId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('player_id', playerId)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};
