import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins,
  Heart,
  Droplets,
  Star,
  Sparkles,
  MapPin,
  Compass,
  ArrowRight,
  RotateCcw,
  Award,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { RoadTripStage, PlayerProgress } from '../types';
import { ROAD_TRIP_STAGES } from '../data/stages';
import { RoadTripMissionModal } from './RoadTripMissionModal';
import { KulsHimalayasGame } from './KulsHimalayasGame';
import { StepwellChallengeGame } from './StepwellChallengeGame';
import { BambooForestGame } from './BambooForestGame';
import { StandingOggyCharacter } from './StandingOggyCharacter';
import { sound } from '../utils/audio';
import waterWiseMapImg from '../assets/images/water_wise_map_1787324489688.jpg';

interface AdventureRoadTripMapProps {
  progress: PlayerProgress;
  onUpdateProgress: (newProgress: PlayerProgress) => void;
  onOpenCertificate: () => void;
  theme?: 'light' | 'dark';
}

// Stage Coordinates on the Pixel-Art India Map (viewBox 0 0 1264 848)
export const STAGE_COORDS: Record<number, { x: number; y: number; name: string; landmark: string; region: string }> = {
  1: { x: 535, y: 155, name: 'Jammu & Kashmir', landmark: 'Dal Lake & Alpine Guls', region: 'Himalayan Slopes (North)' },
  2: { x: 340, y: 345, name: 'Rajasthan', landmark: 'Thar Desert & Baori Stepwells', region: 'Thar Desert (West)' },
  3: { x: 545, y: 710, name: 'Kerala', landmark: 'Erni Reservoirs & Coastal Wetlands', region: 'Western Ghats (South)' },
  4: { x: 915, y: 310, name: 'Meghalaya', landmark: 'Cherrapunji & Bamboo Drip Network', region: 'Khasi Hills (North-East)' },
};

// SVG Bezier Curves for each segment between stages
export const STAGE_PATHS: Record<number, { d: string; fromCoord: { x: number; y: number }; toCoord: { x: number; y: number } }> = {
  1: {
    // Stage 1 (Jammu & Kashmir) -> Stage 2 (Rajasthan)
    d: 'M 535 155 C 490 220, 400 270, 340 345',
    fromCoord: { x: 535, y: 155 },
    toCoord: { x: 340, y: 345 },
  },
  2: {
    // Stage 2 (Rajasthan) -> Stage 3 (Kerala)
    d: 'M 340 345 C 420 440, 490 560, 545 710',
    fromCoord: { x: 340, y: 345 },
    toCoord: { x: 545, y: 710 },
  },
  3: {
    // Stage 3 (Kerala) -> Stage 4 (Meghalaya)
    d: 'M 545 710 C 650 600, 780 440, 915 310',
    fromCoord: { x: 545, y: 710 },
    toCoord: { x: 915, y: 310 },
  },
};

// Combined Full-Length Highway
export const FULL_HIGHWAY_PATH = 'M 535 155 C 490 220, 400 270, 340 345 C 420 440, 490 560, 545 710 C 650 600, 780 440, 915 310';

// Waypoints for continuous walk across India
const HIGHWAY_WAYPOINTS = [
  { t: 0.00, x: 535, y: 155, stage: 1, text: 'Stage 1: Kashmir - Himalayan Snowmelt Alpine Guls! 🏔️' },
  { t: 0.16, x: 440, y: 250, text: 'Passing Punjab & Northern Plains! 🌾' },
  { t: 0.33, x: 340, y: 345, stage: 2, text: 'Stage 2: Rajasthan - Thar Desert Baori Stepwells! 🏜️' },
  { t: 0.50, x: 440, y: 500, text: 'Flowing across Maharashtra & Deccan Plateau! 🌊' },
  { t: 0.66, x: 545, y: 710, stage: 3, text: 'Stage 3: Kerala - Cascading Erni Reservoirs & Backwaters! 🌴' },
  { t: 0.83, x: 740, y: 480, text: 'Flowing across Eastern Ghats & Bengal Basin! 🌿' },
  { t: 1.00, x: 915, y: 310, stage: 4, text: 'Stage 4: Meghalaya - Indigenous Bamboo Drip Network! 🎋' },
];

export const AdventureRoadTripMap: React.FC<AdventureRoadTripMapProps> = ({
  progress,
  onUpdateProgress,
  onOpenCertificate,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const TOTAL_STAGES = ROAD_TRIP_STAGES.length;

  const getTargetTForStage = (stgId: number) => {
    if (TOTAL_STAGES <= 1) return 0;
    return Math.max(0, Math.min(1, (stgId - 1) / (TOTAL_STAGES - 1)));
  };

  const [selectedStageId, setSelectedStageId] = useState<number>(progress.currentStage || 1);
  const [activeModalStage, setActiveModalStage] = useState<RoadTripStage | null>(null);

  // Animation Progression State Machine
  const [animatingSegment, setAnimatingSegment] = useState<{
    fromStage: number;
    toStage: number;
    phase: 'pulse_completed' | 'drawing_line' | 'reach_next' | 'unlocked_celebration' | 'done';
    progress: number; // 0 to 1
  } | null>(null);

  // Traveling particles state during animation
  const [travelParticles, setTravelParticles] = useState<Array<{ id: number; t: number; size: number; offset: number }>>([]);

  // Unlocked celebration effect
  const [celebratingStageId, setCelebratingStageId] = useState<number | null>(null);

  // Real Oggy Travel & Walking State
  const [vehicleProgressT, setVehicleProgressT] = useState<number>(() => {
    return getTargetTForStage(progress.currentStage || 1);
  });

  const [isCruising, setIsCruising] = useState<boolean>(false);
  const [cruiseSpeed, setCruiseSpeed] = useState<number>(1);
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('Chalo! Catch pure rainwater across India!');
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);
  const [currentMilestoneText, setCurrentMilestoneText] = useState<string>('Starting at Kashmir Alpine Guls 🏔️');
  const [oggyMode, setOggyMode] = useState<'standing' | 'rickshaw' | 'jeep'>('standing');

  const animationFrameRef = useRef<number | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const segPathRef = useRef<SVGPathElement | null>(null);

  // Position along the curved highway
  const [oggyPos, setOggyPos] = useState<{ x: number; y: number; angle: number }>({
    x: STAGE_COORDS[progress.currentStage]?.x || 535,
    y: STAGE_COORDS[progress.currentStage]?.y || 155,
    angle: 0,
  });

  const currentStageData =
    ROAD_TRIP_STAGES.find((s) => s.id === progress.currentStage) || ROAD_TRIP_STAGES[0];
  const selectedStageData =
    ROAD_TRIP_STAGES.find((s) => s.id === selectedStageId) || currentStageData;

  // Compute position and orientation from SVG path
  const updatePositionAlongPath = (tVal: number) => {
    const clampedT = Math.max(0, Math.min(1, tVal));
    if (pathRef.current) {
      const path = pathRef.current;
      const totalLen = path.getTotalLength();
      const currentPoint = path.getPointAtLength(clampedT * totalLen);
      
      const nextT = Math.min(1, clampedT + 0.01);
      const nextPoint = path.getPointAtLength(nextT * totalLen);
      const angleRad = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
      const angleDeg = (angleRad * 180) / Math.PI;

      setOggyPos({
        x: currentPoint.x,
        y: currentPoint.y,
        angle: angleDeg,
      });
    } else {
      const startCoord = STAGE_COORDS[1];
      const endCoord = STAGE_COORDS[TOTAL_STAGES] || STAGE_COORDS[4];
      setOggyPos({
        x: startCoord.x + (endCoord.x - startCoord.x) * clampedT,
        y: startCoord.y + (endCoord.y - startCoord.y) * clampedT,
        angle: 45,
      });
    }

    // Milestone text
    let closest = HIGHWAY_WAYPOINTS[0];
    let minDiff = 999;
    for (const wp of HIGHWAY_WAYPOINTS) {
      const diff = Math.abs(wp.t - clampedT);
      if (diff < minDiff) {
        minDiff = diff;
        closest = wp;
      }
    }
    if (closest.text && closest.text !== currentMilestoneText) {
      setCurrentMilestoneText(closest.text);
    }
  };

  useEffect(() => {
    const targetT = getTargetTForStage(progress.currentStage || 1);
    setVehicleProgressT(targetT);
    updatePositionAlongPath(targetT);
  }, [progress.currentStage]);

  // Handle Progressive Water Animation between Stages
  const triggerWaterPathAnimation = (fromStage: number, toStage: number) => {
    if (fromStage >= 4) return;

    sound.playSuccessChime();
    setCelebratingStageId(fromStage);

    // Phase 1: Completed stage marker pulses with success glow
    setAnimatingSegment({
      fromStage,
      toStage,
      phase: 'pulse_completed',
      progress: 0,
    });

    setSpeechBubbleText(`Stage ${fromStage} Complete! Activating Glowing Water Highway! 💧`);
    setShowSpeechBubble(true);

    // Generate traveling particle templates
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      t: 0,
      size: 4 + (i % 3) * 2,
      offset: (i % 2 === 0 ? 1 : -1) * (i * 2),
    }));
    setTravelParticles(newParticles);

    // After 800ms, start drawing the line toward the next stage
    setTimeout(() => {
      sound.playWaterFlow();
      setAnimatingSegment((prev) => (prev ? { ...prev, phase: 'drawing_line', progress: 0 } : null));

      let startTime = performance.now();
      const drawDuration = 2200; // 2.2 seconds smooth line draw

      const animateLine = (now: number) => {
        const elapsed = now - startTime;
        const lineProg = Math.min(1, elapsed / drawDuration);

        setAnimatingSegment((prev) => (prev ? { ...prev, progress: lineProg } : null));

        // Update travel particles along the segment
        setTravelParticles((prev) =>
          prev.map((p) => {
            const pT = Math.max(0, Math.min(1, lineProg - (p.id * 0.12)));
            return { ...p, t: pT };
          })
        );

        if (lineProg < 1) {
          requestAnimationFrame(animateLine);
        } else {
          // Line has reached the next stage marker!
          sound.playSparkleUnlock();
          sound.playVictoryFanfare();
          setCelebratingStageId(toStage);

          setAnimatingSegment((prev) =>
            prev ? { ...prev, phase: 'reach_next', progress: 1 } : null
          );

          setSpeechBubbleText(`Awesome! Stage ${toStage} Unlocked: ${STAGE_COORDS[toStage]?.name}! 🎉`);

          // Move Oggy to newly unlocked stage
          handleWalkToStage(toStage);

          // Phase 3: Unlocked celebration ripple
          setTimeout(() => {
            setAnimatingSegment((prev) =>
              prev ? { ...prev, phase: 'unlocked_celebration' } : null
            );

            // Settle into permanent progress path
            setTimeout(() => {
              setAnimatingSegment(null);
              setCelebratingStageId(null);
            }, 1200);
          }, 800);
        }
      };

      requestAnimationFrame(animateLine);
    }, 800);
  };

  // Continuous Walk / Cruise Loop
  useEffect(() => {
    if (!isCruising) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    const speedMultiplier = cruiseSpeed === 1 ? 0.05 : cruiseSpeed === 2 ? 0.10 : 0.18;

    const animateLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setVehicleProgressT((prevT) => {
        let nextT = prevT + delta * speedMultiplier;
        if (nextT >= 1.0) {
          nextT = 1.0;
          setIsCruising(false);
          sound.playVictoryFanfare();
          setSpeechBubbleText('Yay! Meghalaya reached! All India Groundwater Recharged!');
          setShowSpeechBubble(true);
        } else {
          updatePositionAlongPath(nextT);
        }
        return nextT;
      });

      if (isCruising) {
        animationFrameRef.current = requestAnimationFrame(animateLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCruising, cruiseSpeed]);

  const handleHonk = () => {
    sound.playHonk();
    sound.playVoicePop();
    const oggyLines = [
      'Meowww! Real Oggy is on the All-India Water Harvest expedition! 🐾',
      'Water recharge squad zindabad! 💧',
      'Roaches can not stop Oggy! 🛑',
      'From Kashmir Guls, Thar Baoris, Kerala Ernis to Meghalaya Bamboo! 🛠️',
      'Sawa lakh ki baarish! Groundwater 100% full! 🌧️',
    ];
    const randomLine = oggyLines[Math.floor(Math.random() * oggyLines.length)];
    setSpeechBubbleText(randomLine);
    setShowSpeechBubble(true);
  };

  const handleToggleCruise = () => {
    sound.playEngineRev();
    if (!isCruising) {
      if (vehicleProgressT >= 0.99) {
        setVehicleProgressT(0);
        updatePositionAlongPath(0);
      }
      setIsCruising(true);
      setSpeechBubbleText('Oggy is walking along the Glowing Water Highway! 🇮🇳');
      setShowSpeechBubble(true);
    } else {
      setIsCruising(false);
    }
  };

  const handleWalkToStage = (stgId: number) => {
    sound.playClick();
    setSelectedStageId(stgId);
    const targetT = getTargetTForStage(stgId);

    sound.playEngineRev();
    setIsCruising(false);

    let curr = vehicleProgressT;
    const step = (targetT - curr) / 20;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      curr += step;
      setVehicleProgressT(curr);
      updatePositionAlongPath(curr);
      if (count >= 20) {
        clearInterval(interval);
        setVehicleProgressT(targetT);
        updatePositionAlongPath(targetT);
        sound.playMilestoneJingle();
        setSpeechBubbleText(`Welcome to Stage ${stgId}: ${STAGE_COORDS[stgId]?.name}! 📍`);
        setShowSpeechBubble(true);
      }
    }, 25);
  };

  const handleStageNodeClick = (stageId: number) => {
    sound.playClick();
    setSelectedStageId(stageId);
    handleWalkToStage(stageId);
    const stage = ROAD_TRIP_STAGES.find((s) => s.id === stageId);
    if (stage) {
      setTimeout(() => {
        setActiveModalStage(stage);
      }, 700);
    }
  };

  const handleCompleteStage = (stageId: number, earnedCoins: number, earnedStars: number) => {
    setActiveModalStage(null);

    const nextStageId = stageId + 1;
    const nextUnlocked = Array.from(
      new Set([...progress.unlockedStages, ...(nextStageId <= TOTAL_STAGES ? [nextStageId] : [])])
    );
    const nextCompleted = Array.from(new Set([...progress.completedStages, stageId]));
    const nextStars = {
      ...progress.stageStars,
      [stageId]: Math.max(progress.stageStars[stageId] || 0, earnedStars),
    };

    const stageGain = ROAD_TRIP_STAGES.find((s) => s.id === stageId)?.aquiferTableGain || 2.5;
    const nextDepth = Math.max(2.0, Number((progress.aquiferDepthMeters - stageGain).toFixed(1)));
    const stageHarvest = ROAD_TRIP_STAGES.find((s) => s.id === stageId)?.waterRechargeLiters || 6000;
    const nextHarvest = progress.waterHarvestedLiters + stageHarvest;
    const nextCoins = progress.coins + earnedCoins;

    const updated: PlayerProgress = {
      ...progress,
      currentStage: nextStageId <= TOTAL_STAGES ? nextStageId : TOTAL_STAGES,
      unlockedStages: nextUnlocked,
      completedStages: nextCompleted,
      stageStars: nextStars,
      coins: nextCoins,
      waterHarvestedLiters: nextHarvest,
      aquiferDepthMeters: nextDepth,
      activeVehiclePosition: STAGE_COORDS[nextStageId <= TOTAL_STAGES ? nextStageId : TOTAL_STAGES],
      isAnimatingVehicle: false,
    };

    onUpdateProgress(updated);

    // Trigger the requested glowing water-path line animation!
    if (stageId < TOTAL_STAGES) {
      triggerWaterPathAnimation(stageId, nextStageId);
    } else {
      // Final stage completed: show certificate
      sound.playVictoryFanfare();
      setTimeout(() => {
        onOpenCertificate();
      }, 1500);
    }
  };

  // Helper to test / simulate the water animation flow
  const handleSimulateNextPath = () => {
    const cur = progress.currentStage || 1;
    if (cur < 4) {
      triggerWaterPathAnimation(cur, cur + 1);
    } else {
      triggerWaterPathAnimation(1, 2);
    }
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col items-center justify-start relative select-none transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-[#EBF4FF] text-slate-900'
      }`}
    >
      {/* 1. THE PIXEL-ART INDIA MAP WITH ANIMATED GLOWING WATER HIGHWAY */}
      <main className="w-full px-2 sm:px-4 md:px-6 py-2 flex flex-col items-center justify-center relative">
        <div className="w-full relative rounded-3xl border-4 border-slate-950 shadow-[12px_16px_0px_#0F172A] p-2 sm:p-4 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          
          {/* Header Banner */}
          <div className="absolute top-4 left-6 z-20 pointer-events-none flex items-center gap-2 flex-wrap">
            <span className="bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full border-2 border-slate-950 shadow-sm uppercase flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>All-India Water Harvest Journey</span>
            </span>
            <span className="bg-sky-500 text-white font-black text-xs sm:text-sm px-3.5 py-1 rounded-full border-2 border-slate-950 shadow-sm uppercase">
              Kashmir → Rajasthan → Kerala → Meghalaya
            </span>
          </div>

          {/* Quick Stage Jump Pills */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-1.5 flex-wrap pointer-events-auto">
            <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-white/40 flex items-center gap-2 flex-wrap shadow-xl">
              <span className="text-[11px] font-black uppercase text-yellow-300 mr-1 hidden sm:inline">
                Stages:
              </span>
              {ROAD_TRIP_STAGES.map((stg) => {
                const isSelected = selectedStageId === stg.id;
                const isUnlocked = progress.unlockedStages.includes(stg.id);
                const isCompleted = progress.completedStages.includes(stg.id);
                return (
                  <button
                    key={stg.id}
                    onClick={() => handleStageNodeClick(stg.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-yellow-400 text-slate-950 border-slate-950 shadow-md scale-105'
                        : isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : isUnlocked
                        ? 'bg-sky-600 text-white border-sky-400'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <span>{isCompleted ? '✓' : `S${stg.id}`}</span>
                    <span>{stg.state.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAP CANVAS CONTAINER (Aspect Ratio matching 1264x848) */}
          <div className="w-full relative min-h-[640px] sm:min-h-[750px] md:min-h-[850px] lg:min-h-[900px] max-h-[1100px] mx-auto flex items-center justify-center">
            
            {/* The Pixel-Art India Map Image (Completely Unchanged) */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-1">
              <img
                src={waterWiseMapImg}
                alt="Pixel-Art India Map: Kashmir, Rajasthan, Kerala, Meghalaya"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain select-none pointer-events-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
              />
            </div>

            {/* SVG Interactive Overlay (Exact ViewBox 0 0 1264 848) */}
            <svg
              viewBox="0 0 1264 848"
              className="w-full h-full select-none overflow-visible relative z-10"
            >
              <defs>
                {/* Cyan Glow Filters for Water Path */}
                <filter id="waterGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00E5FF" floodOpacity="0.9" />
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.6" />
                </filter>

                <filter id="waterParticleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#E0F2FE" floodOpacity="1" />
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E5FF" floodOpacity="0.8" />
                </filter>

                {/* Linear Gradients for Highway */}
                <linearGradient id="waterFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                <linearGradient id="activeStreamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>

              {/* Invisible Full Reference Path for Continuous Cruise Sampling */}
              <path
                ref={pathRef}
                d={FULL_HIGHWAY_PATH}
                fill="none"
                stroke="transparent"
                strokeWidth="1"
              />

              {/* ============================================================
                  1. PERMANENT & ANIMATED GLOWING WATER-PATH HIGHWAY SEGMENTS
                  ============================================================ */}
              {[1, 2, 3].map((segId) => {
                const segInfo = STAGE_PATHS[segId];
                // Check if this segment is permanently completed
                const isSegCompleted = progress.completedStages.includes(segId);
                // Check if this segment is currently animating
                const isCurrentlyAnimating =
                  animatingSegment &&
                  animatingSegment.fromStage === segId &&
                  animatingSegment.phase === 'drawing_line';

                // Visible if completed or currently animating
                const isVisible = isSegCompleted || isCurrentlyAnimating;
                if (!isVisible) return null;

                const lineProgress = isCurrentlyAnimating ? animatingSegment.progress : 1.0;

                return (
                  <g key={`seg-${segId}`}>
                    {/* Layer 1: Dark Cyan Trench Foundation */}
                    <path
                      d={segInfo.d}
                      fill="none"
                      stroke="#082F49"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - lineProgress}
                      className="opacity-70"
                    />

                    {/* Layer 2: Glowing Cyan Water Bed */}
                    <path
                      d={segInfo.d}
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - lineProgress}
                      filter="url(#waterGlow)"
                    />

                    {/* Layer 3: Vibrant Bright Cyan Core */}
                    <path
                      d={segInfo.d}
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - lineProgress}
                    />

                    {/* Layer 4: Flowing Dotted Water Centerline */}
                    <path
                      d={segInfo.d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={isCurrentlyAnimating ? '6 6' : '8 8'}
                      strokeDashoffset={1 - lineProgress}
                      className={isSegCompleted ? 'animate-[dash_8s_linear_infinite]' : ''}
                    />
                  </g>
                );
              })}

              {/* ============================================================
                  2. TRAVELING PIXEL-ART WATER PARTICLES (Active during progression)
                  ============================================================ */}
              {animatingSegment && animatingSegment.phase === 'drawing_line' && (
                <g>
                  {travelParticles.map((p) => {
                    if (p.t <= 0 || p.t > 1) return null;
                    const segInfo = STAGE_PATHS[animatingSegment.fromStage];
                    if (!segInfo) return null;

                    // Compute cubic bezier coordinates for particle
                    const p0 = segInfo.fromCoord;
                    const p3 = segInfo.toCoord;
                    // Approximate control points matching d
                    let p1 = { x: 490, y: 220 }, p2 = { x: 400, y: 270 };
                    if (animatingSegment.fromStage === 2) {
                      p1 = { x: 420, y: 440 }; p2 = { x: 490, y: 560 };
                    } else if (animatingSegment.fromStage === 3) {
                      p1 = { x: 650, y: 600 }; p2 = { x: 780, y: 440 };
                    }

                    const t = p.t;
                    const cx = 3 * (p1.x - p0.x);
                    const bx = 3 * (p2.x - p1.x) - cx;
                    const ax = p3.x - p0.x - cx - bx;
                    const cy = 3 * (p1.y - p0.y);
                    const by = 3 * (p2.y - p1.y) - cy;
                    const ay = p3.y - p0.y - cy - by;
                    const px = (ax * Math.pow(t, 3)) + (bx * Math.pow(t, 2)) + (cx * t) + p0.x;
                    const py = (ay * Math.pow(t, 3)) + (by * Math.pow(t, 2)) + (cy * t) + p0.y + p.offset;

                    return (
                      <g key={`particle-${p.id}`} transform={`translate(${px}, ${py})`}>
                        {/* Outer Glow Square (Pixel Art) */}
                        <rect
                          x={-p.size / 2}
                          y={-p.size / 2}
                          width={p.size}
                          height={p.size}
                          fill="#00E5FF"
                          filter="url(#waterParticleGlow)"
                        />
                        {/* White Core Square */}
                        <rect
                          x={-p.size / 4}
                          y={-p.size / 4}
                          width={p.size / 2}
                          height={p.size / 2}
                          fill="#FFFFFF"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ============================================================
                  3. STAGE CHECKPOINT MARKERS (Kashmir, Rajasthan, Kerala, Meghalaya)
                  ============================================================ */}
              {ROAD_TRIP_STAGES.map((stg) => {
                const isUnlocked = progress.unlockedStages.includes(stg.id);
                const isCompleted = progress.completedStages.includes(stg.id);
                const isCurrent = progress.currentStage === stg.id;
                const isSelected = selectedStageId === stg.id;
                const coords = STAGE_COORDS[stg.id] || STAGE_COORDS[1];

                const isCelebrating = celebratingStageId === stg.id;

                return (
                  <g
                    key={`node-${stg.id}`}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => handleStageNodeClick(stg.id)}
                    className="cursor-pointer group select-none"
                  >
                    {/* Celebratory Ripple on Success / Unlock */}
                    {isCelebrating && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r="45"
                          fill="none"
                          stroke="#00E5FF"
                          strokeWidth="4"
                          className="animate-ping opacity-90"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="60"
                          fill="none"
                          stroke="#FACC15"
                          strokeWidth="2.5"
                          className="animate-ping opacity-60"
                        />
                      </g>
                    )}

                    {/* Active Pulsing Ring */}
                    {isCurrent && !isCelebrating && (
                      <circle
                        cx="0"
                        cy="0"
                        r="32"
                        fill="none"
                        stroke="#FACC15"
                        strokeWidth="3.5"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Outer Pin Halo */}
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill={
                        isCompleted
                          ? '#10B981'
                          : isCurrent
                          ? '#F59E0B'
                          : isUnlocked
                          ? '#00E5FF'
                          : '#475569'
                      }
                      stroke="#0F172A"
                      strokeWidth="3.5"
                      filter={isCompleted || isUnlocked ? 'url(#waterGlow)' : undefined}
                      className="group-hover:scale-120 transition-transform origin-center drop-shadow-lg"
                    />

                    {/* Inner Pin Body */}
                    <circle
                      cx="0"
                      cy="0"
                      r="15"
                      fill={
                        isCompleted
                          ? '#047857'
                          : isCurrent
                          ? '#D97706'
                          : isUnlocked
                          ? '#0284C7'
                          : '#334155'
                      }
                    />

                    {/* Center Icon: Checkmark, Number, or Lock */}
                    {isCompleted ? (
                      <text
                        x="0"
                        y="5"
                        fill="#FFFFFF"
                        fontSize="15"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        ✓
                      </text>
                    ) : isUnlocked ? (
                      <text
                        x="0"
                        y="5"
                        fill="#FFFFFF"
                        fontSize="13"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {stg.id}
                      </text>
                    ) : (
                      <text
                        x="0"
                        y="4"
                        fill="#CBD5E1"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        🔒
                      </text>
                    )}

                    {/* State Callout Pill Tag */}
                    <g transform="translate(0, 32)">
                      <rect
                        x="-65"
                        y="-10"
                        width="130"
                        height="22"
                        rx="11"
                        fill={isSelected ? '#FACC15' : '#0F172A'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="5"
                        fill={isSelected ? '#0F172A' : '#FFFFFF'}
                        fontSize="11"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        Stage {stg.id}: {stg.state.split(' ')[0]}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* ============================================================
                  4. REAL OGGY CHARACTER WALKING & PROGRESSING
                  ============================================================ */}
              <g
                transform={`translate(${oggyPos.x}, ${oggyPos.y})`}
                className="pointer-events-auto"
              >
                <foreignObject
                  x="-85"
                  y="-160"
                  width="170"
                  height="190"
                  className="overflow-visible"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <StandingOggyCharacter
                      isMoving={isCruising || (animatingSegment?.phase === 'drawing_line')}
                      angle={oggyPos.angle}
                      speechText={speechBubbleText}
                      showSpeech={showSpeechBubble}
                      scale={1.35}
                      onHonk={handleHonk}
                      vehicleMode={oggyMode}
                    />
                  </div>
                </foreignObject>
              </g>
            </svg>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM STAGE ACTION BAR */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Selected Stage Detail */}
        <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_#0F172A] flex-1 min-w-[280px]">
          <div className="text-2xl">{selectedStageData.interactiveMission?.badge || '💧'}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-600 dark:text-yellow-400">
                Stage {selectedStageData.id} • {selectedStageData.state}
              </span>
              <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.2 rounded-md">
                {selectedStageData.title}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
              {selectedStageData.interactiveMission?.description || selectedStageData.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Embark / Enter Mission Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.playClick();
              setActiveModalStage(selectedStageData);
            }}
            className="px-6 py-3 rounded-2xl border-3 border-slate-950 font-black text-sm sm:text-base flex items-center gap-2 shadow-[4px_4px_0px_#0F172A] cursor-pointer transition bg-yellow-400 hover:bg-yellow-300 text-slate-950 active:translate-y-0.5"
          >
            <span>🚀</span>
            <span>
              {progress.completedStages.includes(selectedStageData.id)
                ? `Replay Stage ${selectedStageData.id}`
                : `Embark: ${selectedStageData.state.split(' ')[0]}`}
            </span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </footer>

      {/* 4. REGIONAL HYDRO MISSION & PLAYABLE GAME MODALS */}
      {activeModalStage && activeModalStage.id === 1 ? (
        <KulsHimalayasGame
          isOpen={true}
          onClose={() => setActiveModalStage(null)}
          onCompleteStage={(earnedCoins, earnedStars) => {
            handleCompleteStage(1, earnedCoins, earnedStars);
          }}
          onNextStage={() => {
            const nextStage = ROAD_TRIP_STAGES.find((s) => s.id === 2);
            if (nextStage) {
              setSelectedStageId(2);
              setActiveModalStage(nextStage);
            }
          }}
        />
      ) : activeModalStage && activeModalStage.id === 2 ? (
        <StepwellChallengeGame
          isOpen={true}
          stageTitle="Rajasthan: Thar Baori Stepwell Challenge"
          stageRegion="Jodhpur & Thar Desert"
          onClose={() => setActiveModalStage(null)}
          onCompleteStage={(earnedCoins, earnedStars) => {
            handleCompleteStage(2, earnedCoins, earnedStars);
          }}
          onNextStage={() => {
            const nextStage = ROAD_TRIP_STAGES.find((s) => s.id === 3);
            if (nextStage) {
              setSelectedStageId(3);
              setActiveModalStage(nextStage);
            }
          }}
        />
      ) : activeModalStage && activeModalStage.id === 4 ? (
        <BambooForestGame
          isOpen={true}
          onClose={() => setActiveModalStage(null)}
          onCompleteStage={(earnedCoins, earnedStars) => {
            handleCompleteStage(4, earnedCoins, earnedStars);
          }}
        />
      ) : activeModalStage ? (
        <RoadTripMissionModal
          stage={activeModalStage}
          isOpen={true}
          onClose={() => setActiveModalStage(null)}
          onComplete={handleCompleteStage}
        />
      ) : null}
    </div>
  );
};

