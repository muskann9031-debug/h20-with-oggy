import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Droplets,
  Coins,
  Heart,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Flame,
  Award,
} from 'lucide-react';
import { RoadTripStage, StageChallengeOption } from '../types';
import { CHARACTERS } from '../data/characters';
import { sound } from '../utils/audio';

interface RoadTripMissionModalProps {
  stage: RoadTripStage;
  isOpen: boolean;
  onClose: () => void;
  onCompleteStage?: (stageId: number, earnedCoins: number, earnedStars: number) => void;
  onComplete?: (stageId: number, earnedCoins: number, earnedStars: number) => void;
  currentCoins?: number;
  currentLives?: number;
}

export const RoadTripMissionModal: React.FC<RoadTripMissionModalProps> = ({
  stage,
  isOpen,
  onClose,
  onCompleteStage,
  onComplete,
  currentCoins = 0,
  currentLives = 5,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'mission' | 'science'>('mission');

  const character = CHARACTERS[stage.character] || CHARACTERS.oggy;

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsCorrect(false);
      setActiveTab('mission');
      sound.playClick();
    }
  }, [isOpen, stage.id]);

  if (!isOpen) return null;

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    const option = stage.interactiveMission.options.find((o) => o.id === selectedOption);
    if (!option) return;

    setIsAnswerSubmitted(true);
    if (option.isCorrect) {
      setIsCorrect(true);
      sound.playVictoryFanfare();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0284C7', '#38BDF8', '#FACC15', '#22C55E', '#EC4899'],
      });
    } else {
      setIsCorrect(false);
      sound.playErrorBuzz();
    }
  };

  const handleFinishAndTravel = () => {
    sound.playSplash();
    const stars = isCorrect ? 3 : 1;
    if (onCompleteStage) {
      onCompleteStage(stage.id, stage.rewardCoins, stars);
    } else if (onComplete) {
      onComplete(stage.id, stage.rewardCoins, stars);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 25 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-amber-50/95 rounded-3xl border-4 border-slate-950 shadow-[10px_14px_0px_#0F172A] overflow-hidden text-slate-900 my-6"
        >
          {/* Top Bar Header with Vintage Parchment Accent */}
          <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 p-4 sm:p-5 text-white relative border-b-4 border-slate-950">
            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/70 text-white rounded-full border-2 border-white/40 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-yellow-400 text-slate-950 font-black text-xs uppercase px-3 py-0.5 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
                {stage.state}
              </span>
              <span className="bg-slate-900/60 text-sky-200 font-bold text-xs px-2.5 py-0.5 rounded-full border border-sky-300/30 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-yellow-300" />
                <span>{stage.city}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[2px_2px_0px_#0F172A]">
              {stage.title}
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 font-semibold mt-0.5">
              {stage.subtitle}
            </p>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b-2 border-amber-300 bg-amber-100/80 px-4 pt-2 gap-2 text-xs font-black">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('mission');
              }}
              className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'mission'
                  ? 'bg-amber-50 text-slate-900 border-t-2 border-x-2 border-slate-950 font-black shadow-[0_-2px_0_#0F172A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎯 Stage Mission &amp; Challenge
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('science');
              }}
              className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'science'
                  ? 'bg-amber-50 text-slate-900 border-t-2 border-x-2 border-slate-950 font-black shadow-[0_-2px_0_#0F172A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔬 Hydrological Science &amp; Lore
            </button>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-4 max-h-[72vh] overflow-y-auto">
            {/* Character Dialogue Banner */}
            <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-3 border-slate-950 shadow-[3px_3px_0px_#0F172A]">
              <div className="w-12 h-12 rounded-xl border-2 border-slate-950 overflow-hidden shadow-sm bg-sky-100 shrink-0">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    {character.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
                    {character.role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 italic leading-relaxed">
                  "{stage.dialogue}"
                </p>
              </div>
            </div>

            {/* TAB 1: Mission Challenge */}
            {activeTab === 'mission' && (
              <div className="flex flex-col gap-4">
                {/* Mission Objective Box */}
                <div className="bg-amber-100/70 border-2 border-amber-300 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{stage.interactiveMission.badge}</span>
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      +{stage.rewardCoins} 🪙 Coins
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1">
                    {stage.interactiveMission.missionTitle}
                  </h3>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {stage.interactiveMission.description}
                  </p>
                </div>

                {/* Challenge Question */}
                <div className="bg-white border-3 border-slate-950 rounded-2xl p-4 shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black text-sky-800 uppercase tracking-wider">
                    <span className="bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300">
                      Hydro Engineering Question
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {stage.interactiveMission.question}
                  </p>

                  {/* Multiple Choice Options */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {stage.interactiveMission.options.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      let optionClasses = 'bg-slate-50 border-2 border-slate-300 text-slate-800 hover:bg-sky-50 hover:border-sky-400';

                      if (isAnswerSubmitted) {
                        if (opt.isCorrect) {
                          optionClasses = 'bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-bold';
                        } else if (isSelected && !opt.isCorrect) {
                          optionClasses = 'bg-rose-100 border-2 border-rose-600 text-rose-950 line-through';
                        } else {
                          optionClasses = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        optionClasses = 'bg-yellow-100 border-3 border-slate-950 text-slate-950 font-bold shadow-[2px_2px_0px_#000]';
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswerSubmitted}
                          onClick={() => {
                            sound.playClick();
                            setSelectedOption(opt.id);
                          }}
                          className={`p-3 rounded-xl text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-2.5 ${optionClasses}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {opt.id.replace('opt', '')}
                          </span>
                          <span className="flex-1 font-medium leading-relaxed">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {isAnswerSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-2.5 text-xs font-semibold ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-rose-50 border-rose-400 text-rose-900'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className="font-black block mb-0.5">
                          {isCorrect ? '🌟 Brilliant Hydrology Engineering!' : '💡 Let’s Review the Hydro Science:'}
                        </span>
                        <span>
                          {stage.interactiveMission.options.find((o) => o.id === selectedOption)?.explanation ||
                            stage.interactiveMission.options.find((o) => o.isCorrect)?.explanation}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Stage Rewards Preview */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-black">
                  <div className="bg-yellow-100 border-2 border-yellow-400 p-2.5 rounded-xl text-amber-950">
                    <Coins className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>+{stage.rewardCoins} Coins</span>
                  </div>
                  <div className="bg-sky-100 border-2 border-sky-400 p-2.5 rounded-xl text-sky-950">
                    <Droplets className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                    <span>+{stage.waterRechargeLiters.toLocaleString()} L</span>
                  </div>
                  <div className="bg-emerald-100 border-2 border-emerald-400 p-2.5 rounded-xl text-emerald-950">
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span>+{stage.aquiferTableGain}m Water Table</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Science & Lore */}
            {activeTab === 'science' && (
              <div className="flex flex-col gap-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col gap-2">
                  <span className="font-black text-amber-900 uppercase text-xs tracking-wider">
                    📖 Regional Hydrology Story
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {stage.story}
                  </p>
                </div>

                <div className="bg-sky-50 p-4 rounded-2xl border-2 border-sky-300 shadow-sm flex flex-col gap-2">
                  <span className="font-black text-sky-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>Scientific Fact</span>
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {stage.scienceFact}
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-300 shadow-sm flex flex-col gap-2">
                  <span className="font-black text-emerald-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Why This Matters for India's Water Future</span>
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {stage.whyItMatters}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-4 sm:p-5 bg-amber-100/90 border-t-3 border-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span>Transport:</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-400 font-black text-slate-900">
                {stage.transportLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isAnswerSubmitted ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                  className={`w-full sm:w-auto py-3 px-6 rounded-2xl font-black text-xs sm:text-sm border-3 border-slate-950 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
                    selectedOption
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-900" />
                  <span>Submit Hydro Answer</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFinishAndTravel}
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm border-3 border-slate-950 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer transition-all"
                >
                  <span>Complete &amp; Drive to Next Checkpoint</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
