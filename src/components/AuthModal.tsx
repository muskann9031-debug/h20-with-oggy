import React, { useState } from 'react';
import { Lock, User, KeyRound, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, Zap, X } from 'lucide-react';
import { STATIC_CREDENTIALS, generateDefaultProfile } from '../data/userProfile';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { CHARACTERS } from '../data/characters';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  theme: 'light' | 'dark';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  theme,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('hydro_hero');
  const [password, setPassword] = useState('oggywater123');
  const [displayName, setDisplayName] = useState('Hydro Hero Oggy');
  const [selectedAvatar, setSelectedAvatar] = useState<'oggy' | 'jack' | 'olivia' | 'bob'>('oggy');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleQuickDemoLogin = (credIndex = 0) => {
    sound.playClick();
    const cred = STATIC_CREDENTIALS[credIndex] || STATIC_CREDENTIALS[0];
    setUsername(cred.username);
    setPassword(cred.password);
    setErrorMessage('');
    
    // Auto submit
    setIsLoading(true);
    setTimeout(() => {
      sound.playSuccessChime();
      const profile = generateDefaultProfile(cred.username);
      setSuccessMessage(`Welcome back, ${profile.displayName}! 🌊`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(profile);
        onClose();
      }, 500);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      sound.playErrorBuzz();
      setErrorMessage('Please fill in both Username and Password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (tab === 'login') {
        const found = STATIC_CREDENTIALS.find(
          (c) =>
            c.username.toLowerCase() === username.trim().toLowerCase() &&
            c.password === password.trim()
        );

        if (found) {
          sound.playSuccessChime();
          const profile = generateDefaultProfile(found.username);
          setSuccessMessage(`Welcome, ${profile.displayName}! 🚀`);
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(profile);
            onClose();
          }, 400);
        } else {
          sound.playErrorBuzz();
          setIsLoading(false);
          setErrorMessage('Invalid credentials! Check the demo credentials box below.');
        }
      } else {
        // Register static account
        sound.playVictoryFanfare();
        const newProfile: UserProfile = {
          ...generateDefaultProfile(username.trim()),
          displayName: displayName.trim() || username.trim(),
          avatar: selectedAvatar,
          streakDays: 1,
          bestStreak: 1,
        };
        setSuccessMessage(`Account created for ${newProfile.displayName}! 🎉`);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(newProfile);
          onClose();
        }, 500);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-lg rounded-2xl border-4 border-slate-950 shadow-[8px_8px_0px_#0F172A] overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-4 border-b-3 border-slate-950 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              <ShieldCheck className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
                OGGY HYDRO PASSPORT
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h2>
              <p className="text-xs font-semibold text-sky-100">
                Groundwater Guardian Access Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white border border-white/30 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b-2 border-slate-950 bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition ${
              tab === 'login'
                ? isDark
                  ? 'bg-slate-900 text-sky-400 border-b-2 border-sky-400'
                  : 'bg-white text-blue-700 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Hero Login
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition ${
              tab === 'register'
                ? isDark
                  ? 'bg-slate-900 text-sky-400 border-b-2 border-sky-400'
                  : 'bg-white text-blue-700 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            New Hydro Cadet
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {/* Static Credentials Callout Box */}
          <div className="mb-4 p-3.5 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                Static Login Credentials Provided:
              </span>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                READY TO USE
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-sans font-bold">
                  Username / ID:
                </span>
                <strong className="text-blue-600 dark:text-sky-400 text-sm">hydro_hero</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-sans font-bold">
                  Password:
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">oggywater123</strong>
              </div>
            </div>

            {/* Quick 1-Click Login Button */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(0)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] active:translate-y-0.5 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                ⚡ Auto-Fill & Quick Login
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Oggy The Rainmaster"
                    className={`w-full px-3.5 py-2 rounded-xl border-2 font-bold text-sm outline-none transition ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 focus:border-sky-400 text-white'
                        : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                    }`}
                  />
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                    Choose Character Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['oggy', 'jack', 'olivia', 'bob'] as const).map((charKey) => {
                      const char = CHARACTERS[charKey];
                      const isSelected = selectedAvatar === charKey;
                      return (
                        <button
                          key={charKey}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setSelectedAvatar(charKey);
                          }}
                          className={`p-1.5 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-sky-950/50 shadow-[2px_2px_0px_#0284C7]'
                              : isDark
                              ? 'border-slate-700 bg-slate-800/60 opacity-70 hover:opacity-100'
                              : 'border-slate-200 bg-slate-50 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-950">
                            <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-black capitalize">{char.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Username ID</span>
                {tab === 'login' && (
                  <span className="text-[10px] text-sky-500 font-semibold lowercase">
                    try: hydro_hero
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="hydro_hero"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border-2 font-bold text-sm outline-none transition ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 focus:border-sky-400 text-white'
                      : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Password</span>
                {tab === 'login' && (
                  <span className="text-[10px] text-emerald-500 font-semibold lowercase">
                    try: oggywater123
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border-2 font-bold text-sm outline-none transition ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 focus:border-sky-400 text-white'
                      : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error or Success feedback */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 border-2 border-red-500 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-sm border-3 border-slate-950 shadow-[4px_4px_0px_#0F172A] active:translate-y-0.5 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Hero Credentials...</span>
              ) : tab === 'login' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to Hydro Mission</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Create Hydro Cadet Passport</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
