import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, AlertCircle } from 'lucide-react';
import type { Project } from '../types';

interface VideoModalProps {
  project: Project | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ project, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!project) return;
    setVideoError(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Auto play when modal opens
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
        });
      }
    }, 200);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
      clearTimeout(timer);
    };
  }, [project, onClose]);

  if (!project) return null;

  const videoSource = project.playback_video_path || project.original_video_path;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl rounded-2xl bg-[#0c0d12] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#09090c]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {project.category}
            </span>
            <h2 id="video-modal-title" className="text-base font-semibold text-white font-display truncate max-w-md">
              {project.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/work/${project.slug}`}
              onClick={onClose}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <span>Full Case Study</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {videoSource && !videoError ? (
            <video
              ref={videoRef}
              src={videoSource}
              poster={project.thumbnail_path}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <img
                src={project.thumbnail_path}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-40"
              />
              <div className="relative z-10 bg-black/80 p-6 rounded-2xl border border-white/10 max-w-md">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">Direct Stream Unavailable</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Original high-res master file ({project.original_video_path}) is stored in Supabase Storage. You can review the full project details and editing workflow below.
                </p>
                <Link
                  to={`/work/${project.slug}`}
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  <span>Explore Case Study Breakdown</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        <div className="p-6 bg-[#0c0d12] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to={`/work/${project.slug}`}
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
            >
              <span>View Case Study</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
