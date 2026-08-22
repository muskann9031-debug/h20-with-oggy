import React from 'react';
import { Home, MapPin, Volume2, VolumeX, Award, Droplets, Sun, Moon, Flame, User, LogIn } from 'lucide-react';
import { sound } from '../utils/audio';
import { CHARACTERS } from '../data/characters';
import { UserProfile } from '../types';

interface NavbarProps {
  currentView: 'hero' | 'map' | 'game';
  currentLevelId: number | null;
  aquiferDepth: number;
  isMuted: boolean;
  onToggleSound: () => void;
  onGoHome: () => void;
  onOpenMap: () => void;
  onOpenCertificate: () => void;
  completedCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userProfile: UserProfile | null;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentLevelId,
  aquiferDepth,
  isMuted,
  onToggleSound,
  onGoHome,
  onOpenMap,
  onOpenCertificate,
  completedCount,
  theme,
  onToggleTheme,
  userProfile,
  onOpenProfile,
  onOpenLogin,
}) => {
  const isDark = theme === 'dark';
  const character = userProfile ? CHARACTERS[userProfile.avatar] || CHARACTERS.oggy : null;

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b-3 transition-colors duration-200 px-3 sm:px-6 lg:px-8 py-2 ${
      isDark
        ? 'bg-slate-900/95 border-slate-700 shadow-[0_4px_0_#020617] text-white'
        : 'bg-white/95 border-slate-950 shadow-[0_4px_0_#0F172A] text-slate-900'
    }`}>
      <div className="w-full flex items-center justify-between gap-2">
        {/* Brand / Home Link */}
        <div
          onClick={() => {
            sound.playClick();
            onGoHome();
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] bg-sky-100 group-hover:scale-105 transition-transform shrink-0">
            <img
              src={CHARACTERS.oggy.image}
              alt="Oggy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className={`font-extrabold text-xs sm:text-base tracking-tight leading-none transition-colors ${
              isDark ? 'text-white group-hover:text-sky-400' : 'text-slate-900 group-hover:text-blue-600'
            }`}>
              OGGY WATER HARVEST
            </h1>
            <span className="text-[9px] sm:text-[10px] font-bold text-sky-500 uppercase tracking-wider">
              Underground Mission
            </span>
          </div>
        </div>

        {/* Middle Stats Badges */}
        <div className="hidden md:flex items-center gap-2">
          {/* Water Table Badge */}
          <div className={`flex items-center gap-1.5 border-2 px-3 py-1 rounded-xl text-xs font-black transition-colors ${
            isDark
              ? 'bg-slate-800 border-sky-500/40 text-sky-300'
              : 'bg-sky-50 border-sky-300 text-sky-950'
          }`}>
            <Droplets className="w-3.5 h-3.5 fill-sky-500 text-sky-400" />
            <span>Water Table: <strong className={isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'}>{aquiferDepth.toFixed(1)}m</strong></span>
          </div>

          {/* Current Level or Progress */}
          {currentView === 'map' && (
            <div className="bg-yellow-400 text-slate-950 border-2 border-slate-950 px-3 py-1 rounded-xl text-xs font-black shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5">
              <span>🛺</span>
              <span>Stage {currentLevelId || 1} / 5</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* USER PROFILE & DAILY STREAK BADGE */}
          {userProfile && userProfile.isLoggedIn ? (
            <button
              onClick={() => {
                sound.playClick();
                onOpenProfile();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-xl border-2 flex items-center gap-1.5 cursor-pointer transition active:translate-y-0.5 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 shadow-[2px_2px_0px_#020617]'
                  : 'bg-amber-50 hover:bg-amber-100 border-slate-950 shadow-[2px_2px_0px_#0F172A]'
              }`}
              title="Open Hydro Hero Profile & Daily Streak"
            >
              {/* Character Avatar Icon */}
              <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-950 bg-sky-200 shrink-0">
                <img
                  src={character?.image || CHARACTERS.oggy.image}
                  alt={userProfile.displayName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Flame Streak Indicator */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black shadow-sm">
                <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300 animate-pulse" />
                <span>{userProfile.streakDays}d</span>
              </div>

              <span className="hidden lg:inline text-xs font-black truncate max-w-[90px]">
                {userProfile.displayName.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenLogin();
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border-2 border-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#0F172A] active:translate-y-0.5"
              title="Login / Passport"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleTheme();
            }}
            className={`p-1.5 sm:p-2 rounded-xl border-2 transition cursor-pointer active:translate-y-0.5 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-yellow-400 shadow-[2px_2px_0px_#020617]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-950 text-slate-800 shadow-[2px_2px_0px_#0F172A]'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Stage Map Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenMap();
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1 cursor-pointer transition active:translate-y-0.5 ${
              isDark
                ? currentView === 'map'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-[2px_2px_0px_#020617]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 shadow-[2px_2px_0px_#020617]'
                : currentView === 'map'
                  ? 'bg-sky-500 text-white border-slate-950 shadow-[2px_2px_0px_#0F172A]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-950 shadow-[2px_2px_0px_#0F172A]'
            }`}
            title="India Road Trip Map"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Road Map</span>
          </button>

          {/* Certificate Award Button */}
          <button
            onClick={() => {
              sound.playVictoryFanfare();
              onOpenCertificate();
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#0F172A] active:translate-y-0.5"
            title="View Hydro Expedition Certificate"
          >
            <Award className="w-3.5 h-3.5 text-yellow-900" />
            <span className="hidden md:inline">Award</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 border-2 border-slate-950 text-slate-950 transition cursor-pointer shadow-[2px_2px_0px_#0F172A] active:translate-y-0.5"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Home Icon */}
          {currentView !== 'hero' && (
            <button
              onClick={() => {
                sound.playClick();
                onGoHome();
              }}
              className={`p-1.5 sm:p-2 rounded-xl border-2 transition cursor-pointer active:translate-y-0.5 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 shadow-[2px_2px_0px_#020617]'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-950 text-slate-800 shadow-[2px_2px_0px_#0F172A]'
              }`}
              title="Home Hero Section"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
