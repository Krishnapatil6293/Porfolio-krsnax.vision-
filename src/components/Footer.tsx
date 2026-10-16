import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Film, Mail, Phone, Clapperboard } from 'lucide-react';

interface FooterProps {
  editorName?: string;
  email?: string;
  phone?: string;
}

export const Footer: React.FC<FooterProps> = ({
  editorName = 'KRISHNA PATIL',
  email = 'kpctech1234@gmail.com',
  phone = '7066397018',
}) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050507] border-t border-white/5 pt-16 pb-12 text-neutral-400">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-[0.18em] uppercase text-white font-display">
                {editorName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Crafting cinematic pacing, emotive rhythm, and precision post-production for narrative films, commercial brand stories, and high-impact digital content.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-300">
              Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/#work" className="hover:text-white transition-colors">
                  Selected Work
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-white transition-colors">
                  About Krishna
                </a>
              </li>
              <li>
                <a href="/#process" className="hover:text-white transition-colors">
                  Creative Process
                </a>
              </li>
              <li>
                <a href="/#contact" className="hover:text-white transition-colors">
                  Client Inquiries
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Communication Channels */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-300">
              Direct Contact
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 hover:text-indigo-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{email}</span>
                </a>
              </div>
              <div>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 hover:text-indigo-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{phone}</span>
                </a>
              </div>
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Studio Administration</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
          <div>
            © {currentYear} {editorName}. All rights reserved. Professional Video Editing Portfolio.
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
          >
            <span>Back To Top</span>
            <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};
