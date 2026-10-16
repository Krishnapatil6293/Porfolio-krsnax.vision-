import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsService } from '../services/projectsService';
import type { Project } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProjectCard } from '../components/ProjectCard';
import { VideoModal } from '../components/VideoModal';
import {
  ArrowLeft,
  Clock,
  HardDrive,
  Calendar,
  Layers,
  Wrench,
  Sparkles,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Film,
} from 'lucide-react';

export const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [modalProject, setModalProject] = useState<Project | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const found = await projectsService.getProjectBySlug(slug);
        setProject(found);

        const all = await projectsService.getProjects();
        if (found) {
          const related = all
            .filter((p) => p.id !== found.id && (p.category === found.category || p.is_featured))
            .slice(0, 3);
          setRelatedProjects(related);
        }
      } catch (err) {
        console.error('Error loading project details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-neutral-400">Loading project data...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center text-center px-4">
        <Film className="w-12 h-12 text-neutral-400 mb-4" />
        <h1 className="text-2xl font-bold font-display text-white">Project Not Found</h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-sm">
          The requested video project could not be found or has been unpublished.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return To Portfolio</span>
        </Link>
      </div>
    );
  }

  const videoSource = project.playback_video_path || project.original_video_path;

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200">
      <Navbar />

      {/* Main Container */}
      <main className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Breadcrumb & Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/#work"
              className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back To Selected Works</span>
            </Link>

            <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-indigo-400">
              {project.category}
            </span>
          </div>

          {/* Project Header Info */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display text-white tracking-tight">
              {project.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
              {project.client_name && (
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">Client:</span>
                  <span className="text-neutral-200">{project.client_name}</span>
                </div>
              )}

              {project.project_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{project.project_date}</span>
                </div>
              )}

              {project.video_duration_seconds && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{formatDuration(project.video_duration_seconds)}</span>
                </div>
              )}

              {project.video_size_bytes && (
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Master: {formatFileSize(project.video_size_bytes)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Large Cinematic Video Player */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-12">
            {videoSource ? (
              <video
                src={videoSource}
                poster={project.thumbnail_path}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={project.thumbnail_path}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Two-Column Deep Dive Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 mb-16">
            {/* Left: Narrative & Editing Strategy */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-3">
                  Project Overview
                </h2>
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {project.role_description && (
                <div>
                  <h2 className="text-xl font-bold font-display text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Role & Editing Techniques</span>
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed bg-[#0e0f16] p-6 rounded-2xl border border-white/5">
                    {project.role_description}
                  </p>
                </div>
              )}

              {/* Before & After Interactive Slider (if enabled or present) */}
              <div className="p-6 rounded-2xl bg-[#0f1017] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold font-display text-white">
                      Color Grade & Finishing Breakdown
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Drag slider to inspect raw uncorrected footage versus final ACES color graded master.
                    </p>
                  </div>
                  <Sliders className="w-4 h-4 text-indigo-400" />
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 select-none">
                  {/* Graded Image (Right / Underneath) */}
                  <img
                    src={project.thumbnail_path}
                    alt="Graded Master"
                    className="absolute inset-0 w-full h-full object-cover filter contrast-110 saturate-105"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400 border border-white/10">
                    FINAL GRADE
                  </div>

                  {/* Raw Log Image (Left / Clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={project.thumbnail_path}
                      alt="Raw Log Profile"
                      className="absolute inset-0 w-full h-full object-cover filter saturate-50 brightness-110 contrast-75"
                      style={{ width: '100vw', maxWidth: 'none' }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-neutral-400 border border-white/10">
                      RAW LOG
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-black pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shadow-md">
                      ↔
                    </div>
                  </div>

                  {/* Invisible Range Input */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    aria-label="Before and after comparison slider"
                  />
                </div>
              </div>
            </div>

            {/* Right: Technical Spec Sheet & Tools */}
            <div className="lg:col-span-4 space-y-6">
              {/* Tools Used Card */}
              <div className="p-6 rounded-2xl bg-[#0f1017] border border-white/8 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Software & Toolchain</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(project.tools_used || ['DaVinci Resolve Studio', 'Adobe Premiere Pro']).map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-neutral-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{tool}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Master File Metadata Card */}
              <div className="p-6 rounded-2xl bg-[#0f1017] border border-white/8 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Delivery Specifications</span>
                </h3>

                <div className="space-y-2 text-xs font-mono text-neutral-400">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Source Master</span>
                    <span className="text-white">Apple ProRes 422 HQ</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Aspect Ratio</span>
                    <span className="text-white">16:9 DCI Widescreen</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Color Space</span>
                    <span className="text-white">Rec.709 / ACEScc</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Audio Master</span>
                    <span className="text-white">24-bit 48kHz Stereo</span>
                  </div>
                </div>
              </div>

              {/* Project Tags */}
              <div className="p-6 rounded-2xl bg-[#0f1017] border border-white/8">
                <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  Keywords & Categories
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono text-neutral-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-[#0e0f17] border border-indigo-500/30 text-center space-y-4">
                <h3 className="text-base font-bold font-display text-white">
                  Have a Similar Video Project?
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Let's discuss how we can elevate your raw footage into an impactful, cinema-grade cut.
                </p>
                <Link
                  to="/#contact"
                  className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <span>Discuss This Project</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Related Projects Section */}
          {relatedProjects.length > 0 && (
            <div className="pt-12 border-t border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold font-display text-white">
                    Related Projects
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Explore similar cinematic and commercial edits.
                  </p>
                </div>
                <Link
                  to="/#work"
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View All Portfolio →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onPlayClick={(item) => setModalProject(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Video Modal if user clicks on related project */}
      <VideoModal
        project={modalProject}
        onClose={() => setModalProject(null)}
      />
    </div>
  );
};
