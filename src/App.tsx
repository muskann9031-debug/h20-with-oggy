import React, { useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdventureRoadTripMap } from './components/AdventureRoadTripMap';
import { HydroHeroCertificate } from './components/HydroHeroCertificate';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PlayerProgress, UserProfile } from './types';
import { generateDefaultProfile } from './data/userProfile';
import { sound } from './utils/audio';

export default function App() {
  const [view, setView] = useState<'hero' | 'map'>('hero');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('oggy_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // User Profile with Daily Streak State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('oggy_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return generateDefaultProfile('hydro_hero');
  });

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('oggy_user_profile', JSON.stringify(updated));
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    handleUpdateProfile(profile);
    setShowAuthModal(false);
    setShowProfileModal(true); // Open their profile dashboard immediately after logging in
  };

  const handleLogout = () => {
    sound.playClick();
    const loggedOutProfile: UserProfile = {
      ...userProfile,
      isLoggedIn: false,
    };
    handleUpdateProfile(loggedOutProfile);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('oggy_theme', next);
      return next;
    });
  };

  // Player Road Trip state (all stages unlocked for immediate exploration)
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const saved = localStorage.getItem('oggy_india_roadtrip_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          unlockedStages: [1, 2, 3, 4],
        };
      } catch {
        // fallback
      }
    }
    return {
      currentStage: 1,
      unlockedStages: [1, 2, 3, 4],
      completedStages: [],
      stageStars: {},
      coins: 0,
      lives: 5,
      waterHarvestedLiters: 0,
      aquiferDepthMeters: 12.0, // starts dry at 12m, improves to 2m
      activeVehiclePosition: { x: 375, y: 155 },
      isAnimatingVehicle: false,
    };
  });

  const saveProgress = (newProgress: PlayerProgress) => {
    setProgress(newProgress);
    localStorage.setItem('oggy_india_roadtrip_progress', JSON.stringify(newProgress));
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Direct Flow: "Play Now" immediately opens the interactive India Road Trip Map!
  const handleStartMission = () => {
    sound.playSplash();
    setView('map');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-yellow-300 selection:text-slate-900 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        currentView={view}
        currentLevelId={progress.currentStage}
        aquiferDepth={progress.aquiferDepthMeters}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onGoHome={() => setView('hero')}
        onOpenMap={() => setView('map')}
        onOpenCertificate={() => setShowCertificate(true)}
        completedCount={progress.completedStages.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        userProfile={userProfile}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenLogin={() => setShowAuthModal(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col">
        {/* HERO SECTION VIEW */}
        {view === 'hero' && (
          <HeroSection
            onStart={handleStartMission}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            aquiferDepth={progress.aquiferDepthMeters}
            theme={theme}
          />
        )}

        {/* INTERACTIVE ALL-INDIA ROAD TRIP STAGE MAP VIEW */}
        {view === 'map' && (
          <AdventureRoadTripMap
            progress={progress}
            onUpdateProgress={saveProgress}
            onOpenCertificate={() => setShowCertificate(true)}
            theme={theme}
          />
        )}
      </div>

      {/* Global Animated Footer */}
      <Footer
        onStart={handleStartMission}
        onOpenMap={() => setView('map')}
        onOpenCertificate={() => setShowCertificate(true)}
        theme={theme}
      />

      {/* Hydro Hero Award Certificate Modal */}
      <HydroHeroCertificate
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        totalScore={progress.coins}
        harvestedLiters={progress.waterHarvestedLiters}
      />

      {/* Static Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
      />

      {/* User Profile Dashboard Modal (Daily Streak & Progress Bars) */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        progress={progress}
        onLogout={handleLogout}
        theme={theme}
      />
    </div>
  );
}
