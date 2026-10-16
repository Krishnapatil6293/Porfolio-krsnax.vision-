import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onPlayClick: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPlayClick }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Controlled subtle tilt range: max ±6 degrees
    setTilt({ x: -(y * 10), y: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const formatDuration = (secs?: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? '-4px' : '0px'})`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
      }}
      className="group relative flex flex-col rounded-2xl bg-[#0f1015] border border-white/8 hover:border-indigo-500/40 overflow-hidden shadow-xl transition-colors duration-300"
    >
      {/* Thumbnail Aspect Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer" onClick={() => onPlayClick(project)}>
        <img
          src={project.thumbnail_path}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-90 contrast-105 group-hover:brightness-100"
        />

        {/* Ambient Overlay & Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-transparent to-black/30 pointer-events-none" />

        {/* Duration / Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono tracking-wider text-neutral-300 border border-white/10">
            {project.category}
          </span>

          {project.video_duration_seconds && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10">
              <Clock className="w-3 h-3 text-indigo-400" />
              {formatDuration(project.video_duration_seconds)}
            </span>
          )}
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 backdrop-blur-md border border-white/20 transition-all duration-300 ${
              isHovered ? 'scale-110 opacity-100' : 'scale-95 opacity-80'
            }`}
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Client Name Pill (if present) */}
        {project.client_name && (
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="text-[11px] font-mono text-neutral-300 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
              {project.client_name}
            </span>
          </div>
        )}
      </div>

      {/* Project Metadata Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold font-display text-white group-hover:text-indigo-300 transition-colors">
              {project.title}
            </h3>
            <Link
              to={`/work/${project.slug}`}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              title="Open Project Details"
              aria-label={`View details for ${project.title}`}
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Tags and CTA link */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-neutral-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>

          <Link
            to={`/work/${project.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-indigo-400 transition-colors"
          >
            <span>Case Study</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
