import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SiteSettings } from '../types';
import { INITIAL_SITE_SETTINGS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'krishna_portfolio_settings_v1';

const getStoredLocalSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SITE_SETTINGS));
      return INITIAL_SITE_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read settings from localStorage:', e);
    return INITIAL_SITE_SETTINGS;
  }
};

const saveStoredLocalSettings = (settings: SiteSettings): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
};

export const siteSettingsService = {
  async getSettings(): Promise<SiteSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'global').single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data as SiteSettings;
      } catch (err) {
        console.warn('Supabase site_settings query failed, falling back to local settings:', err);
      }
    }

    return getStoredLocalSettings();
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = getStoredLocalSettings();
    const updated: SiteSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .upsert({ ...updated, id: 'global' })
          .select()
          .single();
        if (error) throw error;
        if (data) {
          saveStoredLocalSettings(data as SiteSettings);
          return data as SiteSettings;
        }
      } catch (err) {
        console.warn('Supabase site_settings update failed:', err);
      }
    }

    saveStoredLocalSettings(updated);
    return updated;
  },

  async resetSettings(): Promise<SiteSettings> {
    saveStoredLocalSettings(INITIAL_SITE_SETTINGS);
    return INITIAL_SITE_SETTINGS;
  },
};
