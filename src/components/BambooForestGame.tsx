import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  X,
  Droplets,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { sound } from '../utils/audio';
import bambooBgImg from '../assets/images/meghalaya_bamboo_bg_1787338827944.jpg';
import oggyActualImg from '../assets/images/oggy_actual_fullbody_1787339345058.jpg';
import deedeeImg from '../assets/images/deedee_cockroach_1787328129156.jpg';
import joeyImg from '../assets/images/joey_cockroach_1787328146111.jpg';
import markyImg from '../assets/images/marky_cockroach_1787328164384.jpg';

interface BambooForestGameProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteStage: (earnedCoins: number, earnedStars: number) => void;
  onNextStage?: () => void;
}

// Bamboo Segment Definition with precise node geometry
export interface BambooPiece {
  id: string;
  name: string;
  tier: number; // 1 to 6 in flow sequence
  type: 'straight' | 'elbow' | 'diagonal';
  cx: number; // rotation center X
  cy: number; // rotation center Y
  currentRotation: number; // in degrees: 0, 90, 180, 270
  validRotations: number[]; // rotations that connect water flow
  isRotatable: boolean;
}

export const BambooForestGame: React.FC<BambooForestGameProps> = ({
  isOpen,
  onClose,
  onCompleteStage,
}) => {
  // Game Play States
  const [level] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [waterSaved, setWaterSaved] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [activeSpeechBubble, setActiveSpeechBubble] = useState<string | null>(null);

  // Cockroach swat state
  const [swattedRoaches, setSwattedRoaches] = useState<Record<string, boolean>>({});
  const [roachTaunts, setRoachTaunts] = useState<Record<string, string>>({
    joey: 'Hehe! No water reaches!',
    deedee: 'Stop right there!',
    marky: 'Not so easy!',
    bottomRoach: "We'll waste it all!",
  });

  // 6 rotatable bamboo pieces with aligned grid coordinates:
  // Node 0: Spout at (450, 120) -> (450, 200)
  // Seg 1 (elbow): at (450, 200), turns (450, 200) -> (470, 200)
  // Seg 2 (straight bridge): from (450, 200) to (660, 200), cx = 555, cy = 200
  // Seg 3 (diagonal chute): from (660, 200) to (760, 330), cx = 710, cy = 265
  // Seg 4 (middle return): from (760, 330) to (450, 330), cx = 605, cy = 330
  // Vertical Connector: from (450, 330) to (450, 480)
  // Seg 5 (lower elbow): at (450, 480), turns (450, 480) -> (470, 480)
  // Seg 6 (feeder): from (450, 480) to (640, 480), cx = 545, cy = 480 -> spills into Bucket at (640, 560)
  const [puzzlePieces, setPuzzlePieces] = useState<BambooPiece[]>([
    {
      id: 'seg_1_top_elbow',
      name: 'Top Right Elbow',
      tier: 1,
      type: 'elbow',
      cx: 450,
      cy: 200,
      currentRotation: 90, // starts misaligned
      validRotations: [0], // 0° connects top (0, -25) to right (25, 0)
      isRotatable: true,
    },
    {
      id: 'seg_2_top_bridge',
      name: 'Upper Horizontal Bridge',
      tier: 2,
      type: 'straight',
      cx: 555,
      cy: 200,
      currentRotation: 90, // starts vertical (wrong)
      validRotations: [0, 180], // horizontal connects (450, 200) to (660, 200)
      isRotatable: true,
    },
    {
      id: 'seg_3_diag_slope',
      name: 'Diagonal Cascade',
      tier: 3,
      type: 'diagonal',
      cx: 710,
      cy: 265,
      currentRotation: 90, // starts wrong
      validRotations: [0], // 0° connects (660, 200) down-right to (760, 330)
      isRotatable: true,
    },
    {
      id: 'seg_4_mid_channel',
      name: 'Middle Return Conduit',
      tier: 4,
      type: 'straight',
      cx: 605,
      cy: 330,
      currentRotation: 90, // starts vertical (wrong)
      validRotations: [0, 180], // horizontal connects (760, 330) to (450, 330)
      isRotatable: true,
    },
    {
      id: 'seg_5_lower_elbow',
      name: 'Lower Turn Elbow',
      tier: 5,
      type: 'elbow',
      cx: 450,
      cy: 480,
      currentRotation: 180, // starts wrong
      validRotations: [0], // 0° connects top (0, -25) to right (25, 0)
      isRotatable: true,
    },
    {
      id: 'seg_6_tank_feeder',
      name: 'Bucket Feeder Channel',
      tier: 6,
      type: 'straight',
      cx: 545,
      cy: 480,
      currentRotation: 90, // starts wrong
      validRotations: [0, 180], // horizontal connects (450, 480) to (640, 480)
      isRotatable: true,
    },
  ]);

  // Compute how far water flows through consecutive aligned segments
  const flowProgress = useMemo(() => {
    let maxConnectedTier = 0;
    for (let t = 1; t <= 6; t++) {
      const piece = puzzlePieces.find((p) => p.tier === t);
      if (piece) {
        const isValid = piece.validRotations.includes(piece.currentRotation % 360);
        if (isValid) {
          maxConnectedTier = t;
        } else {
          break; // flow stops at the first misaligned segment
        }
      }
    }
    return maxConnectedTier;
  }, [puzzlePieces]);

  // Full connection: water reaches the bucket
  const isFullFlowConnected = flowProgress === 6;

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || !isPlaying || isVictory || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          sound.playErrorBuzz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, isVictory, isGameOver]);

  // Dynamic Bucket Filling: Starts at 0, only fills when fully connected
  useEffect(() => {
    if (!isOpen || !isPlaying || isVictory || isGameOver) return;
    if (!isFullFlowConnected) return;

    const fillInterval = setInterval(() => {
      setWaterSaved((prev) => {
        const next = prev + 1;
        sound.playWaterDrop();

        if (next >= 20) {
          clearInterval(fillInterval);
          setIsVictory(true);
          sound.playVictoryFanfare();
          confetti({
            particleCount: 130,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#00E5FF', '#38BDF8', '#22C55E', '#FACC15', '#A855F7'],
          });
          return 20;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(fillInterval);
  }, [isOpen, isPlaying, isVictory, isGameOver, isFullFlowConnected]);

  // Rotate Segment Handler
  const handleRotatePiece = (id: string) => {
    if (!isPlaying || isVictory || isGameOver) return;

    sound.playBambooClick();
    setPuzzlePieces((prev) =>
      prev.map((piece) => {
        if (piece.id === id && piece.isRotatable) {
          const nextRotation = (piece.currentRotation + 90) % 360;
          return { ...piece, currentRotation: nextRotation };
        }
        return piece;
      })
    );
  };

  // Swat Cockroach
  const handleSwatRoach = (roachId: string) => {
    sound.playSwat();
    sound.playRoachGiggle();
    setSwattedRoaches((prev) => ({ ...prev, [roachId]: true }));
    setRoachTaunts((prev) => ({ ...prev, [roachId]: 'Ouch! My antennae!' }));

    // Bonus water drop
    setWaterSaved((w) => Math.min(20, w + 1));

    setTimeout(() => {
      setSwattedRoaches((prev) => ({ ...prev, [roachId]: false }));
      const recoveryTaunts: Record<string, string> = {
        joey: 'Hehe! No water reaches!',
        deedee: 'Stop right there!',
        marky: 'Not so easy!',
        bottomRoach: "We'll waste it all!",
      };
      setRoachTaunts((prev) => ({ ...prev, [roachId]: recoveryTaunts[roachId] || 'Hehe!' }));
    }, 3000);
  };

  // Restart
  const handleRestart = () => {
    sound.playClick();
    setTimeLeft(60);
    setWaterSaved(0);
    setIsVictory(false);
    setIsGameOver(false);
    setIsPlaying(true);
    setPuzzlePieces((prev) =>
      prev.map((piece) => ({
        ...piece,
        currentRotation: 90 * (1 + Math.floor(Math.random() * 3)),
      }))
    );
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleClaimVictory = () => {
    const stars = timeLeft > 30 ? 3 : timeLeft > 15 ? 2 : 1;
    const earnedCoins = 550 + stars * 50;
    onCompleteStage(earnedCoins, stars);
    onClose();
  };

  if (!isOpen) return null;

  const filledDropCount = Math.min(5, Math.floor(waterSaved / 4));
  const waterFillPercent = Math.min(100, (waterSaved / 20) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl h-[94vh] max-h-[860px] bg-amber-950 rounded-3xl border-4 border-[#2A1805] shadow-[0_16px_40px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col"
        >
          {/* =========================================================================
              BACKGROUND ARTWORK LAYER
              ========================================================================= */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={bambooBgImg}
              alt="Meghalaya Bamboo Forest"
              className="w-full h-full object-cover object-center filter brightness-95"
            />
            <div className="absolute inset-0 bg-emerald-950/15" />
          </div>

          {/* Monsoon Raindrops from top rain cloud */}
          <div className="absolute top-0 left-[34%] w-[330px] h-[260px] pointer-events-none z-10 overflow-hidden">
            <div className="w-full h-full relative">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`rain-${i}`}
                  style={{
                    left: `${10 + i * 5.8}%`,
                    animationDuration: `${0.55 + (i % 4) * 0.15}s`,
                    animationDelay: `${(i % 5) * 0.18}s`,
                  }}
                  className="absolute top-10 w-0.5 h-6 bg-gradient-to-b from-sky-200 to-sky-400 rounded-full opacity-70 animate-rain-fall"
                />
              ))}
            </div>
          </div>

          {/* =========================================================
              TOP LEFT: WOODEN LEVEL BANNER & SIDEBAR
              ========================================================= */}
          <div className="absolute top-3.5 left-3.5 z-30 flex flex-col gap-2 max-w-[270px] sm:max-w-[310px]">
            {/* Wood Carved Signboard */}
            <div className="relative bg-[#45270c] p-2.5 sm:p-3 rounded-2xl border-4 border-[#2A1805] shadow-[0_8px_0_#1B0E03,0_12px_20px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center">
              <div className="absolute -top-2.5 left-3 px-3 py-0.5 bg-[#8D5B2A] rounded-full border-2 border-[#2A1805] text-[10px] sm:text-xs font-black text-amber-100 uppercase tracking-widest shadow-sm">
                LEVEL 0{level}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase drop-shadow-[0_3px_0_#15803d] stroke-black mt-1">
                BAMBOO <span className="text-lime-300">FOREST</span>
              </h1>

              <div className="mt-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 px-3 py-0.5 rounded-full border-2 border-[#2A1805] shadow-sm">
                <span className="text-[11px] sm:text-xs font-black text-amber-950 uppercase tracking-wider">
                  RAIN WATER HERO
                </span>
              </div>
            </div>

            {/* Side Instruction Panels */}
            <div className="hidden lg:flex flex-col gap-2 max-h-[62vh] overflow-y-auto pr-1">
              {/* GOAL */}
              <div className="bg-[#FFF8E7]/95 p-3 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] text-slate-900">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black uppercase text-[#1B4D1B] tracking-wider bg-lime-200/80 px-2 py-0.5 rounded-md border border-lime-600/40">
                    GOAL
                  </span>
                  <span className="text-xs">💧</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 leading-snug">
                  Help Oggy collect rainwater by directing it through the bamboo channels into the empty bucket.
                </p>
                <p className="text-[11px] font-black text-sky-800 mt-1 flex items-center gap-1">
                  <span>Fill the bucket to 20/20!</span>
                  <span className="text-sky-500">💧</span>
                </p>
              </div>

              {/* HOW TO PLAY */}
              <div className="bg-[#FFF8E7]/95 p-3 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] text-slate-900">
                <span className="text-xs font-black uppercase text-[#1B4D1B] tracking-wider bg-lime-200/80 px-2 py-0.5 rounded-md border border-lime-600/40 block mb-1.5 w-fit">
                  HOW TO PLAY
                </span>
                <ul className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-800 leading-tight">
                  <li className="flex items-start gap-1.5">
                    <span className="text-sky-500 shrink-0 mt-0.5">💧</span>
                    <span>Tap white dotted rings to rotate bamboo joints into alignment.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-rose-500 shrink-0 mt-0.5">❌</span>
                    <span>Tap the cockroaches to swat them away for bonus water!</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-700 shrink-0 mt-0.5">🪣</span>
                    <span>Water fills the bucket only when all channels connect!</span>
                  </li>
                </ul>
              </div>

              {/* WATER SAVED COUNTER */}
              <div className="bg-[#2A1805] p-3 rounded-2xl border-3 border-[#45270c] shadow-[0_4px_0_#0F0A04] flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/30 border-2 border-sky-400 flex items-center justify-center text-sky-300">
                    <Droplets className="w-5 h-5 fill-sky-400 text-sky-200 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest block">
                      WATER COLLECTED
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      {waterSaved < 10 ? `0${waterSaved}` : waterSaved} <span className="text-sky-300">/ 20</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              TOP RIGHT: HUD CONTROLS & STATUS
              ========================================================= */}
          <div className="absolute top-3.5 right-3.5 z-30 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                title="Restart Level"
                className="w-11 h-11 bg-[#FFF8E7] hover:bg-amber-100 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex items-center justify-center text-slate-900 cursor-pointer active:translate-y-0.5 transition"
              >
                <RefreshCw className="w-5 h-5 text-slate-800" />
              </button>

              <button
                onClick={handleToggleSound}
                title="Toggle Sound"
                className="w-11 h-11 bg-[#FFF8E7] hover:bg-amber-100 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex items-center justify-center text-slate-900 cursor-pointer active:translate-y-0.5 transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-600" /> : <Volume2 className="w-5 h-5 text-slate-900" />}
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause Game' : 'Resume Game'}
                className="w-11 h-11 bg-[#FFF8E7] hover:bg-amber-100 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex items-center justify-center text-slate-900 cursor-pointer active:translate-y-0.5 transition"
              >
                {isPlaying ? <Pause className="w-5 h-5 text-slate-900" /> : <Play className="w-5 h-5 text-emerald-600" />}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                title="Exit Stage"
                className="w-11 h-11 bg-rose-500 hover:bg-rose-400 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex items-center justify-center text-white cursor-pointer active:translate-y-0.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TIME */}
            <div className="bg-[#FFF8E7] px-4 py-2 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex items-center gap-2.5 text-slate-900 min-w-[120px] justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className={`w-5 h-5 ${timeLeft <= 15 ? 'text-rose-600 animate-spin' : 'text-slate-800'}`} />
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  TIME
                </span>
              </div>
              <span className={`text-xl font-black font-mono ${timeLeft <= 15 ? 'text-rose-600 animate-pulse' : 'text-slate-950'}`}>
                {timeLeft}
              </span>
            </div>

            {/* PROGRESS */}
            <div className="bg-[#FFF8E7] px-3.5 py-2 rounded-2xl border-3 border-[#2A1805] shadow-[0_4px_0_#2A1805] flex flex-col items-center text-slate-900 min-w-[130px]">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider mb-1">
                PROGRESS
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const isFilled = idx < filledDropCount;
                  return (
                    <div
                      key={`prog-drop-${idx}`}
                      className={`w-4 h-6 rounded-full border-2 border-slate-900 transition-all duration-300 ${
                        isFilled
                          ? 'bg-gradient-to-b from-sky-300 to-sky-600 shadow-[0_0_8px_#38bdf8] scale-110'
                          : 'bg-white/60 opacity-60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================================
              CENTER SVG CANVAS: MATHEMATICALLY PERFECT BAMBOO NETWORK
              ========================================================================= */}
          <div className="relative flex-1 w-full h-full">
            <svg
              viewBox="0 0 1000 750"
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Bamboo Wood Gradients */}
                <linearGradient id="bambooCylinderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#84CC16" />
                  <stop offset="35%" stopColor="#65A30D" />
                  <stop offset="70%" stopColor="#4D7C0F" />
                  <stop offset="100%" stopColor="#365314" />
                </linearGradient>

                <linearGradient id="crystalWater" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                <linearGradient id="bucketWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="25%" stopColor="#92400E" />
                  <stop offset="50%" stopColor="#B45309" />
                  <stop offset="75%" stopColor="#92400E" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>

                <filter id="waterGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Bucket water clipping path */}
                <clipPath id="bucketInteriorClip">
                  <path d="M -60 0 L -50 70 C -50 82, 50 82, 50 70 L 60 0 Z" />
                </clipPath>
              </defs>

              {/* -------------------------------------------------------------
                  1. TOP MONSOON RAIN CLOUD
                  ------------------------------------------------------------- */}
              <g transform="translate(450, 60)" className="pointer-events-none">
                <path
                  d="M -130 40 C -150 40, -170 15, -145 -15 C -135 -45, -95 -50, -75 -35 C -55 -65, 5 -70, 35 -40 C 65 -60, 115 -40, 120 -5 C 145 5, 145 40, 115 45 Z"
                  fill="#334155"
                  stroke="#1E293B"
                  strokeWidth="4"
                  className="drop-shadow-lg"
                />
                <path
                  d="M -110 35 C -130 35, -145 15, -130 -5 C -120 -25, -90 -30, -70 -20 C -55 -45, -5 -50, 20 -25 C 45 -40, 85 -25, 90 0 C 110 10, 110 35, 85 40 Z"
                  fill="#475569"
                />
              </g>

              {/* -------------------------------------------------------------
                  2. ACTUAL OGGY CHARACTER & "START ➔" SIGN ON HILLTOP
                  ------------------------------------------------------------- */}
              <g transform="translate(320, 190)">
                {/* Wooden "START ➔" Signpost */}
                <g transform="translate(-75, -20)" className="cursor-pointer">
                  <rect x="-7" y="0" width="14" height="48" fill="#78350F" stroke="#2A1805" strokeWidth="2.5" />
                  <rect
                    x="-36"
                    y="-24"
                    width="72"
                    height="26"
                    rx="6"
                    fill="#8D5B2A"
                    stroke="#2A1805"
                    strokeWidth="3"
                    className="shadow-md"
                  />
                  <text
                    x="0"
                    y="-6"
                    fill="#FFF8E7"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    letterSpacing="1"
                  >
                    START ➔
                  </text>
                </g>

                {/* ACTUAL OGGY SPRITE */}
                <foreignObject
                  x="-65"
                  y="-125"
                  width="130"
                  height="140"
                  className="overflow-visible pointer-events-auto"
                >
                  <div
                    onClick={() => {
                      sound.playHonk();
                      setActiveSpeechBubble("Meow! Connect all bamboo joints to fill the bucket!");
                      setTimeout(() => setActiveSpeechBubble(null), 3500);
                    }}
                    className="w-full h-full flex flex-col items-center justify-end cursor-pointer group hover:scale-105 transition-transform select-none"
                  >
                    {activeSpeechBubble && (
                      <div className="absolute -top-14 bg-white text-slate-950 px-3 py-1.5 rounded-2xl border-3 border-slate-950 text-xs font-black shadow-[4px_4px_0px_#0F172A] animate-bounce z-50 whitespace-nowrap">
                        {activeSpeechBubble}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-3 border-b-3 border-slate-950 rotate-45" />
                      </div>
                    )}

                    {/* Authentic Oggy Avatar Badge */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-gradient-to-b from-sky-400 to-sky-700 shadow-[0_8px_16px_rgba(0,0,0,0.7)] overflow-hidden flex items-center justify-center p-0.5 ring-3 ring-slate-950">
                        <img
                          src={oggyActualImg}
                          alt="Actual Oggy the Cat"
                          className="w-full h-full object-cover object-top scale-120"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-950 border-2 border-slate-950 rounded-full px-2 py-0.5 text-[10px] font-black shadow-md flex items-center gap-0.5">
                        <span>👨‍🌾</span>
                        <span>OGGY</span>
                      </div>
                    </div>
                  </div>
                </foreignObject>
              </g>

              {/* -------------------------------------------------------------
                  3. TOP FIXED INTAKE SPOUT (Tier 0 from cloud)
                  ------------------------------------------------------------- */}
              <g transform="translate(450, 110)">
                {/* Stream coming down from cloud */}
                <path
                  d="M -12 0 L -8 60 L 8 60 L 12 0 Z"
                  fill="url(#crystalWater)"
                  opacity="0.9"
                  className="animate-pulse"
                />
                {/* Bamboo Mouth */}
                <ellipse cx="0" cy="5" rx="20" ry="8" fill="#1E293B" stroke="#2A1805" strokeWidth="3" />
                <ellipse cx="0" cy="5" rx="16" ry="6" fill="#38BDF8" />
                {/* Vertical Trunk */}
                <rect x="-18" y="5" width="36" height="75" fill="url(#bambooCylinderGrad)" stroke="#2A1805" strokeWidth="3" />
                {/* Joint bands */}
                <line x1="-20" y1="35" x2="20" y2="35" stroke="#365314" strokeWidth="4" />
                <line x1="-20" y1="65" x2="20" y2="65" stroke="#365314" strokeWidth="4" />
                {/* Flowing Water Inside Intake */}
                <rect x="-10" y="8" width="20" height="72" fill="#00E5FF" opacity="0.95" />
              </g>

              {/* -------------------------------------------------------------
                  4. THE 6 PUZZLE SEGMENTS & CONTINUOUS WATER PATHWAYS
                  ------------------------------------------------------------- */}

              {/* === SEGMENT 1 (Tier 1): TOP-RIGHT L-JOINT at (450, 200) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_1_top_elbow')!;
                const rot = piece.currentRotation % 360;
                return (
                  <g
                    transform={`translate(450, 200) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    {/* White Dotted Click Guide Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors animate-[spin_12s_linear_infinite]"
                    />
                    {/* Elbow Body: turns from top (0, -20) to right (25, 0) */}
                    <path
                      d="M -18 -20 L 18 -20 L 18 0 C 18 18, 18 18, 36 18 L 36 -18 L 18 -18 C -18 -18, -18 -10, -18 -20 Z"
                      fill="url(#bambooCylinderGrad)"
                      stroke="#2A1805"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="0" r="16" fill="#65A30D" stroke="#2A1805" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="9" fill="#1E293B" />

                    {/* Water flow through Elbow if aligned and Tier >= 1 */}
                    {flowProgress >= 1 && (
                      <path
                        d="M -10 -20 L 10 -20 L 10 0 C 10 10, 15 10, 36 10 L 36 -10 C 15 -10, 0 -10, -10 -20 Z"
                        fill="#00E5FF"
                        filter="url(#waterGlow)"
                      />
                    )}
                  </g>
                );
              })()}

              {/* === SEGMENT 2 (Tier 2): UPPER HORIZONTAL BRIDGE from (450,200) to (660,200) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_2_top_bridge')!;
                const rot = piece.currentRotation % 360;
                const isHorizontal = rot === 0 || rot === 180;
                return (
                  <g
                    transform={`translate(555, 200) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors animate-[spin_10s_linear_infinite]"
                    />
                    {/* Straight Conduit: width 190 (from -95 to +95) connects flush from x=460 to x=650 */}
                    <rect
                      x="-95"
                      y="-18"
                      width="190"
                      height="36"
                      rx="6"
                      fill="url(#bambooCylinderGrad)"
                      stroke="#2A1805"
                      strokeWidth="3"
                    />
                    <line x1="-40" y1="-20" x2="-40" y2="20" stroke="#365314" strokeWidth="4" />
                    <line x1="40" y1="-20" x2="40" y2="20" stroke="#365314" strokeWidth="4" />
                    <rect x="-90" y="-8" width="180" height="16" rx="4" fill="#1E293B" />

                    {/* Water flowing across bridge if Tier >= 2 */}
                    {flowProgress >= 2 && isHorizontal && (
                      <rect
                        x="-92"
                        y="-7"
                        width="184"
                        height="14"
                        rx="3"
                        fill="#00E5FF"
                        filter="url(#waterGlow)"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })()}

              {/* Fixed Upper-Right Turn Joint at (660, 200) connecting Bridge to Diagonal */}
              <g transform="translate(660, 200)">
                <circle cx="0" cy="0" r="19" fill="#65A30D" stroke="#2A1805" strokeWidth="3" />
                <circle cx="0" cy="0" r="11" fill="#1E293B" />
                {flowProgress >= 2 && <circle cx="0" cy="0" r="10" fill="#00E5FF" />}
              </g>

              {/* === SEGMENT 3 (Tier 3): DIAGONAL CHUTE from (660, 200) to (760, 330) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_3_diag_slope')!;
                const rot = piece.currentRotation % 360;
                return (
                  <g
                    transform={`translate(710, 265) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="34"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors"
                    />
                    {/* Slanted Conduit aligned from (660, 200) to (760, 330) (angle ~ 52.4°) */}
                    <g transform="rotate(52.4)">
                      <rect
                        x="-82"
                        y="-18"
                        width="164"
                        height="36"
                        rx="8"
                        fill="url(#bambooCylinderGrad)"
                        stroke="#2A1805"
                        strokeWidth="3"
                      />
                      <rect
                        x="-78"
                        y="-8"
                        width="156"
                        height="16"
                        rx="4"
                        fill="#1E293B"
                      />
                      {flowProgress >= 3 && rot === 0 && (
                        <rect
                          x="-80"
                          y="-7"
                          width="160"
                          height="14"
                          rx="3"
                          fill="#00E5FF"
                          filter="url(#waterGlow)"
                        />
                      )}
                    </g>
                  </g>
                );
              })()}

              {/* Fixed Right Turn Elbow Joint at (760, 330) connecting Diagonal to Middle Return */}
              <g transform="translate(760, 330)">
                <path
                  d="M -15 -25 L 18 -25 L 18 18 C 18 18, -18 18, -18 0 Z"
                  fill="url(#bambooCylinderGrad)"
                  stroke="#2A1805"
                  strokeWidth="3"
                />
                <circle cx="0" cy="0" r="19" fill="#65A30D" stroke="#2A1805" strokeWidth="3" />
                <circle cx="0" cy="0" r="10" fill="#1E293B" />
                {flowProgress >= 3 && <circle cx="0" cy="0" r="9" fill="#00E5FF" />}
              </g>

              {/* === SEGMENT 4 (Tier 4): MIDDLE RETURN CONDUIT from (760, 330) to (450, 330) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_4_mid_channel')!;
                const rot = piece.currentRotation % 360;
                const isHorizontal = rot === 0 || rot === 180;
                return (
                  <g
                    transform={`translate(605, 330) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors"
                    />
                    {/* Spans width 290 from x=460 to x=750 seamlessly */}
                    <rect
                      x="-145"
                      y="-18"
                      width="290"
                      height="36"
                      rx="6"
                      fill="url(#bambooCylinderGrad)"
                      stroke="#2A1805"
                      strokeWidth="3"
                    />
                    <line x1="-70" y1="-20" x2="-70" y2="20" stroke="#365314" strokeWidth="4" />
                    <line x1="70" y1="-20" x2="70" y2="20" stroke="#365314" strokeWidth="4" />
                    <rect x="-140" y="-8" width="280" height="16" rx="4" fill="#1E293B" />

                    {/* Flowing Water through middle conduit */}
                    {flowProgress >= 4 && isHorizontal && (
                      <rect
                        x="-142"
                        y="-7"
                        width="284"
                        height="14"
                        rx="3"
                        fill="#00E5FF"
                        filter="url(#waterGlow)"
                      />
                    )}
                  </g>
                );
              })()}

              {/* Fixed Left Vertical Drop Channel from (450, 330) down to (450, 480) */}
              <g transform="translate(450, 330)">
                <circle cx="0" cy="0" r="18" fill="#65A30D" stroke="#2A1805" strokeWidth="3" />
                <circle cx="0" cy="0" r="10" fill="#1E293B" />
                {/* Vertical Bamboo Pipe */}
                <rect x="-18" y="0" width="36" height="135" fill="url(#bambooCylinderGrad)" stroke="#2A1805" strokeWidth="3" />
                <line x1="-20" y1="45" x2="20" y2="45" stroke="#365314" strokeWidth="4" />
                <line x1="-20" y1="90" x2="20" y2="90" stroke="#365314" strokeWidth="4" />
                <rect x="-8" y="0" width="16" height="135" fill="#1E293B" />

                {flowProgress >= 4 && (
                  <rect x="-7" y="0" width="14" height="135" fill="#00E5FF" opacity="0.95" />
                )}
              </g>

              {/* === SEGMENT 5 (Tier 5): LOWER TURN ELBOW at (450, 480) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_5_lower_elbow')!;
                const rot = piece.currentRotation % 360;
                return (
                  <g
                    transform={`translate(450, 480) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors"
                    />
                    {/* L-Joint turning DOWN into RIGHT */}
                    <path
                      d="M -18 -20 L 18 -20 L 18 0 C 18 18, 18 18, 36 18 L 36 -18 L 18 -18 C -18 -18, -18 -10, -18 -20 Z"
                      fill="url(#bambooCylinderGrad)"
                      stroke="#2A1805"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="0" r="16" fill="#65A30D" stroke="#2A1805" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="9" fill="#1E293B" />

                    {flowProgress >= 5 && rot === 0 && (
                      <path
                        d="M -10 -20 L 10 -20 L 10 0 C 10 10, 15 10, 36 10 L 36 -10 C 15 -10, 0 -10, -10 -20 Z"
                        fill="#00E5FF"
                        filter="url(#waterGlow)"
                      />
                    )}
                  </g>
                );
              })()}

              {/* === SEGMENT 6 (Tier 6): BUCKET FEEDER CONDUIT from (450, 480) to (640, 480) === */}
              {(() => {
                const piece = puzzlePieces.find((p) => p.id === 'seg_6_tank_feeder')!;
                const rot = piece.currentRotation % 360;
                const isHorizontal = rot === 0 || rot === 180;
                return (
                  <g
                    transform={`translate(545, 480) rotate(${rot})`}
                    onClick={() => handleRotatePiece(piece.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="transparent"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      className="group-hover:stroke-yellow-300 transition-colors"
                    />
                    {/* Spans width 170 from x=460 to x=630 */}
                    <rect
                      x="-85"
                      y="-18"
                      width="170"
                      height="36"
                      rx="6"
                      fill="url(#bambooCylinderGrad)"
                      stroke="#2A1805"
                      strokeWidth="3"
                    />
                    <line x1="-35" y1="-20" x2="-35" y2="20" stroke="#365314" strokeWidth="4" />
                    <line x1="35" y1="-20" x2="35" y2="20" stroke="#365314" strokeWidth="4" />
                    <rect x="-80" y="-8" width="160" height="16" rx="4" fill="#1E293B" />

                    {/* Water flowing across Tier 6 into the Bucket */}
                    {flowProgress >= 6 && isHorizontal && (
                      <rect
                        x="-82"
                        y="-7"
                        width="164"
                        height="14"
                        rx="3"
                        fill="#00E5FF"
                        filter="url(#waterGlow)"
                      />
                    )}
                  </g>
                );
              })()}

              {/* -------------------------------------------------------------
                  5. OUTFLOW SPOUT & VILLAGE STORAGE BUCKET (GOAL)
                  ------------------------------------------------------------- */}

              {/* Downward Outflow Spout at (640, 480) */}
              <g transform="translate(635, 480)">
                <path
                  d="M 0 -18 L 30 -18 C 45 -18, 45 5, 45 30 L 20 30 C 20 15, 15 18, 0 18 Z"
                  fill="url(#bambooCylinderGrad)"
                  stroke="#2A1805"
                  strokeWidth="3"
                />
                {/* Waterfall stream into bucket when flow is fully connected! */}
                {isFullFlowConnected ? (
                  <g transform="translate(28, 28)">
                    <path
                      d="M -6 0 C 0 35, -4 65, 0 85 L 14 85 C 18 65, 14 35, 8 0 Z"
                      fill="url(#crystalWater)"
                      filter="url(#waterGlow)"
                      className="animate-pulse"
                    />
                    {/* Splash particles at water surface in bucket */}
                    <circle cx="5" cy="85" r="8" fill="#00E5FF" className="animate-ping" />
                    <circle cx="2" cy="82" r="4" fill="#FFFFFF" />
                  </g>
                ) : null}
              </g>

              {/* VILLAGE STORAGE BUCKET (STARTS EMPTY, FILLS AS WATER FLOWS) */}
              <g transform="translate(665, 595)">
                {/* Bucket Shadow */}
                <ellipse cx="0" cy="82" rx="55" ry="14" fill="#0F172A" opacity="0.5" />

                {/* Outer Wooden Bucket Barrel (Tapered) */}
                <path
                  d="M -58 0 L -46 76 C -46 86, 46 86, 46 76 L 58 0 Z"
                  fill="url(#bucketWoodGrad)"
                  stroke="#2A1805"
                  strokeWidth="4"
                />

                {/* Dark Empty Interior Cavity (Shown when empty / low water) */}
                <ellipse cx="0" cy="0" rx="58" ry="18" fill="#1C1917" stroke="#2A1805" strokeWidth="4" />
                <ellipse cx="0" cy="0" rx="52" ry="14" fill="#292524" />

                {/* Metal Stave Hoops */}
                <path
                  d="M -55 24 C -20 32, 20 32, 55 24"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="4.5"
                />
                <path
                  d="M -48 60 C -15 68, 15 68, 48 60"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="4"
                />

                {/* DYNAMIC WATER FILLING INSIDE BUCKET */}
                {waterSaved > 0 && (
                  <g clipPath="url(#bucketInteriorClip)">
                    {/* Rising Water Body */}
                    <rect
                      x="-60"
                      y={75 - (waterFillPercent / 100) * 75}
                      width="120"
                      height={(waterFillPercent / 100) * 75 + 10}
                      fill="url(#crystalWater)"
                      opacity="0.9"
                      filter="url(#waterGlow)"
                    />
                    {/* Water Surface Oval with Waves */}
                    <ellipse
                      cx="0"
                      cy={70 - (waterFillPercent / 100) * 70}
                      rx={44 + (waterFillPercent / 100) * 12}
                      ry={10 + (waterFillPercent / 100) * 6}
                      fill="#00E5FF"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  </g>
                )}

                {/* Top Rim of Bucket */}
                <ellipse cx="0" cy="0" rx="58" ry="18" fill="transparent" stroke="#2A1805" strokeWidth="4" />

                {/* Bucket Handle */}
                <path
                  d="M -58 -2 C -58 -45, 58 -45, 58 -2"
                  fill="none"
                  stroke="#451A03"
                  strokeWidth="4.5"
                />
                <circle cx="-58" cy="-2" r="4" fill="#FACC15" stroke="#2A1805" strokeWidth="2" />
                <circle cx="58" cy="-2" r="4" fill="#FACC15" stroke="#2A1805" strokeWidth="2" />

                {/* BUCKET FILL STATUS BADGE */}
                <g transform="translate(0, 105)">
                  <rect
                    x="-55"
                    y="-12"
                    width="110"
                    height="24"
                    rx="12"
                    fill={waterSaved >= 20 ? '#15803D' : waterSaved > 0 ? '#0284C7' : '#334155'}
                    stroke="#2A1805"
                    strokeWidth="2.5"
                    className="shadow-md"
                  />
                  <text
                    x="0"
                    y="4"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                    letterSpacing="0.5"
                  >
                    {waterSaved >= 20 ? 'FULL! 💧 20/20' : waterSaved > 0 ? `FILLING (${waterSaved}/20)` : 'EMPTY BUCKET 🪣'}
                  </text>
                </g>

                {/* Wooden "GOAL ➔" Signpost beside bucket */}
                <g transform="translate(95, 20)">
                  <rect x="-6" y="0" width="12" height="40" fill="#78350F" stroke="#2A1805" strokeWidth="2.5" />
                  <rect
                    x="-32"
                    y="-22"
                    width="64"
                    height="24"
                    rx="5"
                    fill="#8D5B2A"
                    stroke="#2A1805"
                    strokeWidth="3"
                  />
                  <text
                    x="0"
                    y="-5"
                    fill="#FFF8E7"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    letterSpacing="1"
                  >
                    GOAL ➔
                  </text>
                </g>
              </g>

              {/* -------------------------------------------------------------
                  6. COCKROACH OBSTACLES ON ROCK PERCHES WITH SPEECH BUBBLES
                  ------------------------------------------------------------- */}

              {/* ROACH 1: Joey (top-right perch at 780, 220) */}
              <g transform="translate(790, 220)" className="cursor-pointer">
                <g transform="translate(-25, -45)">
                  <rect
                    x="-65"
                    y="-15"
                    width="130"
                    height="30"
                    rx="15"
                    fill="#FFFFFF"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    className="drop-shadow-md"
                  />
                  <polygon points="0,15 -7,24 5,15" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="4"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {roachTaunts.joey}
                  </text>
                </g>
                <foreignObject
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  onClick={() => handleSwatRoach('joey')}
                >
                  <div
                    className={`w-full h-full flex items-center justify-center transition-transform select-none ${
                      swattedRoaches.joey ? 'animate-spin scale-75 opacity-50' : 'hover:scale-115'
                    }`}
                  >
                    <img
                      src={joeyImg}
                      alt="Joey Roach"
                      className="w-14 h-14 object-cover rounded-full border-3 border-slate-900 shadow-md ring-2 ring-purple-400"
                    />
                  </div>
                </foreignObject>
              </g>

              {/* ROACH 2: Dee Dee (mid-left cliff at 360, 420) */}
              <g transform="translate(360, 420)" className="cursor-pointer">
                <g transform="translate(-10, -45)">
                  <rect
                    x="-60"
                    y="-15"
                    width="120"
                    height="30"
                    rx="15"
                    fill="#FFFFFF"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    className="drop-shadow-md"
                  />
                  <polygon points="0,15 -6,24 6,15" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="4"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {roachTaunts.deedee}
                  </text>
                </g>
                <foreignObject
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  onClick={() => handleSwatRoach('deedee')}
                >
                  <div
                    className={`w-full h-full flex items-center justify-center transition-transform select-none ${
                      swattedRoaches.deedee ? 'animate-spin scale-75 opacity-50' : 'hover:scale-115'
                    }`}
                  >
                    <img
                      src={deedeeImg}
                      alt="Dee Dee Roach"
                      className="w-14 h-14 object-cover rounded-full border-3 border-slate-900 shadow-md ring-2 ring-amber-400"
                    />
                  </div>
                </foreignObject>
              </g>

              {/* ROACH 3: Marky (mid-right perch at 760, 490) */}
              <g transform="translate(760, 490)" className="cursor-pointer">
                <g transform="translate(25, -45)">
                  <rect
                    x="-55"
                    y="-15"
                    width="110"
                    height="30"
                    rx="15"
                    fill="#FFFFFF"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    className="drop-shadow-md"
                  />
                  <polygon points="0,15 -6,24 6,15" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="4"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {roachTaunts.marky}
                  </text>
                </g>
                <foreignObject
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  onClick={() => handleSwatRoach('marky')}
                >
                  <div
                    className={`w-full h-full flex items-center justify-center transition-transform select-none ${
                      swattedRoaches.marky ? 'animate-spin scale-75 opacity-50' : 'hover:scale-115'
                    }`}
                  >
                    <img
                      src={markyImg}
                      alt="Marky Roach"
                      className="w-14 h-14 object-cover rounded-full border-3 border-slate-900 shadow-md ring-2 ring-emerald-400"
                    />
                  </div>
                </foreignObject>
              </g>
            </svg>
          </div>

          {/* =========================================================================
              VICTORY CELEBRATION MODAL OVERLAY
              ========================================================================= */}
          {isVictory && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#FFF8E7] rounded-3xl border-4 border-slate-950 p-6 sm:p-8 max-w-md w-full text-center shadow-[0_16px_36px_rgba(0,0,0,0.9)] flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-4xl mb-3 shadow-lg">
                  🏆
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-wide">
                  MISSION ACCOMPLISHED!
                </h2>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  You filled the village bucket with crystal clean mountain rainwater!
                </p>

                {/* Stars */}
                <div className="flex items-center gap-2 my-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={`star-${i}`} className="text-3xl filter drop-shadow">
                      ⭐
                    </span>
                  ))}
                </div>

                {/* Score & Rewards Box */}
                <div className="w-full bg-[#2A1805] p-4 rounded-2xl border-3 border-[#45270c] text-white flex justify-around mb-5">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-amber-300 uppercase block">WATER COLLECTED</span>
                    <span className="text-xl font-black font-mono text-sky-300">20 / 20 🪣</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-amber-300 uppercase block">RECHARGE</span>
                    <span className="text-xl font-black font-mono text-emerald-400">+2.5m</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-amber-300 uppercase block">COINS</span>
                    <span className="text-xl font-black font-mono text-yellow-400">+700 🪙</span>
                  </div>
                </div>

                <button
                  onClick={handleClaimVictory}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-base uppercase rounded-2xl border-3 border-slate-950 shadow-[0_4px_0_#0F172A] cursor-pointer active:translate-y-1 transition"
                >
                  CLAIM REWARDS & ADVANCE
                </button>
              </motion.div>
            </div>
          )}

          {/* =========================================================================
              GAME OVER (TIME OUT) MODAL OVERLAY
              ========================================================================= */}
          {isGameOver && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#FFF8E7] rounded-3xl border-4 border-slate-950 p-6 sm:p-8 max-w-md w-full text-center shadow-[0_16px_36px_rgba(0,0,0,0.9)] flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-rose-500 border-4 border-slate-950 flex items-center justify-center text-4xl mb-3 shadow-lg">
                  ⏰
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-wide">
                  TIME'S UP!
                </h2>
                <p className="text-sm font-bold text-slate-700 mt-1 mb-5">
                  The roaches diverted the rainwater! Align the bamboo conduits before time runs out.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm uppercase rounded-2xl border-3 border-slate-950 shadow-[0_4px_0_#0F172A] cursor-pointer active:translate-y-1 transition"
                  >
                    TRY AGAIN 🔄
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-sm uppercase rounded-2xl border-3 border-slate-950 shadow-[0_4px_0_#0F172A] cursor-pointer active:translate-y-1 transition"
                  >
                    BACK TO MAP
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
