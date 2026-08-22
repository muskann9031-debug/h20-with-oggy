import React from 'react';
import oggyImg from '../assets/images/oggy_real_character_1787323095337.jpg';
import deedeeImg from '../assets/images/deedee_cockroach_1787328129156.jpg';
import joeyImg from '../assets/images/joey_cockroach_1787328146111.jpg';
import markyImg from '../assets/images/marky_cockroach_1787328164384.jpg';

// ==========================================
// 1. AUTHENTIC REAL OGGY CHARACTER SPRITE
// Shows Oggy the Cat with dynamic bucket & water
// ==========================================
interface OggySpriteProps {
  facing?: 'left' | 'right';
  hasBucket?: boolean;
  hasWater?: boolean;
  isWalking?: boolean;
  isInvincible?: boolean;
  size?: number;
  usePhotoCharacter?: boolean;
}

export const OggySvgSprite: React.FC<OggySpriteProps> = ({
  facing = 'right',
  hasBucket = true,
  hasWater = false,
  isWalking = false,
  isInvincible = false,
  size = 80,
  usePhotoCharacter = true,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        opacity: isInvincible ? 0.6 : 1,
      }}
      className={`relative select-none pointer-events-none ${isInvincible ? 'animate-pulse' : ''}`}
    >
      {usePhotoCharacter ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Real Character Round Frame Avatar with Gold/Sky Border & Shadow */}
          <div
            className={`relative w-[88%] h-[88%] rounded-full overflow-hidden border-3.5 border-sky-400 ring-2 ring-sky-600/60 bg-[#0F172A] shadow-[0_6px_16px_rgba(0,0,0,0.85)] flex items-center justify-center ${
              isWalking ? 'animate-bounce' : ''
            }`}
          >
            <img
              src={oggyImg}
              alt="Oggy the Cat"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover scale-110 object-top"
            />
            {/* Gloss highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-sky-300/25 via-transparent to-black/50" />
          </div>

          {/* Animated Cartoon Feet / Paws stepping along with movement */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-4 flex items-center justify-between px-1 pointer-events-none z-10">
            {/* Back Foot */}
            <div
              className={`w-4 h-2.5 bg-sky-600 border border-sky-300 rounded-full shadow-md transition-transform ${
                isWalking ? 'animate-[spin_0.4s_ease-in-out_infinite_alternate]' : ''
              }`}
            />
            {/* Front Forward Stepping Foot */}
            <div
              className={`w-5 h-3 bg-sky-400 border border-white rounded-full shadow-md transition-transform ${
                isWalking ? 'animate-[bounce_0.3s_ease-in-out_infinite]' : ''
              }`}
            />
          </div>

          {/* Dynamic Floating Bucket Overlay in Hand */}
          {hasBucket && (
            <div
              className={`absolute -bottom-1 -right-1 z-20 flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] ${
                hasWater ? 'scale-110' : 'scale-100'
              } transition-transform`}
            >
              <svg width="34" height="34" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="bucketGradReal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#CBD5E1" />
                    <stop offset="50%" stopColor="#64748B" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                  <linearGradient id="waterGradReal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#67E8F9" />
                    <stop offset="50%" stopColor="#0284C7" />
                    <stop offset="100%" stopColor="#0369A1" />
                  </linearGradient>
                </defs>
                {/* Handle */}
                <path d="M 8 16 Q 20 2 32 16" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                {/* Bucket Body */}
                <path d="M 6 16 L 34 16 L 29 38 L 11 38 Z" fill="url(#bucketGradReal)" stroke="#0F172A" strokeWidth="2.5" />
                {/* Rim */}
                <ellipse cx="20" cy="16" rx="14" ry="4" fill="#94A3B8" stroke="#0F172A" strokeWidth="2" />
                {/* Water Level */}
                {hasWater && (
                  <>
                    <ellipse cx="20" cy="17" rx="12" ry="3.5" fill="url(#waterGradReal)" />
                    <ellipse cx="18" cy="16.5" rx="6" ry="1.5" fill="#FFFFFF" opacity="0.8" />
                  </>
                )}
              </svg>
            </div>
          )}
        </div>
      ) : (
        /* Vector Fallback Character */
        <svg viewBox="0 0 100 110" className="w-full h-full overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
          <defs>
            <radialGradient id="oggyNoseGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFA4A4" />
              <stop offset="40%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
            <linearGradient id="oggyBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>
          <path d="M 28 78 Q 12 70 10 50 Q 8 36 18 34 Q 22 34 20 42 Q 18 56 32 80 Z" fill="url(#oggyBodyGrad)" stroke="#0F172A" strokeWidth="2.5" />
          <ellipse cx="48" cy="66" rx="22" ry="22" fill="url(#oggyBodyGrad)" stroke="#0F172A" strokeWidth="3" />
          <ellipse cx="50" cy="68" rx="14" ry="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <ellipse cx="46" cy="34" rx="20" ry="17" fill="url(#oggyBodyGrad)" stroke="#0F172A" strokeWidth="3" />
          <ellipse cx="40" cy="28" rx="6.5" ry="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          <circle cx="43" cy="29" r="2" fill="#000000" />
          <ellipse cx="53" cy="28" rx="6.5" ry="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          <circle cx="56" cy="29" r="2" fill="#000000" />
          <ellipse cx="47" cy="38" rx="9" ry="7.5" fill="url(#oggyNoseGrad)" stroke="#0F172A" strokeWidth="2.5" />
        </svg>
      )}
    </div>
  );
};

// ==========================================
// 2. AUTHENTIC REAL COCKROACH HURDLE SPRITES
// Real character images in round frames for Dee Dee, Joey, and Marky
// ==========================================
interface CockroachSpriteProps {
  variant?: 'deedee' | 'joey' | 'marky';
  direction?: 1 | -1;
  size?: number;
  usePhotoCharacter?: boolean;
}

export const CockroachSvgSprite: React.FC<CockroachSpriteProps> = ({
  variant = 'deedee',
  direction = 1,
  size = 56,
  usePhotoCharacter = true,
}) => {
  const getRoachImage = () => {
    switch (variant) {
      case 'deedee':
        return deedeeImg;
      case 'joey':
        return joeyImg;
      case 'marky':
        return markyImg;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'deedee':
        return 'border-amber-400 ring-2 ring-amber-600/70 shadow-amber-950/80';
      case 'joey':
        return 'border-rose-400 ring-2 ring-rose-600/70 shadow-rose-950/80';
      case 'marky':
        return 'border-emerald-400 ring-2 ring-emerald-600/70 shadow-emerald-950/80';
    }
  };

  const getBadgeTitle = () => {
    switch (variant) {
      case 'deedee':
        return 'DEE DEE';
      case 'joey':
        return 'JOEY';
      case 'marky':
        return 'MARKY';
    }
  };

  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="relative select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center"
    >
      {usePhotoCharacter ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Real Character Round Frame Cutout (Image flips horizontally based on direction) */}
          <div
            className={`w-full h-full rounded-full overflow-hidden border-3 bg-stone-900 shadow-lg flex items-center justify-center ${getBorderColor()}`}
          >
            <img
              src={getRoachImage()}
              alt={getBadgeTitle()}
              referrerPolicy="no-referrer"
              style={{ transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)' }}
              className="w-full h-full object-cover scale-110 object-center transition-transform duration-200"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/50" />
          </div>

          {/* Real Hurdle Warning Marker - Stays upright */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black font-mono px-1.5 py-0.2 rounded-full border border-amber-300 shadow-md whitespace-nowrap z-10">
            ⚠️ HURDLE
          </div>
        </div>
      ) : (
        /* Fallback Vector */
        <svg viewBox="0 0 60 60" style={{ transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)' }} className="w-full h-full overflow-visible">
          <ellipse cx="30" cy="38" rx="14" ry="18" fill="#EA580C" stroke="#431407" strokeWidth="2.5" />
          <ellipse cx="30" cy="20" rx="10" ry="8" fill="#F97316" stroke="#431407" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
};
