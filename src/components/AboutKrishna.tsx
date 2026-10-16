import React from 'react';
import type { SiteSettings } from '../types';
import { Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';

interface AboutKrishnaProps {
  settings: SiteSettings;
}

export const AboutKrishna: React.FC<AboutKrishnaProps> = ({ settings }) => {
  return (
    <section id="about" className="py-24 bg-[#070709] relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Portrait Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              {/* Outer Glow and Border */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f1015] aspect-[3/4] group">
                <img
                  src={settings.portrait_url || '/krishna-patil.jpg'}
                  alt={settings.editor_name}
                  className="w-full h-full object-cover filter contrast-105 group-hover:scale-102 transition-transform duration-700"
                  onError={(e) => {
                    // Fallback to local default portrait if custom url fails
                    (e.target as HTMLImageElement).src = '/krishna-patil.jpg';
                  }}
                />

                {/* Subtle bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                {/* Portrait Overlay Badge */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xl font-bold font-display text-white">
                    {settings.editor_name}
                  </div>
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mt-0.5">
                    {settings.title}
                  </div>
                  <div className="mt-2 text-[11px] text-neutral-300 font-mono">
                    Based in India • Working Worldwide
                  </div>
                </div>
              </div>

              {/* Decorative accent behind portrait */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Bio, Philosophy & Technical Toolchain */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Storyteller</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
                Behind The Cut
              </h2>
            </div>

            {/* Biography */}
            <div className="space-y-4 text-sm sm:text-base text-neutral-300 leading-relaxed">
              <p>{settings.bio}</p>
            </div>

            {/* Editing Philosophy Block */}
            <div className="p-6 rounded-2xl bg-[#0f1017] border-l-2 border-indigo-500 border-y border-r border-white/5 space-y-2">
              <div className="text-xs uppercase font-mono tracking-widest text-indigo-400">
                Editing Philosophy
              </div>
              <p className="text-sm sm:text-base text-neutral-200 italic font-serif leading-relaxed">
                "{settings.philosophy}"
              </p>
            </div>

            {/* Core Software & Toolchain */}
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-3">
                Post-Production Toolchain & Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {settings.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-neutral-200 hover:border-indigo-500/40 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Collaboration CTA */}
            <div className="pt-2 flex items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                <span>Initiate a Project</span>
              </a>
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
              >
                <span>{settings.contact_email}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
