import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { projectsService } from '../../services/projectsService';
import { siteSettingsService } from '../../services/siteSettingsService';
import { inquiriesService } from '../../services/inquiriesService';
import { uploadService, formatBytes } from '../../services/uploadService';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { Project, SiteSettings, Inquiry, UploadState, ProjectCategory } from '../../types';
import {
  Film,
  UploadCloud,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Pause,
  ShieldAlert,
  ArrowLeft,
  Search,
  ExternalLink,
  Lock,
  Save,
  HardDrive,
} from 'lucide-react';

const CATEGORIES: ProjectCategory[] = [
  'Cinematic Edits',
  'Commercial and Brand Videos',
  'Reels and Short-Form Content',
  'Documentary and Storytelling',
  'Motion Graphics',
  'Social Media Edits',
  'Other',
];

export const AdminDashboard: React.FC = () => {
  // Check development mode authorization flag
  const isDevelopmentEnvironment =
    import.meta.env.DEV || import.meta.env.VITE_DEV_ADMIN_ENABLED === 'true';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isDevelopmentEnvironment);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'upload' | 'settings' | 'inquiries'>('overview');

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Projects filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Editing Project Modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Upload Form State
  const [uploadVideoFile, setUploadVideoFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Cinematic Edits' as ProjectCategory,
    tags: 'Cinematic, Color Grading',
    client_name: '',
    project_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    role_description: '',
    tools_used: 'DaVinci Resolve Studio, Adobe Premiere Pro',
    video_duration_seconds: 60,
    is_featured: false,
    is_published: true,
  });

  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    speed: '0 MB/s',
    estimatedTimeRemaining: '0s',
  });
  const uploadControllerRef = useRef<any>(null);

  // Load all initial admin data
  const loadDashboardData = async () => {
    try {
      const [projList, siteSet, inqList] = await Promise.all([
        projectsService.getProjects(),
        siteSettingsService.getSettings(),
        inquiriesService.getInquiries(),
      ]);
      setProjects(projList);
      setSettings(siteSet);
      setInquiries(inqList);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Handle Supabase Auth Login in production mode
  const handleProductionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!isSupabaseConfigured() || !supabase) {
      setAuthError('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      if (data.session) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  // Toggle published status
  const handleTogglePublish = async (project: Project) => {
    try {
      const updated = await projectsService.updateProject(project.id, {
        is_published: !project.is_published,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice({
        type: 'success',
        message: `Project "${project.title}" is now ${updated.is_published ? 'Published' : 'Draft'}.`,
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Delete project
  const confirmDeleteProject = async () => {
    if (!deletingProjectId) return;
    try {
      await projectsService.deleteProject(deletingProjectId);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProjectId));
      setDeletingProjectId(null);
      setNotice({ type: 'success', message: 'Project removed successfully.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Delete operation failed.' });
    }
  };

  // Handle File Selection for Upload
  const handleVideoSelect = (file: File) => {
    setUploadVideoFile(file);
    if (!uploadForm.title) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadForm((prev) => ({
        ...prev,
        title: nameWithoutExt.replace(/[-_]/g, ' '),
      }));
    }
  };

  const handlePosterSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setPosterPreview(url);
  };

  // Start Resumable Upload
  const handleStartUpload = () => {
    if (!uploadVideoFile) {
      setNotice({ type: 'error', message: 'Please select a video file (MP4/MOV up to 2 GB) to upload.' });
      return;
    }

    const { controller } = uploadService.startTusVideoUpload(uploadVideoFile, {
      bucketName: 'portfolio-videos',
      onStateChange: async (state) => {
        setUploadState(state);

        // Upload completed! Now save to database
        if (state.status === 'completed') {
          try {
            const tagsArray = uploadForm.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
            const toolsArray = uploadForm.tools_used
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);

            const newProj = await projectsService.createProject({
              title: uploadForm.title || uploadVideoFile.name,
              description: uploadForm.description || 'Cinematic video edit produced by Krishna Patil.',
              category: uploadForm.category,
              tags: tagsArray,
              client_name: uploadForm.client_name || null,
              project_date: uploadForm.project_date || 'October 2026',
              thumbnail_path: posterPreview || '/thumbnails/tokyo-noir.jpg',
              original_video_path: state.storagePath || `portfolio-videos/${uploadVideoFile.name}`,
              playback_video_path: state.publicUrl || null,
              video_duration_seconds: Number(uploadForm.video_duration_seconds) || 60,
              video_size_bytes: uploadVideoFile.size,
              is_featured: uploadForm.is_featured,
              is_published: uploadForm.is_published,
              role_description: uploadForm.role_description,
              tools_used: toolsArray,
            });

            setProjects((prev) => [newProj, ...prev]);
            setNotice({
              type: 'success',
              message: `Upload complete! Project "${newProj.title}" created successfully.`,
            });
            // Reset upload form
            setUploadVideoFile(null);
            setPosterPreview(null);
          } catch (err: any) {
            setNotice({ type: 'error', message: `Upload succeeded, but metadata save failed: ${err.message}` });
          }
        }
      },
    });

    uploadControllerRef.current = controller;
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await siteSettingsService.updateSettings(settings);
      setSettings(updated);
      setNotice({ type: 'success', message: 'Profile settings saved successfully!' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update settings.' });
    }
  };

  // Update Inquiry Status
  const handleInquiryStatus = async (id: string, status: Inquiry['status']) => {
    try {
      await inquiriesService.updateInquiryStatus(id, status);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
      );
      setNotice({ type: 'success', message: `Inquiry marked as ${status}.` });
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to update inquiry status.' });
    }
  };

  // If in production and not authenticated, render strict login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#0f1017] border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-white">Studio Administrator</h1>
              <p className="text-xs text-neutral-400">Krishna Patil Post-Production</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Production Security Mode Active</span>
            </div>
            <p>
              Anonymous development bypass is disabled. Please authenticate with your authorized Supabase administrator account to manage projects.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleProductionLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="kpctech1234@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Sign In To Studio Admin
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-neutral-500 hover:text-white transition-colors">
              ← Return To Public Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200">
      {/* Top Banner for Development Mode status */}
      <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-5 py-2 text-[11px] font-mono text-indigo-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {isDevelopmentEnvironment
              ? 'LOCAL DEVELOPMENT MODE: Direct testing enabled. Production build fails closed to Supabase Auth.'
              : 'AUTHENTICATED SESSION: Supabase Administrator'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            Supabase Status: {isSupabaseConfigured() ? 'Connected' : 'Offline / Local State Mode'}
          </span>
          <Link to="/" className="text-white hover:text-indigo-300 flex items-center gap-1">
            <span>View Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Admin Navigation Bar */}
      <header className="border-b border-white/5 bg-[#0b0c11] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-neutral-400 hover:text-white transition-colors p-1" title="Back to site">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 font-display font-bold text-white text-base">
              <Film className="w-5 h-5 text-indigo-400" />
              <span>Studio Manager</span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-neutral-400">
              Krishna Patil Portfolio
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upload Video
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                activeTab === 'inquiries' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Inquiries
              {inquiries.filter((i) => i.status === 'new').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-[10px] text-white">
                  {inquiries.filter((i) => i.status === 'new').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notice && (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-xs uppercase font-mono tracking-wider opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-[#0f1017] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                  <span>Published Edits</span>
                  <Film className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  {projects.filter((p) => p.is_published).length}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Visible to all portfolio visitors
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1017] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                  <span>Draft Projects</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  {projects.filter((p) => !p.is_published).length}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Unpublished or pending edits
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1017] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                  <span>Client Inquiries</span>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  {inquiries.length}
                </div>
                <div className="text-[11px] text-emerald-400">
                  {inquiries.filter((i) => i.status === 'new').length} new unread leads
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1017] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                  <span>Total Video Master Data</span>
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  {formatBytes(projects.reduce((acc, p) => acc + (p.video_size_bytes || 0), 0))}
                </div>
                <div className="text-[11px] text-neutral-400">
                  High-res masters tracked
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Projects List */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0e0f16] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-display text-white">
                    Recent Portfolio Projects
                  </h2>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Video</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {projects.slice(0, 5).map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnail_path}
                          alt={p.title}
                          className="w-14 h-9 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="text-sm font-semibold text-white">{p.title}</div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            {p.category} • {p.project_date || '2026'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePublish(p)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium ${
                            p.is_published
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {p.is_published ? 'Published' : 'Draft'}
                        </button>
                        <Link
                          to={`/work/${p.slug}`}
                          className="p-1.5 text-neutral-400 hover:text-white"
                          title="Open case study"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TUS Upload Architecture Notice */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0e0f16] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider">
                  <UploadCloud className="w-4 h-4" />
                  <span>1–2 GB Upload Infrastructure</span>
                </div>
                <h3 className="text-base font-bold font-display text-white">
                  Resumable TUS Engine
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  The portfolio uses <strong className="text-white">tus-js-client</strong> configured with standard <strong className="text-white">6 MiB chunk sizes</strong>. Video uploads can safely pause, resume, and survive network disconnects.
                </p>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Chunk Size</span>
                    <span>6 MiB (6,291,456 B)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Max Config Limit</span>
                    <span>5 GB (Pro Tier)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Free Tier Limit</span>
                    <span className="text-amber-400">50 MB max</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('upload')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Go To Upload Studio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS MANAGER */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Header with Search and New Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search projects by title, category, or tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0f1017] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#0f1017] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 shrink-0"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Video Project</span>
                </button>
              </div>
            </div>

            {/* Projects Table */}
            <div className="rounded-2xl bg-[#0e0f16] border border-white/5 overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4 hidden md:table-cell">Category</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Duration</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Master Size</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-neutral-300">
                  {projects
                    .filter((p) => {
                      const matchesSearch =
                        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                      const matchesCategory =
                        filterCategory === 'All' || p.category === filterCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail_path}
                              alt={p.title}
                              className="w-16 h-10 object-cover rounded-lg border border-white/10 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-white">{p.title}</div>
                              <div className="text-[11px] text-neutral-500 font-mono">
                                /{p.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-neutral-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell font-mono">
                          {p.video_duration_seconds ? `${p.video_duration_seconds}s` : '--'}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell font-mono">
                          {p.video_size_bytes ? formatBytes(p.video_size_bytes) : '--'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePublish(p)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                              p.is_published
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            }`}
                          >
                            {p.is_published ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/work/${p.slug}`}
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5"
                              title="Preview project page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setEditingProject(p)}
                              className="p-1.5 text-neutral-400 hover:text-indigo-400 rounded-lg hover:bg-white/5"
                              title="Edit project"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProjectId(p.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RESUMABLE VIDEO UPLOADER (TUS) */}
        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">
                Resumable 1–2 GB Video Upload Studio
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Upload 4K cinematic edits and masters safely using chunked TUS transfers with pause, resume, and real-time speed monitoring.
              </p>
            </div>

            {/* Video File Drop Zone */}
            <div className="p-8 rounded-3xl bg-[#0f1017] border-2 border-dashed border-white/15 hover:border-indigo-500/50 transition-colors text-center relative group">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleVideoSelect(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                {uploadVideoFile ? (
                  <div>
                    <div className="text-base font-bold text-white">{uploadVideoFile.name}</div>
                    <div className="text-xs font-mono text-indigo-400 mt-1">
                      File Size: {formatBytes(uploadVideoFile.size)} • Type: {uploadVideoFile.type || 'video/mp4'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-base font-semibold text-white">
                      Drag and drop master video file here, or click to browse
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      Supports ProRes MOV, MP4, WebM up to 2 GB (6 MiB chunking)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress Bar (When Active) */}
            {uploadState.status !== 'idle' && (
              <div className="p-6 rounded-2xl bg-[#0e0f16] border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300 font-semibold">
                    Status: <span className="uppercase text-indigo-400">{uploadState.status}</span>
                  </span>
                  <span className="text-white font-bold">{uploadState.progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>

                {/* Speed, ETA, and Transfer Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-neutral-400 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-neutral-500 block">Uploaded</span>
                    <span className="text-white">{formatBytes(uploadState.bytesUploaded)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Total</span>
                    <span className="text-white">{formatBytes(uploadState.totalBytes)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Speed</span>
                    <span className="text-indigo-400">{uploadState.speed}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Estimated Time</span>
                    <span className="text-white">{uploadState.estimatedTimeRemaining}</span>
                  </div>
                </div>

                {/* Controller Buttons: Pause / Resume / Cancel */}
                <div className="pt-2 flex items-center gap-3">
                  {uploadState.status === 'uploading' && (
                    <button
                      type="button"
                      onClick={() => uploadControllerRef.current?.pause()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Transfer</span>
                    </button>
                  )}

                  {uploadState.status === 'paused' && (
                    <button
                      type="button"
                      onClick={() => uploadControllerRef.current?.resume()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Transfer</span>
                    </button>
                  )}

                  {uploadState.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => uploadControllerRef.current?.abort()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-300 border border-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Upload</span>
                    </button>
                  )}
                </div>

                {uploadState.errorMessage && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                    {uploadState.errorMessage}
                  </div>
                )}
              </div>
            )}

            {/* Project Metadata Form */}
            <div className="p-8 rounded-3xl bg-[#0f1017] border border-white/10 space-y-6">
              <h3 className="text-lg font-bold font-display text-white">
                Project Metadata & Display Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Velocity — Brand Film"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, category: e.target.value as ProjectCategory })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Project Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Cinematic description of the story, cadence, and visual atmosphere..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="Optional client"
                    value={uploadForm.client_name}
                    onChange={(e) => setUploadForm({ ...uploadForm, client_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Project Date
                  </label>
                  <input
                    type="text"
                    placeholder="October 2026"
                    value={uploadForm.project_date}
                    onChange={(e) => setUploadForm({ ...uploadForm, project_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={uploadForm.video_duration_seconds}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, video_duration_seconds: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags & Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Cinematic, Color Grading, 35mm"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Software & Tools Used
                  </label>
                  <input
                    type="text"
                    placeholder="DaVinci Resolve Studio, Premiere Pro"
                    value={uploadForm.tools_used}
                    onChange={(e) => setUploadForm({ ...uploadForm, tools_used: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Poster Image File Picker */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Thumbnail / Poster Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePosterSelect(e.target.files[0]);
                      }
                    }}
                    className="text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {posterPreview && (
                    <img
                      src={posterPreview}
                      alt="Thumbnail preview"
                      className="w-16 h-10 object-cover rounded-lg border border-white/10"
                    />
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={uploadForm.is_published}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_published: e.target.checked })}
                    className="rounded bg-neutral-800 border-white/20 text-indigo-600 focus:ring-0"
                  />
                  <span>Publish Immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={uploadForm.is_featured}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_featured: e.target.checked })}
                    className="rounded bg-neutral-800 border-white/20 text-indigo-600 focus:ring-0"
                  />
                  <span>Featured Project</span>
                </label>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={uploadState.status === 'uploading'}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <UploadCloud className="w-5 h-5" />
                <span>
                  {uploadState.status === 'uploading' ? 'Upload In Progress...' : 'Start Resumable TUS Upload & Save'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === 'settings' && settings && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">
                Site Profile & Brand Settings
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Update your biography, editing philosophy, portrait photo, and verified contact details.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-8 rounded-3xl bg-[#0f1017] border border-white/10 space-y-6">
              {/* Profile Photo Display & Path */}
              <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                <img
                  src={settings.portrait_url || '/krishna-patil.jpg'}
                  alt={settings.editor_name}
                  className="w-20 h-24 object-cover rounded-xl border border-white/10 shadow-lg"
                />
                <div className="space-y-1.5 flex-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Portrait Photo URL / Path
                  </label>
                  <input
                    type="text"
                    value={settings.portrait_url}
                    onChange={(e) => setSettings({ ...settings, portrait_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <div className="text-[10px] text-neutral-500">
                    Default is <code className="text-neutral-400">/krishna-patil.jpg</code> (real portrait).
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={settings.editor_name}
                    onChange={(e) => setSettings({ ...settings, editor_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Headline & Subheadline */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={settings.headline}
                  onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Hero Subheadline
                </label>
                <textarea
                  rows={2}
                  value={settings.subheadline}
                  onChange={(e) => setSettings({ ...settings, subheadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Biography */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Biography (About Krishna)
                </label>
                <textarea
                  rows={4}
                  value={settings.bio}
                  onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Philosophy */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Editing Philosophy
                </label>
                <textarea
                  rows={3}
                  value={settings.philosophy}
                  onChange={(e) => setSettings({ ...settings, philosophy: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Verified Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Verified Phone
                  </label>
                  <input
                    type="text"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: INQUIRIES MANAGER */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">
                Client Inquiries & Project Briefs
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Private inquiries submitted by prospective clients. Protected by Supabase Row Level Security.
              </p>
            </div>

            {inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-6 rounded-2xl bg-[#0e0f16] border border-white/5 space-y-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div>
                        <div className="text-base font-bold text-white">{inq.name}</div>
                        <div className="text-xs font-mono text-indigo-400">{inq.email}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-neutral-400">
                          {new Date(inq.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>

                        <select
                          value={inq.status}
                          onChange={(e) =>
                            handleInquiryStatus(inq.id, e.target.value as Inquiry['status'])
                          }
                          className="px-2.5 py-1 rounded-md bg-[#08080a] border border-white/10 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-neutral-400">
                      <div>
                        <span className="text-neutral-500 block">Project Type:</span>
                        <span className="text-white">{inq.project_type}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Approx. Budget:</span>
                        <span className="text-white">{inq.budget_range || 'Flexible'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Deadline:</span>
                        <span className="text-white">{inq.deadline || 'Flexible'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {inq.brief}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={`mailto:${inq.email}?subject=Krishna Patil — Re: Your Video Project Inquiry`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <span>Reply via Email</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center rounded-2xl border border-white/5 bg-[#0e0f14]/50">
                <MessageSquare className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No inquiries yet</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  When potential clients submit the contact brief on your portfolio, inquiries will show here.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0f1017] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold font-display text-white">
              Delete Project?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300">
              Are you sure you want to permanently delete this video project? This will remove the record from your portfolio.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProjectId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl my-8 p-6 sm:p-8 rounded-3xl bg-[#0f1017] border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold font-display text-white">
                Edit Project: {editingProject.title}
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingProject.title}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#08080a] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-neutral-400 mb-1">Category</label>
                <select
                  value={editingProject.category}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      category: e.target.value as ProjectCategory,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#08080a] border border-white/10 text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono uppercase text-neutral-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#08080a] border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-neutral-400 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={editingProject.client_name || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, client_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#08080a] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-neutral-400 mb-1">Project Date</label>
                  <input
                    type="text"
                    value={editingProject.project_date || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, project_date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#08080a] border border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const updated = await projectsService.updateProject(
                      editingProject.id,
                      editingProject
                    );
                    setProjects((prev) =>
                      prev.map((p) => (p.id === updated.id ? updated : p))
                    );
                    setEditingProject(null);
                    setNotice({ type: 'success', message: 'Project updated successfully.' });
                  } catch (err: any) {
                    setNotice({ type: 'error', message: err.message || 'Update failed' });
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
