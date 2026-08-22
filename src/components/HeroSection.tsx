import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Sparkles,
  ArrowDown,
  Droplets,
  Filter,
  Layers,
  ShieldCheck,
  Award,
  Zap,
  Calculator,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { CHARACTERS } from '../data/characters';
import heroBannerImg from '../assets/images/oggy_water_hero_1787314864356.jpg';

interface HeroSectionProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  aquiferDepth: number;
  theme?: 'light' | 'dark';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStart,
  aquiferDepth,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const characterList = Object.values(CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Interactive Roof Water Calculator State
  const [roofArea, setRoofArea] = useState<number>(120);
  const [rainfallMm, setRainfallMm] = useState<number>(900);

  // Hydrology formula: Harvested Litres = Roof Area (sq.m) * Rainfall (mm) * Runoff Coeff (0.85)
  const harvestedLitres = Math.round(roofArea * rainfallMm * 0.85);
  const peopleServedYear = (harvestedLitres / (135 * 365)).toFixed(1); // 135 L/day per person
  const waterTableRiseEstimate = (harvestedLitres / 100000).toFixed(2);

  const handleCharacterClick = (charId: string) => {
    setSelectedCharId((prev) => (prev === charId ? null : charId));
    sound.playWaterDrop();
  };

  return (
    <div className={`w-full flex flex-col items-center font-sans pb-0 overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
    }`}>
      {/* 1. Full-Width Less-Faded Hero Image Banner with Website Title, Description & Play Now Button */}
      <div className="relative w-full overflow-hidden bg-slate-950 min-h-[520px] sm:min-h-[600px] md:min-h-[680px] lg:min-h-[740px] flex items-center justify-center">
        {/* Less-Faded Background Image covering 100% Screen Width */}
        <motion.div
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={heroBannerImg}
            alt="Oggy and the Cockroaches Rainwater Harvesting Mission"
            className="w-full h-full object-cover object-center opacity-80 sm:opacity-85 filter brightness-95"
          />

          {/* Gentle cinematic overlay to keep text 100% legible while showing the vibrant artwork */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/30 pointer-events-none" />
        </motion.div>

        {/* Content Centered Over the Artwork */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto py-10 sm:py-14">
          {/* Mission Pill Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-yellow-400 text-slate-950 font-black px-4 py-1.5 rounded-full border-2 border-slate-950 shadow-[3px_3px_0px_#000] text-xs sm:text-sm uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
            <span>Interactive Educational Arcade</span>
          </motion.div>

          {/* Website Name / Title */}
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
          >
            OGGY &amp; THE COCKROACHES
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-sky-400 mt-2 sm:mt-3 normal-case font-extrabold tracking-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Rainwater Harvesting Mission
            </span>
          </motion.h1>

          {/* Short Engaging Description without background container */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-100 text-sm sm:text-base md:text-lg lg:text-xl font-bold max-w-2xl mt-4 sm:mt-5 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            Embark on an epic 3,500 km All-India Road Trip from Kashmir to Kanyakumari with Oggy, Jack, Olivia, and Bob to collect rooftop rainwater, revive ancient stepwells, and recharge deep aquifers!
          </motion.p>

          {/* Play Now CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                sound.playSplash();
                onStart();
              }}
              id="hero-play-now-btn"
              className="py-4 sm:py-5 px-10 sm:px-14 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-black text-xl sm:text-2xl lg:text-3xl border-4 border-slate-950 shadow-[0_8px_0_#0F172A] hover:shadow-[0_10px_0_#0F172A] active:shadow-[0_2px_0_#0F172A] active:translate-y-1.5 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-3 text-center"
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-slate-950 shrink-0" />
              <span>PLAY NOW!</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Floating Scroll Teaser Bar */}
      <div className={`w-full py-3.5 px-4 flex flex-wrap justify-center items-center gap-3 sm:gap-8 text-xs sm:text-sm font-black select-none shadow-xs border-y transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-sky-300'
          : 'bg-sky-50 border-sky-100 text-sky-900'
      }`}>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-500 fill-sky-400" />
          <span>Current Aquifer Level: <strong className={isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'}>{aquiferDepth.toFixed(1)}m Depth</strong></span>
        </div>
        <span className={isDark ? 'hidden sm:inline text-slate-600' : 'hidden sm:inline text-sky-300'}>•</span>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          <span>10 Animated Arcade Stages</span>
        </div>
        <span className={isDark ? 'hidden sm:inline text-slate-600' : 'hidden sm:inline text-sky-300'}>•</span>
        <div className="flex items-center gap-1.5 text-sky-500 animate-bounce">
          <span>Explore characters &amp; science below</span>
          <ArrowDown className="w-4 h-4 text-sky-500" />
        </div>
      </div>

      {/* 2. Standing Characters Lineup (No Box Cards) */}
      <section className="w-full px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-4xl mx-auto"
        >
          <span className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border ${
            isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800' : 'text-sky-600 bg-sky-50 border-sky-200'
          }`}>
            Interactive Cartoon Squad
          </span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mt-3 tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Meet the Hydro Mission Crew
          </h2>
          <p className={`text-base sm:text-lg font-semibold max-w-2xl mx-auto mt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Click on any character to hear their mission role and catchphrase!
          </p>
        </motion.div>

        {/* Standing Characters Showcase with Staggered Scroll Reveal */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 items-end">
          {characterList.map((char, index) => {
            const isSelected = selectedCharId === char.id;

            return (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleCharacterClick(char.id)}
                className="flex flex-col items-center text-center group cursor-pointer w-full"
              >
                {/* Floating Cartoon Dialogue Bubble */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{
                    y: isSelected ? -8 : 0,
                    scale: isSelected ? 1.05 : 1,
                    opacity: 1,
                  }}
                  transition={{ delay: 0.08 * index }}
                  className={`relative text-xs font-bold p-3.5 rounded-2xl border-2 shadow-[3px_3px_0px_#0F172A] mb-4 max-w-[240px] w-full transition-colors ${
                    isSelected
                      ? 'bg-yellow-300 text-slate-950 border-slate-950 ring-2 ring-yellow-400'
                      : isDark
                        ? 'bg-slate-800 text-slate-100 border-slate-700'
                        : 'bg-white text-slate-800 border-slate-900'
                  }`}
                >
                  <span className="block leading-relaxed">"{char.catchphrase}"</span>
                  {isSelected && (
                    <span className="block text-[10px] font-black text-emerald-800 mt-1 uppercase tracking-wide">
                      🔊 {char.role}
                    </span>
                  )}
                  {/* Speech Bubble Arrow pointing down to character */}
                  <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-t-[10px] ${
                    isDark && !isSelected ? 'border-t-slate-700' : 'border-t-slate-900'
                  }`}>
                    <div
                      className={`absolute -top-[10px] -left-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] ${
                        isSelected ? 'border-t-yellow-300' : isDark ? 'border-t-slate-800' : 'border-t-white'
                      }`}
                    />
                  </div>
                </motion.div>

                {/* Standing Character Figure */}
                <motion.div
                  whileHover={{ scale: 1.08, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  className="relative flex flex-col items-center select-none"
                >
                  {/* Character Cutout Illustration */}
                  <div className={`w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-yellow-100/80 ring-4 ring-yellow-400 shadow-xl'
                      : isDark ? 'bg-slate-800/80 ring-2 ring-slate-700' : 'bg-sky-50/60'
                  }`}>
                    <img
                      src={char.image}
                      alt={char.name}
                      className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Ground Contact Shadow */}
                  <div className={`w-28 sm:w-36 h-3 rounded-full blur-[2px] -mt-2 mb-3 ${
                    isDark ? 'bg-black/50' : 'bg-slate-950/15'
                  }`} />
                </motion.div>

                {/* Character Details */}
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <h3 className={`font-black text-xl sm:text-2xl tracking-tight flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span>{char.name}</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                  </h3>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs border ${
                    isDark
                      ? 'text-sky-300 bg-sky-950/80 border-sky-700'
                      : 'text-sky-800 bg-sky-100/90 border-sky-300'
                  }`}>
                    {char.role}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. The 4-Step Rainwater Harvesting Journey (Educational Infographic) */}
      <section
        id="hydrology-science-section"
        className={`w-full py-16 sm:py-20 px-4 sm:px-8 lg:px-12 border-y transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800'
            : 'bg-gradient-to-b from-sky-50 to-white border-sky-100'
        }`}
      >
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 max-w-4xl mx-auto"
          >
            <span className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border ${
              isDark
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : 'text-emerald-700 bg-emerald-100 border-emerald-300'
            }`}>
              Hydrological Science Simplified
            </span>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mt-3 tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              How Rainwater Recharges Our Earth
            </h2>
            <p className={`text-base sm:text-lg font-semibold max-w-2xl mx-auto mt-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Follow Oggy's 4-stage engineering cycle to turn storm runoff into pure subterranean drinking water.
            </p>
          </motion.div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`rounded-3xl p-6 sm:p-8 border-3 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-950'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center font-black text-xl border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] mb-4">
                  1
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Rooftop Catchment</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Sloped roofs collect pure falling rain with <strong>85-90% efficiency</strong> before water touches polluted ground.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs font-bold text-sky-400">
                <Droplets className="w-4 h-4" />
                <span>Level 1: Gutter Catchment</span>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`rounded-3xl p-6 sm:p-8 border-3 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-950'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] mb-4">
                  2
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>First-Flush Bypass</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  The first 10 minutes of rain wash roof dirt and bird droppings. The diverter valve automatically discards it safely.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs font-bold text-amber-400">
                <Filter className="w-4 h-4" />
                <span>Level 2: Flush Valve</span>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`rounded-3xl p-6 sm:p-8 border-3 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-950'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-xl border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] mb-4">
                  3
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Bio-Sand Filter</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Layers of boulders, gravel, silica sand, and charcoal naturally remove 99% of suspended silt and odors.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Layers className="w-4 h-4" />
                <span>Level 3: Filter Chamber</span>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`rounded-3xl p-6 sm:p-8 border-3 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-950'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-400 text-slate-950 flex items-center justify-center font-black text-xl border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] mb-4">
                  4
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Deep Aquifer Injection</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Filtered rainwater flows into deep borewells, replenishing subterranean groundwater and raising water tables.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs font-bold text-purple-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Level 6 &amp; 7: Borewell Injector</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Rooftop Water Potential Calculator (Full-Bleed Full Length) */}
      <section
        id="roof-calculator-section"
        className="w-full border-y-4 border-slate-950 bg-slate-900 text-white py-16 sm:py-20 px-4 sm:px-8 lg:px-12 relative overflow-hidden"
      >
        {/* Background Decorative glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10">
          {/* Left Controls with Scroll Reveal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 bg-yellow-400 text-slate-950 font-black px-3.5 py-1 rounded-full text-xs uppercase tracking-wider w-fit">
              <Calculator className="w-4 h-4" />
              <span>Interactive Hydrology Simulator</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-white">
              How Much Rainwater Can <span className="text-yellow-400">Your Roof</span> Save?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base font-medium">
              Adjust roof size and monsoon rainfall to estimate real-world aquifer replenishment across your property.
            </p>

            {/* Slider 1: Roof Area */}
            <div className="flex flex-col gap-2 bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-center text-sm sm:text-base font-black">
                <span className="text-slate-300">Rooftop Catchment Area:</span>
                <span className="text-yellow-400 font-extrabold text-base sm:text-lg">{roofArea} sq. meters</span>
              </div>
              <input
                type="range"
                min="40"
                max="400"
                step="10"
                value={roofArea}
                onChange={(e) => setRoofArea(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer h-2.5 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Slider 2: Annual Rainfall */}
            <div className="flex flex-col gap-2 bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-center text-sm sm:text-base font-black">
                <span className="text-slate-300">Average Annual Rainfall:</span>
                <span className="text-sky-400 font-extrabold text-base sm:text-lg">{rainfallMm} mm/year</span>
              </div>
              <input
                type="range"
                min="400"
                max="2200"
                step="50"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-2.5 bg-slate-700 rounded-lg"
              />
            </div>
          </motion.div>

          {/* Right Output Results Card with Scroll Reveal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-1/2 bg-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl border-2 border-slate-700 flex flex-col gap-5 shadow-2xl"
          >
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Annual Ecological Harvest Output
            </span>

            <div className="flex flex-col gap-1">
              <motion.span
                key={harvestedLitres}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-emerald-400 tracking-tight"
              >
                {harvestedLitres.toLocaleString()} L
              </motion.span>
              <span className="text-xs sm:text-sm font-bold text-slate-300">Fresh Clean Rainwater Stored Per Year</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700 flex flex-col">
                <span className="text-xs text-slate-400 font-bold">Household Drinking:</span>
                <span className="text-xl sm:text-2xl font-black text-yellow-400 mt-1">~{peopleServedYear} People</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Full annual supply</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700 flex flex-col">
                <span className="text-xs text-slate-400 font-bold">Aquifer Water Rise:</span>
                <span className="text-xl sm:text-2xl font-black text-sky-400 mt-1">+{waterTableRiseEstimate} Meters</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Deep table boost</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero pumping power needed when gravity slope piping is used!</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Decorative Visual Gap & Transitional Divider between Calculator and CTA */}
      <div className={`w-full py-8 sm:py-12 flex items-center justify-center relative select-none transition-colors ${
        isDark ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="w-full max-w-4xl mx-auto px-4 flex items-center gap-4">
          <div className={`flex-1 h-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-slate-950 bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000]">
            <Droplets className="w-4 h-4 animate-bounce text-sky-700 fill-sky-700" />
            <span>Ready for the Hydro Arcade?</span>
            <Sparkles className="w-4 h-4 animate-spin text-amber-900" />
          </div>
          <div className={`flex-1 h-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* Grand Final CTA Section (Full-Bleed Full Length Cover with Animations) */}
      <section className="w-full border-t-4 border-b-4 border-slate-950 bg-gradient-to-br from-sky-400 via-sky-300 to-emerald-300 py-16 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12 text-center relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/25 rounded-full blur-2xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl mx-auto flex flex-col items-center relative z-10"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 bg-yellow-400 text-slate-950 font-black px-4 py-1.5 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_#0F172A] text-xs sm:text-sm uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4 animate-spin text-amber-900" />
            <span>Ready for the Hydro Adventure?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 leading-tight mb-4 tracking-tight">
            Help Oggy Save the Water Table!
          </h2>

          <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 max-w-2xl mb-8 leading-relaxed">
            Stop Dee Dee &amp; Joey’s sabotage, build bio-sand recharge pits, and unlock your official personalized Hydro Hero Certificate!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <motion.button
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sound.playSplash();
                onStart();
              }}
              id="start-mission-cta-btn"
              className="w-full sm:w-auto py-5 px-12 sm:px-20 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-black text-xl sm:text-3xl border-4 border-slate-950 shadow-[0_8px_0_#0F172A] hover:shadow-[0_10px_0_#0F172A] active:shadow-[0_2px_0_#0F172A] active:translate-y-1.5 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-3 text-center"
            >
              <Play className="w-8 h-8 fill-slate-950 shrink-0" />
              <span>START PLAYING!</span>
            </motion.button>
          </div>

          {/* Feature Highlights with Staggered Scroll Reveal */}
          <div className="grid grid-cols-3 gap-4 sm:gap-10 mt-12 pt-8 border-t-2 border-slate-950/20 w-full max-w-2xl text-slate-900 text-xs sm:text-sm font-black">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950">5</span>
              <span className="text-slate-800 text-xs sm:text-sm font-bold">Expedition Stages</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950">3,500 km</span>
              <span className="text-slate-800 text-xs sm:text-sm font-bold">India Road Trip</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950">100%</span>
              <span className="text-slate-800 text-xs sm:text-sm font-bold">Free &amp; Educational</span>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
