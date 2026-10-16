import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { inquiriesService } from '../services/inquiriesService';

interface ContactSectionProps {
  initialProjectType?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ initialProjectType = 'Cinematic Edits' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project_type: initialProjectType,
    budget_range: '$1,000 – $2,500',
    brief: '',
    deadline: 'Within 2–4 weeks',
    honeypot: '', // invisible honeypot field
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await inquiriesService.submitInquiry(formData);
      if (response.success) {
        setSuccessMessage(response.message);
        setFormData({
          name: '',
          email: '',
          project_type: 'Cinematic Edits',
          budget_range: '$1,000 – $2,500',
          brief: '',
          deadline: 'Within 2–4 weeks',
          honeypot: '',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry. Please try again or email directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-[#08080a] relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Direct Contact Info & Assurance */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-400 mb-3">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Start a Collaboration</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
                Let’s Bring Your Vision To Life
              </h2>
              <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
                Whether you have raw footage ready for cutting, an upcoming commercial shoot, or a high-impact reel series, drop a line to discuss timelines and creative direction.
              </p>

              {/* Direct Channels Cards */}
              <div className="mt-8 space-y-4">
                {/* Email Direct Link */}
                <a
                  href="mailto:kpctech1234@gmail.com"
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1017] border border-white/8 hover:border-indigo-500/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
                        Direct Email
                      </div>
                      <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        kpctech1234@gmail.com
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                {/* Phone Direct Link */}
                <a
                  href="tel:7066397018"
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1017] border border-white/8 hover:border-indigo-500/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
                        Direct Phone / Call
                      </div>
                      <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        7066397018
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                {/* WhatsApp Chat Link */}
                <a
                  href="https://wa.me/917066397018"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1017] border border-white/8 hover:border-emerald-500/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
                        WhatsApp Instant Chat
                      </div>
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        +91 7066397018
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </div>
            </div>

            {/* Privacy & Response Commitment */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Response Time: Typically within 24 hours</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>All project briefs and footage are strictly confidential</span>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Submission Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e0f15] border border-white/10 shadow-2xl relative">
              <h3 className="text-xl font-bold font-display text-white mb-6">
                Project Inquiry Form
              </h3>

              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs sm:text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="font-semibold">Message Delivered</div>
                    <div className="mt-0.5">{successMessage}</div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <div className="font-semibold">Submission Notice</div>
                    <div className="mt-0.5">{errorMessage}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Invisible honeypot for bot traps */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                      Your Name <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                      Email Address <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Project Type */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                      Project Category <span className="text-indigo-400">*</span>
                    </label>
                    <select
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    >
                      <option value="Cinematic Edits">Cinematic Edits</option>
                      <option value="Commercial and Brand Videos">Commercial and Brand Videos</option>
                      <option value="Reels and Short-Form Content">Reels and Short-Form Content</option>
                      <option value="Documentary and Storytelling">Documentary and Storytelling</option>
                      <option value="Motion Graphics">Motion Graphics</option>
                      <option value="Social Media Edits">Social Media Edits</option>
                      <option value="Other">Other Custom Inquiry</option>
                    </select>
                  </div>

                  {/* Approximate Budget */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                      Approximate Budget <span className="text-neutral-500">(Optional)</span>
                    </label>
                    <select
                      value={formData.budget_range}
                      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    >
                      <option value="Under $500">Under $500 / ₹40,000</option>
                      <option value="$500 – $1,500">$500 – $1,500 / ₹40k – ₹1.2L</option>
                      <option value="$1,500 – $3,000">$1,500 – $3,000 / ₹1.2L – ₹2.5L</option>
                      <option value="$3,000+">$3,000+ / ₹2.5L+</option>
                      <option value="Flexible / Retainer">Flexible / Monthly Retainer</option>
                    </select>
                  </div>
                </div>

                {/* Project Brief */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Project Brief & Goals <span className="text-indigo-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell me about your footage, expected video length, style references, and emotional goals..."
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors resize-none"
                  />
                </div>

                {/* Preferred Deadline */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Preferred Deadline <span className="text-neutral-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. End of next week, or Flexible"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#09090d] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Brief...</span>
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Project Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
