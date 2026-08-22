import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Flame,
  Droplets,
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  Edit2,
  Check,
  LogOut,
  MapPin,
  TrendingUp,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, PlayerProgress } from '../types';
import { CHARACTERS } from '../data/characters';
import { sound } from '../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  progress: PlayerProgress;
  onLogout: () => void;
  theme: 'light' | 'dark';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  progress,
  onLogout,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'streak' | 'badges' | 'missions' | 'avatar'>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.displayName);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const character = CHARACTERS[profile.avatar] || CHARACTERS.oggy;

  // Streak claim logic
  const today = '2026-08-22';
  const isClaimedToday = profile.lastClaimDate === today;

  const handleClaimStreak = () => {
    if (isClaimedToday) return;

    sound.playVictoryFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const newStreak = profile.streakDays + 1;
    const updatedHistory = profile.streakHistory.map((h, i) => {
      if (i === (profile.streakDays % 7)) {
        return { ...h, claimed: true };
      }
      return h;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      streakDays: newStreak,
      bestStreak: Math.max(newStreak, profile.bestStreak),
      lastClaimDate: today,
      streakHistory: updatedHistory,
      xp: profile.xp + 150,
    };

    onUpdateProfile(updatedProfile);
  };

  const handleSaveName = () => {
    sound.playClick();
    if (tempName.trim()) {
      onUpdateProfile({
        ...profile,
        displayName: tempName.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleSelectAvatar = (charKey: 'oggy' | 'jack' | 'olivia' | 'bob') => {
    sound.playSuccessChime();
    onUpdateProfile({
      ...profile,
      avatar: charKey,
    });
  };

  const handleClaimMission = (missionId: string) => {
    sound.playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    const updatedMissions = profile.dailyMissions.map((m) => {
      if (m.id === missionId) {
        return { ...m, claimed: true, completed: true };
      }
      return m;
    });

    onUpdateProfile({
      ...profile,
      dailyMissions: updatedMissions,
      xp: profile.xp + 100,
    });
  };

  // Calculations for Progress Bars
  const totalStages = 5;
  const completedStagesCount = progress.completedStages.length;
  const stageProgressPercent = Math.min(100, Math.round((completedStagesCount / totalStages) * 100));

  const targetWater = 5000;
  const waterProgressPercent = Math.min(100, Math.round((progress.waterHarvestedLiters / targetWater) * 100));

  // Aquifer Table Restoration (12m -> 2m, total 10m range)
  const initialDepth = 12.0;
  const restoredMeters = Math.max(0, initialDepth - progress.aquiferDepthMeters);
  const aquiferProgressPercent = Math.min(100, Math.round((restoredMeters / 10.0) * 100));

  const xpProgressPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-4 border-slate-950 shadow-[8px_8px_0px_#0F172A] overflow-hidden transition-colors duration-200 ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Top Profile Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 p-4 sm:p-5 border-b-3 border-slate-950 text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Avatar Photo */}
              <div className="relative group cursor-pointer" onClick={() => setActiveTab('avatar')}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-3 border-slate-950 shadow-[3px_3px_0px_#0F172A] bg-sky-200">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 bg-yellow-400 text-slate-950 border-2 border-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                  {character.emoji} Switch
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="px-2 py-0.5 rounded-lg border-2 border-slate-950 bg-white text-slate-900 font-extrabold text-sm outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 rounded-lg bg-emerald-400 border border-slate-950 text-slate-950 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                        {profile.displayName}
                      </h2>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setTempName(profile.displayName);
                          setIsEditingName(true);
                        }}
                        className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                        title="Edit Display Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="bg-yellow-400 text-slate-950 border-2 border-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#0F172A] flex items-center gap-1">
                    <Shield className="w-3 h-3 fill-slate-950" />
                    Level {profile.rankLevel} • {profile.rankTitle}
                  </span>

                  {/* Streak pill */}
                  <span className="bg-orange-500 text-white border-2 border-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#0F172A] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300 animate-bounce" />
                    {profile.streakDays} Day Streak!
                  </span>
                </div>

                {/* XP Progress Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-32 sm:w-44 h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/40 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${xpProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-sky-100">
                    {profile.xp} / {profile.xpToNextLevel} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white border-2 border-white/40 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-3 border-slate-950 bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-wider overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Progress', icon: TrendingUp },
            { id: 'streak', label: '🔥 Daily Streak', icon: Flame },
            { id: 'missions', label: '🎯 Daily Quests', icon: Target },
            { id: 'badges', label: '🏆 Badges', icon: Award },
            { id: 'avatar', label: '🐱 Avatar', icon: RefreshCw },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(t.id as any);
                }}
                className={`py-2.5 px-3.5 sm:px-4 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition border-r border-slate-300 dark:border-slate-700 ${
                  isActive
                    ? isDark
                      ? 'bg-slate-900 text-sky-400 border-b-2 border-b-sky-400 font-extrabold'
                      : 'bg-white text-blue-700 border-b-2 border-b-blue-600 font-extrabold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: OVERVIEW & PROGRESS BARS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className={`p-3 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800' : 'bg-sky-50'
                }`}>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                    Water Saved
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Droplets className="w-4 h-4 fill-sky-500 text-sky-500" />
                    <span className="text-base sm:text-lg font-black text-sky-600 dark:text-sky-400">
                      {progress.waterHarvestedLiters.toLocaleString()} L
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800' : 'bg-amber-50'
                }`}>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                    Water Coins
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base">🪙</span>
                    <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                      {progress.coins}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800' : 'bg-orange-50'
                }`}>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                    Active Streak
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                    <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400">
                      {profile.streakDays} Days
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800' : 'bg-emerald-50'
                }`}>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                    Water Table
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {progress.aquiferDepthMeters.toFixed(1)}m
                    </span>
                  </div>
                </div>
              </div>

              {/* PROGRESS BARS SECTION */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Hydro-Guardian Progress Trackers
                </h3>

                {/* 1. Road Trip Stages Progress */}
                <div className={`p-4 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800/80' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      All-India Road Trip Missions
                    </span>
                    <span className="text-blue-600 dark:text-sky-400">
                      {completedStagesCount} / {totalStages} Stages Completed ({stageProgressPercent}%)
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-400 dark:border-slate-600 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${stageProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    Covers Himalayas, Rajasthan Stepwells, Meghalaya Bamboos, Deccan Basalt & Coastal Tamil Nadu.
                  </p>
                </div>

                {/* 2. Water Harvested Milestone Progress */}
                <div className={`p-4 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800/80' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-500" />
                      Total Groundwater Harvest Target
                    </span>
                    <span className="text-sky-600 dark:text-sky-400">
                      {progress.waterHarvestedLiters} / {targetWater} L ({waterProgressPercent}%)
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-400 dark:border-slate-600 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                      style={{ width: `${waterProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    Collect rainwater in mini-games to reach the 5,000L Master Harvester badge!
                  </p>
                </div>

                {/* 3. Deep Aquifer Water Table Restoration */}
                <div className={`p-4 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                  isDark ? 'bg-slate-800/80' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Underground Aquifer Recharge Index
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {aquiferProgressPercent}% Restored (Current: {progress.aquiferDepthMeters.toFixed(1)}m / Target: 2.0m)
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-400 dark:border-slate-600 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-700"
                      style={{ width: `${aquiferProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>Critical Dry (12m depth)</span>
                    <span>Pristine Full (2m depth)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY STREAK TRACKER */}
          {activeTab === 'streak' && (
            <div className="space-y-4">
              {/* Main Streak Hero Box */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 border-3 border-slate-950 shadow-[4px_4px_0px_#0F172A] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shadow-lg">
                    <Flame className="w-10 h-10 fill-yellow-300 text-yellow-200 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">
                      {profile.streakDays} Day Active Streak!
                    </h3>
                    <p className="text-xs font-semibold text-orange-100 mt-1">
                      Best Record: {profile.bestStreak} Days • Keep it burning!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClaimStreak}
                  disabled={isClaimedToday}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] transition cursor-pointer flex items-center gap-2 ${
                    isClaimedToday
                      ? 'bg-emerald-400 text-slate-950 cursor-default opacity-90'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 active:translate-y-0.5 animate-bounce'
                  }`}
                >
                  {isClaimedToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                      <span>Claimed for Today!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Claim Day {profile.streakDays + 1} Bonus (+50🪙)</span>
                    </>
                  )}
                </button>
              </div>

              {/* 7-Day Roadmap */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] ${
                isDark ? 'bg-slate-800' : 'bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Weekly Streak Roadmap
                  </h4>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                    Day 7 Jackpot: 200🪙 + Gold Trophy
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {profile.streakHistory.map((item, idx) => {
                    const isToday = idx === profile.streakDays % 7;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition ${
                          item.claimed
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                            : isToday
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 shadow-[2px_2px_0px_#D97706]'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-500'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase">{item.day}</span>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black">
                          {item.claimed ? '🔥' : idx === 6 ? '👑' : '💧'}
                        </div>
                        <span className="text-[9px] font-extrabold">
                          {item.claimed ? 'Claimed' : idx === 6 ? '+200' : '+50'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streak Tips & Perks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-2xl border-2 border-slate-950 ${isDark ? 'bg-slate-800' : 'bg-sky-50'}`}>
                  <h5 className="font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 fill-sky-500" />
                    Streak Multipliers
                  </h5>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Reach 7-day streaks to unlock 1.5x bonus water harvesting speed in all interactive mini-games!
                  </p>
                </div>
                <div className={`p-3.5 rounded-2xl border-2 border-slate-950 ${isDark ? 'bg-slate-800' : 'bg-emerald-50'}`}>
                  <h5 className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Streak Freeze Protection
                  </h5>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Your streak is shielded! Missing one day won't reset your badges or total hydro score.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY MISSIONS & QUESTS */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-500" />
                  Today's Hydro Conservation Quests
                </h4>
                <span className="text-[11px] font-bold text-sky-500">Resets Daily at Midnight</span>
              </div>

              {profile.dailyMissions.map((mission) => {
                const isComplete = mission.current >= mission.target;
                const progressPct = Math.min(100, Math.round((mission.current / mission.target) * 100));

                return (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      mission.claimed
                        ? isDark
                          ? 'bg-slate-800/40 opacity-70'
                          : 'bg-slate-100 opacity-80'
                        : isDark
                        ? 'bg-slate-800'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 border-2 border-slate-950 flex items-center justify-center text-lg shrink-0">
                        {mission.icon}
                      </div>
                      <div>
                        <h5 className="font-black text-sm">{mission.title}</h5>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {mission.description}
                        </p>
                        {/* Mini progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-400">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {mission.current} / {mission.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center justify-between gap-2 shrink-0">
                      <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                        🪙 +{mission.rewardCoins} • 💧 +{mission.rewardWater}L
                      </span>

                      {mission.claimed ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaimMission(mission.id)}
                          disabled={!isComplete}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] transition cursor-pointer flex items-center gap-1 ${
                            isComplete
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:translate-y-0.5'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 border-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim Reward</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: BADGES & TROPHIES */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Hero Badges & Achievements Cabinet
                </h4>
                <span className="text-xs font-extrabold text-amber-500">
                  {profile.badges.filter((b) => b.unlocked).length} / {profile.badges.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.badges.map((badge) => {
                  const isSelected = selectedBadgeId === badge.id;
                  return (
                    <div
                      key={badge.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedBadgeId(isSelected ? null : badge.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center gap-2 ${
                        badge.unlocked
                          ? 'border-slate-950 bg-gradient-to-b from-amber-100/80 to-yellow-50 dark:from-amber-950/40 dark:to-slate-800 shadow-[3px_3px_0px_#0F172A]'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 ${
                        badge.unlocked
                          ? 'bg-amber-300 border-slate-950 shadow-sm'
                          : 'bg-slate-300 dark:bg-slate-700 border-slate-400 grayscale'
                      }`}>
                        {badge.icon}
                      </div>

                      <div>
                        <h5 className="font-black text-xs leading-snug">{badge.name}</h5>
                        <span className={`text-[10px] font-extrabold block mt-0.5 ${
                          badge.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          {badge.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                        </span>
                      </div>

                      {isSelected && (
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-300 dark:border-slate-700 animate-fadeIn">
                          {badge.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: AVATAR SELECTION */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Choose Your Cartoon Hydro Persona
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['oggy', 'jack', 'olivia', 'bob'] as const).map((charKey) => {
                  const char = CHARACTERS[charKey];
                  const isCurrent = profile.avatar === charKey;
                  return (
                    <div
                      key={charKey}
                      onClick={() => handleSelectAvatar(charKey)}
                      className={`p-3 rounded-2xl border-3 transition cursor-pointer flex flex-col items-center gap-2 text-center ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50 dark:bg-sky-950/60 shadow-[4px_4px_0px_#0284C7]'
                          : 'border-slate-950 bg-white dark:bg-slate-800 shadow-[3px_3px_0px_#0F172A] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-950">
                        <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h5 className="font-black text-sm">{char.name}</h5>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{char.role}</p>
                      </div>
                      {isCurrent && (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          Active Hero
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t-3 border-slate-950 flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950' : 'bg-slate-50'
        }`}>
          <button
            onClick={() => {
              sound.playClick();
              onLogout();
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black border-2 border-slate-950 shadow-[3px_3px_0px_#0F172A] active:translate-y-0.5 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
