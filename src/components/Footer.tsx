import React from 'react';
import { motion } from 'motion/react';
import {
  Droplets,
  Sparkles,
  ArrowUp,
  Award,
  Gamepad2,
  MapPin,
  Heart,
  CloudRain,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface FooterProps {
  onStart: () => void;
  onOpenMap: () => void;
  onOpenCertificate: () => void;
  theme?: 'light' | 'dark';
}

const WATER_FACTS = [
  '💡 100 sq.m of rooftop can catch ~85,000 Litres of rain annually!',
  '🌧️ Bio-sand filters remove 99% of suspended sediment and turbidity.',
  '🌱 Groundwater recharge wells prevent soil subsidence and urban drying.',
  '💧 Sloped roofs deliver up to 90% rainwater harvesting efficiency.',
];

export const Footer: React.FC<FooterProps> = ({
  onStart,
  onOpenMap,
  onOpenCertificate,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const scrollToTop = () => {
    sound.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCalculator = () => {
    sound.playClick();
    const calcSection = document.getElementById('roof-calculator-section');
    if (calcSection) {
      calcSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToScience = () => {
    sound.playClick();
    const sciSection = document.getElementById('hydrology-science-section');
    if (sciSection) {
      sciSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className={`w-full border-t-4 border-slate-950 font-sans transition-colors duration-200 relative overflow-hidden ${
        isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-900 text-white'
      }`}
    >
      {/* Decorative Wave / Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-sky-400 to-emerald-400" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Animated Facts Ticker */}
      <div className="w-full bg-slate-950/60 border-b border-slate-800/80 py-2.5 px-4 overflow-hidden select-none">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          className="flex items-center gap-10 whitespace-nowrap text-xs font-black text-sky-300 w-max"
        >
          {WATER_FACTS.concat(WATER_FACTS).map((fact, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span>{fact}</span>
              <span className="text-yellow-400">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 items-start">
          {/* Column 1: Brand & Mascot Mission */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 border-3 border-slate-950 flex items-center justify-center font-black text-2xl shadow-[3px_3px_0px_#000] shrink-0"
              >
                🐱
              </motion.div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-tight">
                  Oggy's Hydro Mission
                </h3>
                <p className="text-xs text-sky-400 font-bold">
                  Rainwater Harvesting Arcade
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
              Empowering students and communities with genuine hydrological science through interactive arcade missions, cockroach battles, and aquifer recharges.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl w-fit">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Free Educational Platform</span>
            </div>
          </div>

          {/* Column 2: Quick Interactive Actions */}
          <div className="flex flex-col gap-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Quick Navigation</span>
            </h4>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm font-bold text-slate-300">
              <li>
                <button
                  onClick={() => {
                    sound.playSplash();
                    onStart();
                  }}
                  className="hover:text-yellow-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-sky-400">▸</span> Start Mission (Stage 1)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenMap();
                  }}
                  className="hover:text-yellow-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-sky-400">▸</span> Mission Map &amp; Stages
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenCertificate();
                  }}
                  className="hover:text-yellow-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-sky-400">▸</span> View Hydro Hero Certificate
                </button>
              </li>
              <li>
                <button
                  onClick={scrollToCalculator}
                  className="hover:text-yellow-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-sky-400">▸</span> Rainwater Harvest Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={scrollToScience}
                  className="hover:text-yellow-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-sky-400">▸</span> 4-Step Hydrological Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: The 4 Recharge Pillars */}
          <div className="flex flex-col gap-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-sky-400 flex items-center gap-2">
              <CloudRain className="w-4 h-4" />
              <span>Harvesting Science</span>
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400 font-medium">
              <div className="flex items-start gap-2">
                <span className="font-black text-yellow-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">1</span>
                <span><strong>Rooftop Catchment:</strong> 85-90% collection efficiency</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">2</span>
                <span><strong>First-Flush Diverter:</strong> Discard dirty initial storm runoff</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">3</span>
                <span><strong>Bio-Sand Chamber:</strong> Multi-layer physical filtration</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-purple-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">4</span>
                <span><strong>Aquifer Injector:</strong> Direct subterranean table recharge</span>
              </div>
            </div>
          </div>

          {/* Column 4: Back to Top & Audio Feedback */}
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Join the Campaign</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Catch rain where it falls. Every drop saved today secures drinking water for tomorrow.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="mt-2 w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm border-2 border-slate-700 shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ArrowUp className="w-4 h-4 text-yellow-400 animate-bounce" />
              <span>Back to Top</span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 text-center sm:text-left">
          <p className="flex items-center justify-center gap-1.5 flex-wrap">
            <span>Oggy &amp; the Cockroaches™ Rainwater Mission</span>
            <span>•</span>
            <span className="text-slate-500">Created with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-slate-500">for Water Conservation Education</span>
          </p>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>10 Arcade Levels</span>
            <span>•</span>
            <span>Clean Aquifer Goal</span>
            <span>•</span>
            <span className="text-yellow-400 font-bold">v2.4 Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
