import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface HeroProps {
  headline?: string;
  subheadline?: string;
  availability?: string;
  onExploreClick?: () => void;
  onCollaborateClick?: () => void;
  onPlayHeroVideo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  headline = 'Every Frame Has a Story.',
  subheadline = 'I’m Krishna Patil, a video editor crafting cinematic visuals, compelling stories, and edits that leave an impression.',
  availability = 'Available for select projects',
  onExploreClick,
  onCollaborateClick,
  onPlayHeroVideo,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Gentle parallax values normalized between -10 and 10 px
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center overflow-hidden bg-[#070709] bg-noise">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-purple-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Availability Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-neutral-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{availability}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight font-display text-white leading-[1.08]">
              {headline.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-3">
                  {word === 'Story.' ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-indigo-400">
                      {word}
                    </span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed">
              {subheadline}
            </p>

            {/* CTA Buttons & Proof Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onPlayHeroVideo || onExploreClick || (() => handleScrollTo('work'))}
                className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                <span>Watch Demo Reel</span>
              </button>

              <button
                type="button"
                onClick={onCollaborateClick || (() => handleScrollTo('contact'))}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
                <span>Let's Collaborate</span>
              </button>
            </div>

            {/* Video Production Metadata Strip */}
            <div className="pt-8 border-t border-white/5 w-full grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-display text-white">4K / 1080p</div>
                <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider mt-0.5">
                  Master Renders
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-display text-white">100%</div>
                <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider mt-0.5">
                  Retention Tuning
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-display text-white">ACES</div>
                <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider mt-0.5">
                  Color Grading
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Cinematic Perspective Collage */}
          <div className="lg:col-span-5 relative perspective-container">
            <div
              className="relative w-full aspect-[4/5] sm:aspect-square max-w-[480px] mx-auto preserve-3d transition-transform duration-300 ease-out"
              style={{
                transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
              }}
            >
              {/* Back Card (Automotive Twilight) */}
              <div className="absolute top-4 -right-4 w-[85%] aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl opacity-60 hover:opacity-90 transition-all duration-500 transform translate-z-[-40px]">
                <img
                  src="/thumbnails/automotive-twilight.jpg"
                  alt="Automotive commercial frame"
                  className="w-full h-full object-cover filter brightness-75 contrast-110"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-neutral-300 border border-white/10">
                  48 FPS
                </div>
              </div>

              {/* Main Prominent Center Video Frame (AI Architecture & Luxury Estates) */}
              <div
                onClick={onPlayHeroVideo || onExploreClick || (() => handleScrollTo('work'))}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20 group cursor-pointer hover:border-indigo-400/50 transition-all duration-300"
              >
                <img
                  src="/thumbnails/ai-property-demo.jpg"
                  alt="AI Architecture & Luxury Property Showcase"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter contrast-105"
                />
                {/* Cinema Overlay Hud */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Top Bar HUD */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/80 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="tracking-widest">MASTER</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                    1080p FHD
                  </div>
                </div>

                {/* Bottom Bar Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">
                      Featured Work
                    </div>
                    <div className="text-sm font-semibold text-white font-display">
                      AI Luxury Architecture
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg transition-all group-hover:scale-110">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Floating Bottom Card (Urban Rhythm Reels) */}
              <div className="absolute -bottom-2 -left-3 w-[65%] aspect-[16/10] rounded-xl overflow-hidden border border-white/15 shadow-2xl z-30 opacity-90 hover:opacity-100 transition-all duration-300">
                <img
                  src="/thumbnails/urban-rhythm.jpg"
                  alt="Dynamic short form reel thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-300">9:16 Kinetic Cut</span>
                  <span className="text-[9px] font-mono bg-indigo-500/80 px-1.5 py-0.5 rounded text-white font-semibold">
                    REEL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Cue Indicator */}
        <div className="mt-16 sm:mt-24 flex justify-center">
          <button
            type="button"
            onClick={() => handleScrollTo('work')}
            className="group flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
            aria-label="Scroll to selected work"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono">
              Scroll To Reel
            </span>
            <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1 group-hover:border-indigo-400 transition-colors">
              <div className="w-1 h-2 rounded-full bg-indigo-400 animate-bounce" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
