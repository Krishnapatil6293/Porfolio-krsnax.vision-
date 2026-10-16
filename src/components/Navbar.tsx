import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Clapperboard, Film } from 'lucide-react';

interface NavbarProps {
  editorName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ editorName = 'KRISHNA PATIL' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Work', href: '/#work' },
    { label: 'About', href: '/#about' },
    { label: 'Process', href: '/#process' },
    { label: 'Contact', href: '/#contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      if (location.pathname === '/') {
        e.preventDefault();
        const id = href.replace('/#', '');
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08080a]/90 backdrop-blur-md border-b border-white/5 py-4 shadow-2xl'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          to="/"
          className="group flex items-center gap-3 text-white tracking-wider font-display focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all duration-300">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-[0.18em] uppercase group-hover:text-white transition-colors">
              {editorName}
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
              Video Editor
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-sm tracking-wide text-neutral-400 hover:text-white transition-colors py-1 relative group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-indigo-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1 flex items-center gap-1"
            title="Admin Dashboard"
          >
            <Clapperboard className="w-3.5 h-3.5 text-neutral-400" />
            <span>Studio Admin</span>
          </Link>

          <a
            href="/#contact"
            onClick={(e) => handleLinkClick(e, '/#contact')}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-indigo-500/50 transition-all duration-300 shadow-sm overflow-hidden"
          >
            <span className="relative z-10">Let's Work Together</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0d] border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-base text-neutral-300 hover:text-white font-medium py-2 border-b border-white/5"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-neutral-400 hover:text-indigo-400 py-2 flex items-center gap-2"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Studio Admin</span>
            </Link>
          </nav>
          <div className="pt-2">
            <a
              href="/#contact"
              onClick={(e) => handleLinkClick(e, '/#contact')}
              className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              <span>Let's Work Together</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
