import React from 'react';
import { Compass, Scissors, Sliders, CheckCircle2, Sparkles } from 'lucide-react';

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Understand the Story',
    subtitle: 'Narrative Discovery & Footage Ingest',
    description:
      'Every project starts with deep narrative alignment. I analyze the raw footage, understand the creative director or brand vision, identify emotional beats, and organize all takes into indexed bin systems.',
    icon: Compass,
    details: ['Raw Footage Audit & Script Alignment', 'Emotional Beat & Tension Mapping', 'Pacing & Tone Moodboards'],
  },
  {
    number: '02',
    title: 'Shape the Edit',
    subtitle: 'Rough Cut & Kinetic Assembly',
    description:
      'Constructing the spine of the film. I sculpt the rhythm of the cut, ensuring seamless eye-trace continuity, match cuts, and tempo progression that keeps viewers locked in from the opening frame.',
    icon: Scissors,
    details: ['Hook Engineering (First 3 Seconds)', 'A/B Storyline Weaving', 'Rhythmic Match Cutting & Pacing'],
  },
  {
    number: '03',
    title: 'Refine Every Frame',
    subtitle: 'Color Science & Immersive Sound',
    description:
      'Where the edit transforms into cinema. I dial in cinematic color grades using ACES color spaces, perform precision audio denoising, balance dialogue, and build multi-layered atmospheric foley and sound design.',
    icon: Sliders,
    details: ['DaVinci Resolve ACES Color Grading', 'Multi-Track Foley & Bass Impact', 'Motion Tracking & Micro VFX'],
  },
  {
    number: '04',
    title: 'Deliver the Final Cut',
    subtitle: 'Multi-Format Mastering & Delivery',
    description:
      'Final review and technical quality control. I export pristine master files tailored for cinema projection, broadcast TV, YouTube 4K, or mobile-first 9:16 social platforms with zero compression artifacting.',
    icon: CheckCircle2,
    details: ['Apple ProRes 422 HQ & DCI Master', 'Platform-Specific Aspect Ratios (16:9 / 9:16 / 4:5)', 'Lossless Color & Audio QC'],
  },
];

export const CreativeProcess: React.FC = () => {
  return (
    <section id="process" className="py-24 bg-[#0a0a0d] relative overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow & Craft</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
            The Creative Process
          </h2>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
            From raw rushes to the final master render, every edit follows a disciplined, intentional post-production pipeline built for cinematic impact.
          </p>
        </div>

        {/* Process Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS_STEPS.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className="group relative rounded-2xl bg-[#0f1017] border border-white/8 hover:border-indigo-500/30 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                {/* Glowing Number Header */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl sm:text-4xl font-black font-display text-white/20 group-hover:text-indigo-400/50 transition-colors">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/40 transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white font-display">
                    {step.title}
                  </h3>
                  <div className="text-xs font-mono text-indigo-400/90 mt-1 mb-3">
                    {step.subtitle}
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Micro Details List */}
                <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
