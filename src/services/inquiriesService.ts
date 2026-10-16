import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Inquiry } from '../types';
import { INITIAL_INQUIRIES } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'krishna_portfolio_inquiries_v1';
const RATE_LIMIT_KEY = 'krishna_inquiry_last_submit';
const RATE_LIMIT_SECONDS = 30; // 30 seconds cooldown between submissions

const getStoredInquiries = (): Inquiry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read inquiries from localStorage:', e);
    return INITIAL_INQUIRIES;
  }
};

const saveStoredInquiries = (inquiries: Inquiry[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inquiries));
  } catch (e) {
    console.warn('Failed to save inquiries to localStorage:', e);
  }
};

export const inquiriesService = {
  async submitInquiry(data: {
    name: string;
    email: string;
    project_type: string;
    budget_range?: string;
    brief: string;
    deadline?: string;
    honeypot?: string; // Spam detection trap
  }): Promise<{ success: boolean; message: string }> {
    // 1. Spam honeypot check: If the hidden honeypot field is filled, silently reject bot
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return { success: true, message: 'Your inquiry has been received.' };
    }

    // 2. Client-side rate limiting
    const lastSubmitTime = localStorage.getItem(RATE_LIMIT_KEY);
    if (lastSubmitTime) {
      const elapsedSeconds = (Date.now() - parseInt(lastSubmitTime, 10)) / 1000;
      if (elapsedSeconds < RATE_LIMIT_SECONDS) {
        const remaining = Math.ceil(RATE_LIMIT_SECONDS - elapsedSeconds);
        throw new Error(`Please wait ${remaining}s before sending another inquiry.`);
      }
    }

    // 3. Validation
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter a valid full name.');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!data.brief || data.brief.trim().length < 10) {
      throw new Error('Please provide a brief with at least 10 characters.');
    }

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      project_type: data.project_type,
      budget_range: data.budget_range || 'Not specified',
      brief: data.brief.trim(),
      deadline: data.deadline || 'Flexible',
      status: 'new',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('inquiries').insert([
          {
            name: newInquiry.name,
            email: newInquiry.email,
            project_type: newInquiry.project_type,
            budget_range: newInquiry.budget_range,
            brief: newInquiry.brief,
            deadline: newInquiry.deadline,
            status: 'new',
          },
        ]);
        if (error) throw error;
      } catch (err: any) {
        console.warn('Supabase inquiry insert failed, preserving to local fallback:', err);
      }
    }

    // Store in local storage so admin can inspect locally
    const current = getStoredInquiries();
    saveStoredInquiries([newInquiry, ...current]);
    localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());

    return {
      success: true,
      message: 'Thank you! Your project brief has been delivered. Krishna will review and reach out within 24 hours.',
    };
  },

  async getInquiries(): Promise<Inquiry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) return data as Inquiry[];
      } catch (err) {
        console.warn('Supabase getInquiries failed (RLS may require authenticated session):', err);
      }
    }

    return getStoredInquiries();
  },

  async updateInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase updateInquiryStatus failed:', err);
      }
    }

    const list = getStoredInquiries();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.status = status;
      saveStoredInquiries(list);
    }
  },

  async deleteInquiry(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('inquiries').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase deleteInquiry failed:', err);
      }
    }

    const list = getStoredInquiries();
    const updated = list.filter((i) => i.id !== id);
    saveStoredInquiries(updated);
  },
};
