import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  X,
  Droplets,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { sound } from '../utils/audio';
import stage1BoardImg from '../assets/images/stage1_kuls_board_1787327570248.jpg';
import { OggySvgSprite, CockroachSvgSprite } from './CartoonSprites';

interface KulsHimalayasGameProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteStage: (earnedCoins: number, earnedStars: number) => void;
  onNextStage?: () => void;
}

// Map Coordinates & Junctions (SVG viewBox 0 0 1000 1300)
interface JunctionOption {
  direction: 'up' | 'down' | 'left' | 'right';
  targetNode: string;
  isCorrect: boolean;
  label: string;
  pathD: string;
  waterPoints: number;
}

interface MapNode {
  id: string;
  name: string;
  x: number; // Node coordinate in SVG
  y: number;
  options: JunctionOption[];
}

const MAP_NODES: Record<string, MapNode> = {
  start: {
    id: 'start',
    name: 'Mountain Waterfall (Start)',
    x: 430,
    y: 280,
    options: [
      {
        direction: 'down',
        targetNode: 'j1',
        isCorrect: true,
        label: 'Flow Down (Green Path)',
        pathD: 'M 430 280 C 470 310, 520 330, 580 340',
        waterPoints: 5,
      },
    ],
  },
  j1: {
    id: 'j1',
    name: 'Upper Channel Junction (Bridge 1)',
    x: 580,
    y: 340,
    options: [
      {
        direction: 'up',
        targetNode: 'roach1',
        isCorrect: false,
        label: 'Upper Hill Path (Dee Dee)',
        pathD: 'M 580 340 C 600 280, 680 200, 780 230 C 830 260, 840 340, 770 370',
        waterPoints: 0,
      },
      {
        direction: 'right',
        targetNode: 'roach1',
        isCorrect: false,
        label: 'Upper Hill Path (Dee Dee)',
        pathD: 'M 580 340 C 600 280, 680 200, 780 230 C 830 260, 840 340, 770 370',
        waterPoints: 0,
      },
      {
        direction: 'down',
        targetNode: 'j2',
        isCorrect: true,
        label: 'Cross Wooden Bridge (Green Path)',
        pathD: 'M 580 340 C 620 370, 640 430, 650 490',
        waterPoints: 10,
      },
    ],
  },
  j2: {
    id: 'j2',
    name: 'Middle Ravine Junction',
    x: 650,
    y: 490,
    options: [
      {
        direction: 'left',
        targetNode: 'roach2',
        isCorrect: false,
        label: 'Dry Ridge Path (Marky)',
        pathD: 'M 650 490 C 580 540, 480 560, 415 540',
        waterPoints: 0,
      },
      {
        direction: 'down',
        targetNode: 'j3',
        isCorrect: true,
        label: 'Lower Ravine Stream (Green Path)',
        pathD: 'M 650 490 C 680 560, 700 620, 690 680',
        waterPoints: 15,
      },
      {
        direction: 'right',
        targetNode: 'j3',
        isCorrect: true,
        label: 'Lower Ravine Stream (Green Path)',
        pathD: 'M 650 490 C 680 560, 700 620, 690 680',
        waterPoints: 15,
      },
    ],
  },
  j3: {
    id: 'j3',
    name: 'Lower Channel Junction (Bridge 2)',
    x: 690,
    y: 680,
    options: [
      {
        direction: 'right',
        targetNode: 'roach3',
        isCorrect: false,
        label: 'Rocky Plateau Path (Joey)',
        pathD: 'M 690 680 C 740 660, 790 640, 830 600',
        waterPoints: 0,
      },
      {
        direction: 'up',
        targetNode: 'roach3',
        isCorrect: false,
        label: 'Rocky Plateau Path (Joey)',
        pathD: 'M 690 680 C 740 660, 790 640, 830 600',
        waterPoints: 0,
      },
      {
        direction: 'down',
        targetNode: 'goal',
        isCorrect: true,
        label: 'Agricultural Field Canal (Green Path)',
        pathD: 'M 690 680 C 680 760, 700 840, 760 900 C 800 930, 840 920, 880 870',
        waterPoints: 20,
      },
      {
        direction: 'left',
        targetNode: 'goal',
        isCorrect: true,
        label: 'Agricultural Field Canal (Green Path)',
        pathD: 'M 690 680 C 680 760, 700 840, 760 900 C 800 930, 840 920, 880 870',
        waterPoints: 20,
      },
    ],
  },
  goal: {
    id: 'goal',
    name: 'Crop Fields (Goal)',
    x: 880,
    y: 870,
    options: [],
  },
};

export const KulsHimalayasGame: React.FC<KulsHimalayasGameProps> = ({
  isOpen,
  onClose,
  onCompleteStage,
  onNextStage,
}) => {
  // Game Logic States
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'success' | 'gameover'>('playing');
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [waterFlowCount, setWaterFlowCount] = useState<number>(0);
  const [waterWastedCount, setWaterWastedCount] = useState<number>(0);
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  
  // Visual Flow Segments
  const [flowingSegments, setFlowingSegments] = useState<string[]>([]);
  const [activeWrongPath, setActiveWrongPath] = useState<string | null>(null);
  
  // Cockroaches Reaction States
  const [activeRoachQuote, setActiveRoachQuote] = useState<{ id: string; text: string } | null>(null);
  
  // Audio Mute State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  
  // Dynamic Oggy Live Guidance Text
  const [oggyMessage, setOggyMessage] = useState<string>(
    'Press the Down Arrow ⬇️ or click the green button to start water flowing into the Kul canal!'
  );

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound Helper
  const playSfx = useCallback((type: 'click' | 'water' | 'success' | 'error' | 'victory' | 'warning') => {
    if (isSoundMuted) return;
    switch (type) {
      case 'click': sound.playClick(); break;
      case 'water': sound.playWaterFlow(); break;
      case 'success': sound.playSuccessChime(); break;
      case 'error': sound.playErrorBuzz(); break;
      case 'victory': sound.playVictoryFanfare(); break;
      case 'warning': sound.playVoicePop(); break;
    }
  }, [isSoundMuted]);

  // Restart / Reset Game
  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('playing');
    setTimeRemaining(60);
    setWaterFlowCount(0);
    setWaterWastedCount(0);
    setCurrentNodeId('start');
    setFlowingSegments([]);
    setActiveWrongPath(null);
    setActiveRoachQuote(null);
    setOggyMessage('Press the Down Arrow ⬇️ or click the green button to guide water into the Kul channels!');
    playSfx('water');
  }, [playSfx]);

  // On Open: Focus and Reset
  useEffect(() => {
    if (isOpen) {
      handleRestart();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, handleRestart]);

  // 60-Second Countdown Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('gameover');
            playSfx('error');
            setOggyMessage('Time is up! The crops need water. Press Retry to choose the route again!');
            return 0;
          }
          if (prev === 10) {
            playSfx('warning');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, playSfx]);

  // Calculate Water Efficiency
  const calculateEfficiency = useCallback(() => {
    const delivered = waterFlowCount || 20;
    const wasted = waterWastedCount;
    const total = delivered + wasted;
    return Math.max(20, Math.min(100, Math.round((delivered / (total || 1)) * 100)));
  }, [waterFlowCount, waterWastedCount]);

  // Complete Victory Handler
  const handleVictory = useCallback((finalDelivered: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('success');
    setWaterFlowCount(finalDelivered);
    setOggyMessage('🌾 Fantastic job! The Himalayan crops are flourishing and water was conserved!');
    playSfx('victory');

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00E5FF', '#22C55E', '#FACC15', '#38BDF8', '#FFFFFF'],
    });

    try {
      localStorage.setItem('stage1Completed', 'true');
      localStorage.setItem('waterWise_kuls_score', JSON.stringify({
        completed: true,
        efficiency: calculateEfficiency(),
        timeRemaining,
      }));
    } catch {
      // ignore
    }
  }, [calculateEfficiency, playSfx, timeRemaining]);

  // Execute a Path Choice
  const executePathChoice = useCallback((opt: JunctionOption) => {
    if (gameState !== 'playing') return;

    if (opt.isCorrect) {
      // SUCCESSFUL STEP
      playSfx('water');
      playSfx('success');
      setActiveWrongPath(null);
      setActiveRoachQuote(null);

      setFlowingSegments((prev) => [...prev, opt.pathD]);
      setWaterFlowCount(opt.waterPoints);

      if (opt.targetNode === 'j1') {
        setOggyMessage('💧 Good choice! Water is flowing down from the mountain source. Choose the next route!');
        setCurrentNodeId('j1');
      } else if (opt.targetNode === 'j2') {
        setOggyMessage('💧 Excellent! Water crossed the wooden bridge safely. Guide it past the ravine!');
        setCurrentNodeId('j2');
      } else if (opt.targetNode === 'j3') {
        setOggyMessage('💧 Perfect navigation! Water is rushing through the lower canal towards the farm!');
        setCurrentNodeId('j3');
      } else if (opt.targetNode === 'goal') {
        setOggyMessage('🌱 Reaching the crop fields! Irrigation complete!');
        setCurrentNodeId('goal');
        setTimeout(() => {
          handleVictory(20);
        }, 1000);
      }
    } else {
      // WRONG STEP / COCKROACH TRAP
      playSfx('error');
      setWaterWastedCount((prev) => prev + 3);
      setActiveWrongPath(opt.pathD);

      if (opt.targetNode === 'roach1') {
        setActiveRoachQuote({ id: 'deedee', text: 'Wrong way! Hehehe!' });
        setOggyMessage('⚠️ Wrong way! Cockroach Dee Dee blocked the hill path. Water was wasted! Try the green path.');
      } else if (opt.targetNode === 'roach2') {
        setActiveRoachQuote({ id: 'marky', text: 'Try another path! No water here!' });
        setOggyMessage('⚠️ Marky tricked us into a dry ridge! Direct the water down the main canal.');
      } else if (opt.targetNode === 'roach3') {
        setActiveRoachQuote({ id: 'joey', text: 'No water here! Fooled ya!' });
        setOggyMessage('⚠️ Joey diverted water to the rocky plateau! Send water down to the crops.');
      }

      // Revert wrong animation after brief delay
      setTimeout(() => {
        setActiveWrongPath(null);
      }, 1500);
    }
  }, [gameState, handleVictory, playSfx]);

  // Keyboard Navigation Handler (WASD / Arrows / Enter / Space)
  const handleDirectionAction = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const curr = MAP_NODES[currentNodeId];
    if (!curr || !curr.options || curr.options.length === 0) return;

    // Find option matching direction
    const matchedOpt = curr.options.find((o) => o.direction === dir);
    if (matchedOpt) {
      executePathChoice(matchedOpt);
    } else {
      // If pressing down / enter, pick the correct forward option
      const correctOpt = curr.options.find((o) => o.isCorrect) || curr.options[0];
      if (correctOpt) executePathChoice(correctOpt);
    }
  }, [currentNodeId, executePathChoice]);

  // Global Window Keyboard Listener for Instant Arrow Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || gameState !== 'playing') return;

      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'enter'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (key === 'arrowup' || key === 'w') {
        handleDirectionAction('up');
      } else if (key === 'arrowdown' || key === 's') {
        handleDirectionAction('down');
      } else if (key === 'arrowleft' || key === 'a') {
        handleDirectionAction('left');
      } else if (key === 'arrowright' || key === 'd') {
        handleDirectionAction('right');
      } else if (key === 'enter' || key === ' ') {
        const curr = MAP_NODES[currentNodeId];
        if (curr && curr.options && curr.options.length > 0) {
          const correctOpt = curr.options.find((o) => o.isCorrect) || curr.options[0];
          executePathChoice(correctOpt);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [isOpen, gameState, currentNodeId, handleDirectionAction, executePathChoice]);

  if (!isOpen) return null;

  const currentNode = MAP_NODES[currentNodeId];
  const efficiency = calculateEfficiency();

  return (
    <div
      tabIndex={0}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto outline-none"
    >
      {/* Exact Replica Container of Reference Image */}
      <div className="relative w-full max-w-5xl bg-[#EEDCB5] rounded-3xl border-4 sm:border-6 border-[#5D3A1A] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto text-[#422B14]">
        
        {/* Main 2-Column Game Canvas Layout */}
        <div className="w-full flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* ================= LEFT SIDEBAR (Legend, Goal, Controls) ================= */}
          <div className="w-full lg:w-[310px] bg-[#EEDCB5] p-3 sm:p-4 border-b-4 lg:border-b-0 lg:border-r-4 border-[#5D3A1A] flex flex-col gap-2.5 z-20">
            
            {/* Wooden Title Header */}
            <div className="bg-gradient-to-r from-[#5B391B] via-[#7B4E26] to-[#5B391B] p-2.5 rounded-2xl border-3 border-[#3D2511] shadow-[3px_3px_0px_#000] text-center">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-widest block">
                LEVEL 01
              </span>
              <h2 className="text-sm sm:text-base font-black text-amber-100 uppercase tracking-tight drop-shadow-sm leading-tight">
                KULS OF THE HIMALAYAS
              </h2>
            </div>

            {/* GOAL CARD */}
            <div className="bg-[#FAF3E0] p-2.5 rounded-xl border-2 border-[#8B5A2B] shadow-xs">
              <span className="font-black text-xs text-[#7B4E26] uppercase tracking-wide flex items-center gap-1">
                🎯 GOAL
              </span>
              <p className="text-[11px] font-bold leading-snug mt-1 text-[#4A321E]">
                Help Oggy guide the water safely from the mountains to the agriculture field with minimum wastage!
              </p>
            </div>

            {/* HOW TO PLAY CARD */}
            <div className="bg-[#FAF3E0] p-2.5 rounded-xl border-2 border-[#8B5A2B] shadow-xs">
              <span className="font-black text-xs text-[#7B4E26] uppercase tracking-wide block">
                📖 HOW TO PLAY
              </span>
              <div className="text-[10.5px] font-bold space-y-1 mt-1 text-[#4A321E]">
                <div className="flex items-start gap-1.5">
                  <span className="text-sky-600">💧</span>
                  <span>Choose the right path to let the water flow.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-rose-600">❌</span>
                  <span>Avoid wrong paths where cockroaches are hiding.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-700">🌾</span>
                  <span>Reach the agriculture field at the end.</span>
                </div>
              </div>
            </div>

            {/* LEGEND CARD */}
            <div className="bg-[#FAF3E0] p-2.5 rounded-xl border-2 border-[#8B5A2B] shadow-xs">
              <span className="font-black text-xs text-[#7B4E26] uppercase tracking-wide block">
                🗺️ LEGEND
              </span>
              <div className="text-[10px] font-bold space-y-1 mt-1 text-[#4A321E]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-1.5 bg-emerald-500 rounded-sm border border-emerald-700" />
                  <span>--&gt; Correct Path (Water Flow)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-1.5 bg-rose-500 rounded-sm border border-rose-700" />
                  <span>--- Wrong Path</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🪳</span>
                  <span>Cockroach (Obstacle)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>💧</span>
                  <span>Water Source</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🌾</span>
                  <span>Agriculture Field (Goal)</span>
                </div>
              </div>
            </div>

            {/* CONTROLS CARD & INTERACTIVE ARROW KEYS */}
            <div className="bg-[#FAF3E0] p-2.5 rounded-xl border-2 border-[#8B5A2B] shadow-xs">
              <span className="font-black text-xs text-[#7B4E26] uppercase tracking-wide block mb-1">
                🎮 CONTROLS (ARROWS / CLICK)
              </span>
              
              {/* Interactive Visual Keypad (Clickable on Desktop & Mobile) */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="text-[10px] font-bold text-[#4A321E] leading-tight">
                  <div>Press <span className="text-emerald-700 font-black">⬇️ Down</span></div>
                  <div>or click buttons</div>
                </div>

                {/* D-Pad Buttons */}
                <div className="flex flex-col items-center gap-1 bg-[#E8D4B0] p-1.5 rounded-xl border border-[#B89B6C]">
                  <button
                    type="button"
                    onClick={() => handleDirectionAction('up')}
                    className="w-8 h-8 bg-[#FFF8E7] hover:bg-yellow-300 active:bg-yellow-400 text-slate-900 rounded-lg border-2 border-[#78350F] flex items-center justify-center font-black text-xs shadow-xs active:scale-90 transition cursor-pointer"
                    title="Move Up"
                  >
                    ⬆️
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDirectionAction('left')}
                      className="w-8 h-8 bg-[#FFF8E7] hover:bg-yellow-300 active:bg-yellow-400 text-slate-900 rounded-lg border-2 border-[#78350F] flex items-center justify-center font-black text-xs shadow-xs active:scale-90 transition cursor-pointer"
                      title="Move Left"
                    >
                      ⬅️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectionAction('down')}
                      className="w-8 h-8 bg-[#10B981] hover:bg-emerald-400 active:bg-emerald-600 text-white rounded-lg border-2 border-[#064E3B] flex items-center justify-center font-black text-xs shadow-xs active:scale-90 transition cursor-pointer ring-2 ring-yellow-400 animate-pulse"
                      title="Move Down (Flow Water)"
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectionAction('right')}
                      className="w-8 h-8 bg-[#FFF8E7] hover:bg-yellow-300 active:bg-yellow-400 text-slate-900 rounded-lg border-2 border-[#78350F] flex items-center justify-center font-black text-xs shadow-xs active:scale-90 transition cursor-pointer"
                      title="Move Right"
                    >
                      ➡️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTE CARD */}
            <div className="bg-[#FFFBEB] p-2 rounded-xl border-2 border-[#D97706] text-[#92400E] shadow-xs">
              <span className="font-black text-[10px] uppercase">💡 NOTE:</span>
              <p className="text-[10px] font-bold leading-tight mt-0.5">
                Use arrow keys or tap on the path to choose the way. Water will flow only on the correct path!
              </p>
            </div>
          </div>

          {/* ================= RIGHT GAME BOARD MAP ================= */}
          <div className="flex-1 relative bg-[#2A4D1A] min-h-[540px] sm:min-h-[640px] flex items-center justify-center overflow-hidden">
            
            {/* Top-Right In-Game HUD Badges */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              {/* Sound Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSoundMuted(!isSoundMuted);
                  sound.playClick();
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_#000] flex items-center justify-center cursor-pointer active:scale-95 transition"
                title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Pause Button */}
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setGameState(gameState === 'playing' ? 'paused' : 'playing');
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_#000] flex items-center justify-center cursor-pointer active:scale-95 transition"
                title="Pause Game"
              >
                {gameState === 'paused' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Water Flow Badge */}
              <div className="bg-[#1B365D] border-2 border-[#38BDF8] px-3 py-1 rounded-2xl shadow-[3px_3px_0px_#000] flex items-center gap-2">
                <Droplets className="w-5 h-5 text-[#38BDF8] fill-[#00E5FF] animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-sky-200 uppercase leading-none tracking-tight">
                    WATER FLOW
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white leading-none mt-0.5">
                    {String(waterFlowCount).padStart(2, '0')} / 20
                  </span>
                </div>
              </div>

              {/* Timer Badge */}
              <div className="bg-[#1B365D] border-2 border-[#38BDF8] px-3 py-1 rounded-2xl shadow-[3px_3px_0px_#000] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-300" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-sky-200 uppercase leading-none tracking-tight">
                    TIME
                  </span>
                  <span className={`text-xs sm:text-sm font-black leading-none mt-0.5 ${timeRemaining <= 10 ? 'text-yellow-300 animate-ping' : 'text-white'}`}>
                    {String(timeRemaining).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 bg-rose-600 hover:bg-rose-500 text-white rounded-full border-2 border-slate-950 flex items-center justify-center cursor-pointer active:scale-95 shadow-[2px_2px_0px_#000]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map Game Canvas Container (Aspect Ratio Matching Background) */}
            <div className="relative w-full h-full aspect-[1000/1300] max-h-[85vh] flex items-center justify-center">
              
              {/* Layer 1: Background Visual Landscape Board */}
              <img
                src={stage1BoardImg}
                alt="Stage 1 Game Map"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Layer 2: Interactive SVG Game Conduits, Streams, Channels & Characters */}
              <svg
                viewBox="0 0 1000 1300"
                className="absolute inset-0 w-full h-full select-none overflow-visible z-10"
              >
                <defs>
                  {/* Glowing Blue Water Pipeline Filter */}
                  <filter id="himalayanWaterGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00E5FF" floodOpacity="1" />
                    <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#0284C7" floodOpacity="0.9" />
                  </filter>
                  <filter id="wrongPathGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#EF4444" floodOpacity="1" />
                  </filter>
                  {/* High Contrast HD Oggy Sprite Filter to Prevent Background Interference on Full-Screen Displays */}
                  <filter id="oggyKulsGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.95" />
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.8" />
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.9" />
                  </filter>
                </defs>

                {/* --- GREEN DASHED CORRECT ROUTE PATHS (Visual Guidance) --- */}
                {/* 1. Water Source -> Junction 1 */}
                <path
                  d="M 430 280 C 470 310, 520 330, 580 340"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="14 12"
                  strokeLinecap="round"
                  className="opacity-90"
                />

                {/* 2. Junction 1 -> Bridge 1 -> Junction 2 */}
                <path
                  d="M 580 340 C 620 370, 640 430, 650 490"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="14 12"
                  strokeLinecap="round"
                  className="opacity-90"
                />

                {/* 3. Junction 2 -> Bridge 2 -> Junction 3 */}
                <path
                  d="M 650 490 C 680 560, 700 620, 690 680"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="14 12"
                  strokeLinecap="round"
                  className="opacity-90"
                />

                {/* 4. Junction 3 -> Agriculture Field Goal */}
                <path
                  d="M 690 680 C 680 760, 700 840, 760 900 C 800 930, 840 920, 880 870"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="14 12"
                  strokeLinecap="round"
                  className="opacity-90"
                />

                {/* --- RED DASHED WRONG PATHS (Obstacles) --- */}
                {/* Wrong 1: Junction 1 -> Roach 1 (Dee Dee) */}
                <path
                  d="M 580 340 C 600 280, 680 200, 780 230 C 830 260, 840 340, 770 370"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="7"
                  strokeDasharray="12 10"
                  strokeLinecap="round"
                  className="opacity-85"
                />

                {/* Wrong 2: Junction 2 -> Roach 2 (Marky) */}
                <path
                  d="M 650 490 C 580 540, 480 560, 415 540"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="7"
                  strokeDasharray="12 10"
                  strokeLinecap="round"
                  className="opacity-85"
                />

                {/* Wrong 3: Junction 3 -> Roach 3 (Joey) */}
                <path
                  d="M 690 680 C 740 660, 790 640, 830 600"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="7"
                  strokeDasharray="12 10"
                  strokeLinecap="round"
                  className="opacity-85"
                />

                {/* --- ACTIVE ANIMATED BLUE FLOWING WATER CANALS --- */}
                {flowingSegments.map((dStr, idx) => (
                  <g key={`flowing-${idx}`}>
                    {/* Outer Glowing Cyan Tube */}
                    <path
                      d={dStr}
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#himalayanWaterGlow)"
                      className="opacity-95"
                    />
                    {/* Inner White Flowing Dashes */}
                    <path
                      d={dStr}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      strokeDasharray="16 16"
                      strokeLinecap="round"
                      className="animate-[dash_3s_linear_infinite]"
                    />
                  </g>
                ))}

                {/* Wrong Path Flash Red Animation */}
                {activeWrongPath && (
                  <path
                    d={activeWrongPath}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#wrongPathGlow)"
                    className="animate-pulse"
                  />
                )}

                {/* --- START SIGNBOARD --- */}
                <g transform="translate(460, 200)">
                  <rect
                    x="-48"
                    y="-18"
                    width="96"
                    height="36"
                    rx="8"
                    fill="#78350F"
                    stroke="#FDE68A"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                  <text
                    x="0"
                    y="6"
                    fill="#FFFFFF"
                    fontSize="16"
                    fontWeight="900"
                    textAnchor="middle"
                    className="tracking-wider font-sans"
                  >
                    START
                  </text>
                </g>

                {/* --- PROMINENT OGGY THE BLUE CAT (Standing on Mountain Cliff near Start - High-Res Vector Sprite) --- */}
                <g transform="translate(310, 100)">
                  {/* Drop Shadow */}
                  <ellipse cx="60" cy="140" rx="44" ry="12" fill="rgba(0,0,0,0.5)" />
                  
                  {/* Ultra High-Resolution Oggy Vector Character */}
                  <foreignObject x="0" y="0" width="125" height="140" className="overflow-visible select-none pointer-events-none">
                    <OggySvgSprite
                      facing="right"
                      hasBucket={true}
                      hasWater={true}
                      size={120}
                    />
                  </foreignObject>

                  {/* Oggy Name Tag Badge */}
                  <g transform="translate(60, 144)">
                    <rect x="-42" y="-12" width="84" height="24" rx="8" fill="#1E3A8A" stroke="#FDE68A" strokeWidth="2" className="drop-shadow-lg" />
                    <text x="0" y="4" fill="#FFFFFF" fontSize="12" fontWeight="900" textAnchor="middle" className="font-mono tracking-wider">OGGY</text>
                  </g>
                </g>

                {/* --- PROMINENT COCKROACHES AT THE 3 DEAD-ENDS (Vector Transparent Characters) --- */}
                
                {/* Cockroach 1: Dee Dee (Top Right Hill Loop) */}
                <g transform="translate(740, 310)">
                  <ellipse cx="40" cy="85" rx="30" ry="10" fill="rgba(0,0,0,0.4)" />
                  <foreignObject x="0" y="0" width="80" height="90" className="overflow-visible">
                    <CockroachSvgSprite variant="deedee" size={76} />
                  </foreignObject>
                  {/* Speech Bubble */}
                  <g transform="translate(40, -15)">
                    <rect x="-52" y="-12" width="104" height="24" rx="8" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" className="drop-shadow-md" />
                    <text x="0" y="4" fill="#991B1B" fontSize="11" fontWeight="900" textAnchor="middle">
                      Wrong way!
                    </text>
                  </g>
                </g>

                {/* Cockroach 2: Marky (Middle Left Ridge) */}
                <g transform="translate(370, 480)">
                  <ellipse cx="40" cy="85" rx="30" ry="10" fill="rgba(0,0,0,0.4)" />
                  <foreignObject x="0" y="0" width="80" height="90" className="overflow-visible">
                    <CockroachSvgSprite variant="marky" size={76} />
                  </foreignObject>
                  {/* Speech Bubble */}
                  <g transform="translate(40, -15)">
                    <rect x="-60" y="-12" width="120" height="24" rx="8" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" className="drop-shadow-md" />
                    <text x="0" y="4" fill="#991B1B" fontSize="10.5" fontWeight="900" textAnchor="middle">
                      Try another path!
                    </text>
                  </g>
                </g>

                {/* Cockroach 3: Joey (Bottom Right Ridge) */}
                <g transform="translate(790, 540)">
                  <ellipse cx="40" cy="85" rx="30" ry="10" fill="rgba(0,0,0,0.4)" />
                  <foreignObject x="0" y="0" width="80" height="90" className="overflow-visible">
                    <CockroachSvgSprite variant="joey" size={76} />
                  </foreignObject>
                  {/* Speech Bubble */}
                  <g transform="translate(40, -15)">
                    <rect x="-54" y="-12" width="108" height="24" rx="8" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" className="drop-shadow-md" />
                    <text x="0" y="4" fill="#991B1B" fontSize="11" fontWeight="900" textAnchor="middle">
                      No water here!
                    </text>
                  </g>
                </g>

                {/* --- GOAL SIGNBOARD & CROPS --- */}
                <g transform="translate(870, 760)">
                  <rect
                    x="-48"
                    y="-18"
                    width="96"
                    height="36"
                    rx="8"
                    fill="#78350F"
                    stroke="#FDE68A"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                  <text
                    x="0"
                    y="6"
                    fill="#FFFFFF"
                    fontSize="16"
                    fontWeight="900"
                    textAnchor="middle"
                    className="tracking-wider font-sans"
                  >
                    GOAL
                  </text>
                </g>

                {/* --- ACTIVE JUNCTION TARGET INDICATOR & CLICKABLE INTERACTIVE CHOICES --- */}
                {gameState === 'playing' && currentNode && currentNode.options.length > 0 && (
                  <g>
                    {/* Glowing Pulse Ring at Active Junction */}
                    <circle
                      cx={currentNode.x}
                      cy={currentNode.y}
                      r="36"
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="6"
                      className="animate-ping opacity-90"
                    />
                    {/* Live Guide Oggy at Current Junction with Bucket */}
                    <g transform={`translate(${currentNode.x - 26}, ${currentNode.y - 70})`} className="pointer-events-none">
                      <ellipse cx="26" cy="62" rx="20" ry="7" fill="rgba(0,0,0,0.5)" />
                      <foreignObject x="0" y="0" width="56" height="66" className="overflow-visible">
                        <OggySvgSprite facing="right" hasBucket={true} hasWater={true} size={54} />
                      </foreignObject>
                    </g>

                    <circle
                      cx={currentNode.x}
                      cy={currentNode.y}
                      r="18"
                      fill="#FACC15"
                      stroke="#0F172A"
                      strokeWidth="3"
                      className="drop-shadow-md"
                    />
                    <text
                      x={currentNode.x}
                      y={currentNode.y + 6}
                      fill="#0F172A"
                      fontSize="16"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      💧
                    </text>

                    {/* Highly Visible, Clickable Tap Buttons on Map */}
                    {currentNode.options.map((opt, oIdx) => {
                      let offsetX = 0;
                      let offsetY = 55;
                      if (opt.direction === 'up') { offsetX = 40; offsetY = -50; }
                      else if (opt.direction === 'left') { offsetX = -80; offsetY = 15; }
                      else if (opt.direction === 'right') { offsetX = 80; offsetY = 15; }
                      else if (opt.direction === 'down') { offsetX = 0; offsetY = 65; }

                      const btnX = currentNode.x + offsetX;
                      const btnY = currentNode.y + offsetY;

                      return (
                        <g
                          key={`btn-opt-${oIdx}`}
                          transform={`translate(${btnX}, ${btnY})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            executePathChoice(opt);
                          }}
                          className="cursor-pointer select-none group"
                        >
                          <rect
                            x="-70"
                            y="-22"
                            width="140"
                            height="44"
                            rx="14"
                            fill={opt.isCorrect ? '#10B981' : '#EF4444'}
                            stroke="#FFFFFF"
                            strokeWidth="3"
                            className="filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform origin-center"
                          />
                          <text
                            x="0"
                            y="6"
                            fill="#FFFFFF"
                            fontSize="12"
                            fontWeight="900"
                            textAnchor="middle"
                            className="font-sans drop-shadow-sm"
                          >
                            {opt.direction === 'down' ? '⬇️ Flow Down' : opt.direction === 'up' ? '⬆️ Upper Loop' : opt.direction === 'left' ? '⬅️ Ridge Path' : '➡️ Right Path'}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>

              {/* Pause Overlay */}
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-40">
                  <div className="bg-[#FAF3E0] text-[#422B14] p-6 rounded-3xl border-4 border-[#78350F] shadow-2xl max-w-sm flex flex-col items-center">
                    <h3 className="text-2xl font-black text-[#78350F] uppercase tracking-wide mb-4">
                      GAME PAUSED
                    </h3>
                    <div className="flex flex-col gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={() => { playSfx('click'); setGameState('playing'); }}
                        className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm rounded-xl border-2 border-[#064E3B] shadow-sm cursor-pointer"
                      >
                        Resume Flow
                      </button>
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#451A03] font-black text-sm rounded-xl border-2 border-[#78350F] shadow-sm cursor-pointer"
                      >
                        Restart Level
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-sm rounded-xl border-2 border-[#7F1D1D] shadow-sm cursor-pointer"
                      >
                        Exit Stage
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Out / Game Over Modal */}
              {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-40">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#FEF2F2] text-[#991B1B] p-6 rounded-3xl border-4 border-[#DC2626] shadow-2xl max-w-md flex flex-col items-center"
                  >
                    <div className="text-4xl mb-2">⏱️🥀</div>
                    <h3 className="text-2xl font-black text-[#991B1B] uppercase tracking-wide">
                      Time’s Up!
                    </h3>
                    <p className="text-xs font-bold text-[#7F1D1D] mt-2 mb-4 leading-relaxed">
                      The crops did not receive enough water. Try again and choose the route more carefully using your arrow keys or path taps!
                    </p>
                    <div className="flex items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#451A03] font-black text-sm rounded-xl border-2 border-[#78350F] shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retry Stage</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#475569] hover:bg-[#334155] text-white font-black text-sm rounded-xl border-2 border-[#0F172A] shadow-sm cursor-pointer"
                      >
                        Back to Map
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Victory Stage Complete Modal */}
              {gameState === 'success' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-40">
                  <motion.div
                    initial={{ scale: 0.8, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 24 }}
                    className="bg-[#FAF3E0] text-[#422B14] p-6 rounded-3xl border-4 border-[#78350F] shadow-2xl max-w-md flex flex-col items-center relative"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-100 border-3 border-emerald-600 flex items-center justify-center text-4xl mb-2 shadow-inner">
                      🌾
                    </div>

                    <span className="bg-[#15803D] text-white font-black text-xs uppercase px-3 py-0.5 rounded-full border border-emerald-700 shadow-xs mb-1">
                      Stage Complete!
                    </span>

                    <h3 className="text-2xl font-black text-[#78350F] uppercase tracking-wide">
                      Himalayan Crops Watered!
                    </h3>

                    <p className="text-xs font-bold text-[#57391F] mt-1 mb-3">
                      You guided the water safely with minimum wastage!
                    </p>

                    {/* Stats Score Box */}
                    <div className="w-full bg-[#EBD9B2] p-3 rounded-2xl border-2 border-[#8B5A2B] flex flex-col gap-1.5 text-xs font-black text-[#422B14] mb-4">
                      <div className="flex justify-between">
                        <span>💧 Water Delivered:</span>
                        <span className="text-sky-700">20 / 20 Drops</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⏱️ Time Remaining:</span>
                        <span className="text-amber-800">{timeRemaining} sec</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌱 Water Efficiency:</span>
                        <span className="text-emerald-700">{efficiency}%</span>
                      </div>
                      <div className="border-t border-[#8B5A2B]/40 pt-1.5 flex justify-between items-center text-sm">
                        <span>Rating:</span>
                        <span className="text-amber-600 font-black">
                          {efficiency >= 90 ? '⭐⭐⭐⭐⭐ Excellent!' : efficiency >= 75 ? '⭐⭐⭐⭐ Very Good!' : '⭐⭐⭐ Good!'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          onCompleteStage(250, 3);
                          if (onNextStage) onNextStage();
                          onClose();
                        }}
                        className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm rounded-xl border-2 border-[#064E3B] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <span>Next Stage</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="py-3 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-[#451A03] font-black text-sm rounded-xl border-2 border-[#78350F] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Replay</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-3 px-4 bg-[#475569] hover:bg-[#334155] text-white font-black text-sm rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#000] cursor-pointer"
                      >
                        Exit
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM OGGY GUIDANCE BANNER ================= */}
        <div className="w-full bg-[#E5CCA0] border-t-4 border-[#5D3A1A] p-2.5 sm:p-3 flex items-center gap-3 relative z-20">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-3 border-[#5D3A1A] shadow-md bg-sky-200 shrink-0 flex items-center justify-center">
            <OggySvgSprite size={52} />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-[11px] font-black text-[#7B4E26] uppercase tracking-wide">
              OGGY’S HIMALAYAN WATER GUIDE
            </span>
            <p className="text-xs sm:text-sm font-bold text-[#4A321E] leading-snug">
              {oggyMessage}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
