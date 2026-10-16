import React, { useState } from 'react';
import type { Project, ProjectCategory } from '../types';
import { ProjectCard } from './ProjectCard';
import { Layers, Film } from 'lucide-react';

interface WorkGalleryProps {
  projects: Project[];
  onPlayProject: (project: Project) => void;
}

const CATEGORIES: (ProjectCategory | 'All')[] = [
  'All',
  'Cinematic Edits',
  'Commercial and Brand Videos',
  'Reels and Short-Form Content',
  'Documentary and Storytelling',
  'Motion Graphics',
];

export const WorkGallery: React.FC<WorkGalleryProps> = ({ projects, onPlayProject }) => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All'>('All');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const filteredProjects = projects.filter((project) => {
    if (selectedCategory === 'All') return true;
    return project.category === selectedCategory;
  });

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  return (
    <section id="work" className="py-24 bg-[#08080a] relative scroll-mt-20">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-400 mb-3">
              <Film className="w-3.5 h-3.5" />
              <span>Selected Portfolio</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
              Featured Edits & Films
            </h2>
            <p className="mt-2 text-neutral-400 max-w-lg text-sm sm:text-base">
              Explore curated post-production projects across cinematic narrative, commercial campaigns, and dynamic retention-driven reels.
            </p>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            Showing <span className="text-white font-semibold">{displayedProjects.length}</span> of{' '}
            <span className="text-white font-semibold">{filteredProjects.length}</span> projects
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(6);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {displayedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPlayClick={onPlayProject}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-[#0e0f14]/50">
            <Layers className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No projects found</h3>
            <p className="text-xs text-neutral-400 mt-1">
              There are no published projects in the "{selectedCategory}" category yet.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
            >
              Show all categories
            </button>
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredProjects.length && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-200 cursor-pointer"
            >
              <span>Load More Projects</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
