import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { WorkGallery } from '../components/WorkGallery';
import { CreativeProcess } from '../components/CreativeProcess';
import { AboutKrishna } from '../components/AboutKrishna';
import { ContactSection } from '../components/ContactSection';
import { Footer } from '../components/Footer';
import { VideoModal } from '../components/VideoModal';
import { projectsService } from '../services/projectsService';
import { siteSettingsService } from '../services/siteSettingsService';
import type { Project, SiteSettings } from '../types';
import { INITIAL_SITE_SETTINGS } from '../data/mockData';

export const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [activeModalProject, setActiveModalProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projList, siteSet] = await Promise.all([
          projectsService.getProjects('All', true), // Published only
          siteSettingsService.getSettings(),
        ]);
        setProjects(projList);
        setSettings(siteSet);
      } catch (err) {
        console.warn('Error fetching homepage data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 selection:bg-indigo-600/30 selection:text-white">
      {/* Navigation */}
      <Navbar editorName={settings.editor_name} />

      {/* Hero Section */}
      <Hero
        headline={settings.headline}
        subheadline={settings.subheadline}
        availability={settings.availability_status}
      />

      {/* Selected Work Gallery */}
      <WorkGallery
        projects={projects}
        onPlayProject={(project) => setActiveModalProject(project)}
      />

      {/* Creative Process */}
      <CreativeProcess />

      {/* About Krishna (with Real Photo) */}
      <AboutKrishna settings={settings} />

      {/* Contact & Inquiries */}
      <ContactSection />

      {/* Footer */}
      <Footer
        editorName={settings.editor_name}
        email={settings.contact_email}
        phone={settings.contact_phone}
      />

      {/* Accessible Video Playback Modal */}
      <VideoModal
        project={activeModalProject}
        onClose={() => setActiveModalProject(null)}
      />
    </div>
  );
};
