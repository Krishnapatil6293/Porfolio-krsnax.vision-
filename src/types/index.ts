export type ProjectCategory = 
  | 'Cinematic Edits'
  | 'Reels and Short-Form Content'
  | 'Commercial and Brand Videos'
  | 'Social Media Edits'
  | 'Motion Graphics'
  | 'Documentary and Storytelling'
  | 'Other';

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  client_name?: string | null;
  project_date?: string | null;
  thumbnail_path: string;
  original_video_path: string;
  playback_video_path?: string | null;
  video_duration_seconds?: number | null;
  video_size_bytes?: number | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  role_description?: string | null;
  tools_used?: string[];
  before_after_enabled?: boolean;
  before_thumbnail_path?: string | null;
  after_thumbnail_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  editor_name: string;
  title: string;
  headline: string;
  subheadline: string;
  bio: string;
  philosophy: string;
  portrait_url: string;
  availability_status: string;
  skills: string[];
  social_links: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    vimeo?: string;
    twitter?: string;
  };
  contact_email: string;
  contact_phone: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  project_type: string;
  budget_range?: string;
  brief: string;
  deadline?: string;
  status: 'new' | 'contacted' | 'in_progress' | 'archived';
  created_at: string;
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'paused' | 'processing' | 'completed' | 'error';
  progress: number; // 0 to 100
  bytesUploaded: number;
  totalBytes: number;
  speed: string; // e.g. "4.2 MB/s"
  estimatedTimeRemaining: string; // e.g. "45s"
  errorMessage?: string;
  storagePath?: string;
  publicUrl?: string;
}
