import React from 'react';
import { motion } from 'motion/react';
import realOggyImg from '../assets/images/oggy_real_character_1787323095337.jpg';

interface StandingOggyProps {
  isMoving?: boolean;
  angle?: number;
  speechText?: string;
  showSpeech?: boolean;
  scale?: number;
  onHonk?: () => void;
  vehicleMode?: 'standing' | 'rickshaw' | 'jeep';
}

export const StandingOggyCharacter: React.FC<StandingOggyProps> = ({
  isMoving = false,
  speechText = 'Chalo! India ke har aquifer ko bachayenge!',
  showSpeech = true,
  scale = 1.0,
  onHonk,
  vehicleMode = 'standing',
}) => {
  return (
    <div
      className="relative flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onHonk}
      title="Click to interact with Real Oggy!"
    >
      {/* Dynamic Speech Bubble */}
      {showSpeech && speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-16 z-50 bg-white dark:bg-slate-900 border-3 border-slate-950 px-3.5 py-1.5 rounded-2xl shadow-[4px_4px_0px_#0F172A] whitespace-nowrap flex items-center gap-1.5 pointer-events-none"
        >
          <span className="text-xs font-black text-slate-900 dark:text-yellow-300">
            {speechText}
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-r-3 border-b-3 border-slate-950 rotate-45" />
        </motion.div>
      )}

      {/* Ripple water circle at feet */}
      <motion.div
        animate={{
          scale: isMoving ? [1, 1.4, 1] : [1, 1.15, 1],
          opacity: [0.7, 0.25, 0.7],
        }}
        transition={{ repeat: Infinity, duration: 1.1 }}
        className="absolute -bottom-1.5 w-20 h-7 rounded-[100%] bg-sky-400/50 border border-sky-500 blur-[0.5px]"
      />

      {/* REAL OGGY ANIMATED CHARACTER */}
      {vehicleMode === 'standing' ? (
        <motion.div
          animate={
            isMoving
              ? {
                  y: [0, -10, 0, -10, 0],
                  rotate: [-4, 4, -4, 4, -4],
                }
              : {
                  y: [0, -3, 0],
                  rotate: [0, 1.5, 0, -1.5, 0],
                }
          }
          transition={{
            repeat: Infinity,
            duration: isMoving ? 0.4 : 2.4,
            ease: 'easeInOut',
          }}
          style={{ transform: `scale(${scale})` }}
          className="relative flex flex-col items-center filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.5)]"
        >
          {/* Authentic Real Oggy Character Artwork Circular Frame */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Cutout Image with circular frame and glowing aura */}
            <div className="relative w-22 h-22 rounded-full overflow-hidden border-3.5 border-slate-950 bg-gradient-to-b from-sky-300 via-sky-400 to-sky-600 shadow-[0_6px_0px_#0F172A] ring-2 ring-yellow-400/90 flex items-center justify-center p-0.5">
              <img
                src={realOggyImg}
                alt="Real Oggy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center rounded-full transform hover:scale-105 transition-transform"
              />
              {/* Hydro hero water icon badge overlay */}
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-yellow-400 border border-slate-950 flex items-center justify-center text-[10px] font-black shadow-xs">
                💧
              </div>
            </div>

            {/* Walking feet motion dust clouds when moving */}
            {isMoving && (
              <motion.div
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.3, 0.8],
                  x: [-8, 8, -8],
                }}
                transition={{ repeat: Infinity, duration: 0.4 }}
                className="absolute -bottom-2 text-xs"
              >
                💨
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Rickshaw / Rover Mode */
        <motion.div
          animate={
            isMoving
              ? { y: [0, -4, 0], rotate: [-3, 3, -3] }
              : { y: [0, -1, 0] }
          }
          transition={{ repeat: Infinity, duration: 0.3 }}
          className="text-4xl filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]"
        >
          {vehicleMode === 'rickshaw' ? '🛺' : '🚙'}
        </motion.div>
      )}

      {/* Character Name Tag */}
      <div className="mt-1 bg-yellow-400 text-slate-950 border-2 border-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_#000] flex items-center gap-1">
        <span>🐾</span>
        <span>REAL OGGY • HYDRO HERO</span>
      </div>
    </div>
  );
};

