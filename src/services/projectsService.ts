import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Project, ProjectCategory } from '../types';
import { INITIAL_PROJECTS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'krishna_portfolio_projects_v1';

const getStoredLocalProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read projects from localStorage:', e);
    return INITIAL_PROJECTS;
  }
};

const saveStoredLocalProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Failed to save projects to localStorage:', e);
  }
};

export const projectsService = {
  async getProjects(category?: string, publishedOnly: boolean = false): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('projects').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
        if (publishedOnly) {
          query = query.eq('is_published', true);
        }
        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) return data as Project[];
        // Fallback to local showcase if database is empty
      } catch (err) {
        console.warn('Supabase query error, falling back to local showcase data:', err);
      }
    }

    // Local / Offline fallback
    let list = getStoredLocalProjects();
    if (publishedOnly) {
      list = list.filter((p) => p.is_published);
    }
    if (category && category !== 'All') {
      list = list.filter((p) => p.category === category);
    }
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async getProjectBySlug(slug: string): Promise<Project | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('projects').select('*').eq('slug', slug).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data as Project;
      } catch (err) {
        console.warn('Supabase getProjectBySlug error, falling back to local data:', err);
      }
    }

    const list = getStoredLocalProjects();
    const found = list.find((p) => p.slug === slug);
    return found || null;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const slug = (projectData.slug || projectData.title || 'untitled')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: projectData.title || 'Untitled Project',
      slug: slug || `project-${Date.now()}`,
      description: projectData.description || '',
      category: (projectData.category as ProjectCategory) || 'Cinematic Edits',
      tags: projectData.tags || [],
      client_name: projectData.client_name || null,
      project_date: projectData.project_date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      thumbnail_path: projectData.thumbnail_path || '/thumbnails/tokyo-noir.jpg',
      original_video_path: projectData.original_video_path || '',
      playback_video_path: projectData.playback_video_path || null,
      video_duration_seconds: projectData.video_duration_seconds || null,
      video_size_bytes: projectData.video_size_bytes || null,
      is_featured: Boolean(projectData.is_featured),
      is_published: projectData.is_published !== undefined ? projectData.is_published : true,
      sort_order: projectData.sort_order || 99,
      role_description: projectData.role_description || null,
      tools_used: projectData.tools_used || ['DaVinci Resolve Studio', 'Adobe Premiere Pro'],
      before_after_enabled: Boolean(projectData.before_after_enabled),
      before_thumbnail_path: projectData.before_thumbnail_path || null,
      after_thumbnail_path: projectData.after_thumbnail_path || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
        if (error) throw error;
        if (data) return data as Project;
      } catch (err) {
        console.warn('Supabase insert failed, saving to local state:', err);
      }
    }

    const list = getStoredLocalProjects();
    const updated = [newProject, ...list];
    saveStoredLocalProjects(updated);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const updatedFields = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('projects').update(updatedFields).eq('id', id).select().single();
        if (error) throw error;
        if (data) return data as Project;
      } catch (err) {
        console.warn('Supabase update failed, modifying local state:', err);
      }
    }

    const list = getStoredLocalProjects();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    const modified = { ...list[index], ...updatedFields };
    list[index] = modified;
    saveStoredLocalProjects(list);
    return modified;
  },

  async deleteProject(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    const list = getStoredLocalProjects();
    const updated = list.filter((p) => p.id !== id);
    saveStoredLocalProjects(updated);
  },

  async reorderProjects(orderedIds: string[]): Promise<void> {
    const list = getStoredLocalProjects();
    const map = new Map(list.map((p) => [p.id, p]));
    const updatedList: Project[] = [];

    orderedIds.forEach((id, index) => {
      const p = map.get(id);
      if (p) {
        p.sort_order = index + 1;
        updatedList.push(p);
        map.delete(id);
      }
    });

    map.forEach((p) => {
      p.sort_order = updatedList.length + 1;
      updatedList.push(p);
    });

    saveStoredLocalProjects(updatedList);

    if (isSupabaseConfigured() && supabase) {
      try {
        for (const p of updatedList) {
          await supabase.from('projects').update({ sort_order: p.sort_order }).eq('id', p.id);
        }
      } catch (err) {
        console.warn('Supabase reorder failed:', err);
      }
    }
  },

  async resetDemoProjects(): Promise<Project[]> {
    saveStoredLocalProjects(INITIAL_PROJECTS);
    return INITIAL_PROJECTS;
  },
};
