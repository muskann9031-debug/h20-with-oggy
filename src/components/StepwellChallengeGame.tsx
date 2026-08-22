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
  Heart,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Sparkles,
  Award,
  Shield,
  HelpCircle,
  CheckCircle2,
  FastForward,
  Navigation,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { OggySvgSprite, CockroachSvgSprite } from './CartoonSprites';

interface StepwellChallengeGameProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteStage: (earnedCoins: number, earnedStars: number) => void;
  onNextStage?: () => void;
  stageTitle?: string;
  stageRegion?: string;
}

interface Cockroach {
  id: string;
  name: string;
  variant: 'deedee' | 'joey' | 'marky';
  segment: StepSegmentId;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  speed: number;
  direction: 1 | -1;
  turnWait: number;
}

// Connected Path Graph Segments across the Rajasthani Baori Stepwell
type StepSegmentId =
  | 'bottom'
  | 'stair_b_l'
  | 'stair_b_r'
  | 'lower_l'
  | 'lower_r'
  | 'stair_lm_l'
  | 'stair_lm_r'
  | 'mid_l'
  | 'mid_r'
  | 'stair_mt_l'
  | 'stair_mt_r'
  | 'top';

const TARGET_WATER = 5;

// Exact mathematical step-height calculator for each segment
const calculateSegmentY = (segment: StepSegmentId, x: number): number => {
  switch (segment) {
    case 'bottom':
      return 530;
    case 'stair_b_l': {
      // (380, 530) to (260, 430)
      const t = Math.max(0, Math.min(1, (380 - x) / (380 - 260)));
      return 530 - t * (530 - 430);
    }
    case 'stair_b_r': {
      // (620, 530) to (740, 430)
      const t = Math.max(0, Math.min(1, (x - 620) / (740 - 620)));
      return 530 - t * (530 - 430);
    }
    case 'lower_l':
      return 430;
    case 'lower_r':
      return 430;
    case 'stair_lm_l': {
      // (100, 430) to (240, 290) - ascending up-right
      const t = Math.max(0, Math.min(1, (x - 100) / (240 - 100)));
      return 430 - t * (430 - 290);
    }
    case 'stair_lm_r': {
      // (900, 430) to (760, 290) - descending down-right
      const t = Math.max(0, Math.min(1, (900 - x) / (900 - 760)));
      return 430 - t * (430 - 290);
    }
    case 'mid_l':
      return 290;
    case 'mid_r':
      return 290;
    case 'stair_mt_l': {
      // (220, 290) to (360, 160) - ascending up-right
      const t = Math.max(0, Math.min(1, (x - 220) / (360 - 220)));
      return 290 - t * (290 - 160);
    }
    case 'stair_mt_r': {
      // (780, 290) to (640, 160) - descending down-right
      const t = Math.max(0, Math.min(1, (780 - x) / (780 - 640)));
      return 290 - t * (290 - 160);
    }
    case 'top':
      return 160;
    default:
      return 530;
  }
};

export const StepwellChallengeGame: React.FC<StepwellChallengeGameProps> = ({
  isOpen,
  onClose,
  onCompleteStage,
  onNextStage,
  stageTitle = 'Rajasthan: Thar Baori Stepwell Challenge',
  stageRegion = 'Jodhpur & Thar Desert',
}) => {
  // Game Mode: 'tutorial' (Step-by-step interactive practice) vs 'real' (Timed 75s with score)
  const [gameMode, setGameMode] = useState<'tutorial' | 'real'>('tutorial');
  const [tutorialStep, setTutorialStep] = useState<number>(1); // 1: Fill, 2: Climb Left, 3: Jump Roach, 4: Pour Top, 5: Descend Right, 6: Complete
  const [showTutorialFinishModal, setShowTutorialFinishModal] = useState<boolean>(false);

  // Game States
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'success' | 'gameover'>('playing');
  const [lives, setLives] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(75);
  const [tankWater, setTankWater] = useState<number>(0);
  const [hasBucketWater, setHasBucketWater] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [failReason, setFailReason] = useState<'time' | 'lives'>('time');

  // Player Step Position & Movement
  const [playerSegment, setPlayerSegment] = useState<StepSegmentId>('bottom');
  const [playerX, setPlayerX] = useState<number>(500);
  const [playerY, setPlayerY] = useState<number>(530);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('left');
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [isPouringAnimation, setIsPouringAnimation] = useState<boolean>(false);
  const [splashEffect, setSplashEffect] = useState<{ x: number; y: number } | null>(null);

  // Jump / Hop State (Allows jumping over cockroaches on stairs)
  const [jumpOffset, setJumpOffset] = useState<number>(0);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const jumpVelocityRef = useRef<number>(0);

  // Cockroaches stationed along the Baori stairs with wide safe zones and generous pauses
  const [cockroaches, setCockroaches] = useState<Cockroach[]>([
    {
      id: 'deedee_lower_left',
      name: 'Dee Dee',
      variant: 'deedee',
      segment: 'lower_l',
      x: 170,
      y: 430,
      minX: 130,
      maxX: 210,
      speed: 0.7,
      direction: 1,
      turnWait: 0,
    },
    {
      id: 'marky_mid_left',
      name: 'Marky',
      variant: 'marky',
      segment: 'mid_l',
      x: 150,
      y: 290,
      minX: 110,
      maxX: 180,
      speed: 0.75,
      direction: -1,
      turnWait: 0,
    },
    {
      id: 'joey_lower_right',
      name: 'Joey',
      variant: 'joey',
      segment: 'lower_r',
      x: 820,
      y: 430,
      minX: 780,
      maxX: 850,
      speed: 0.7,
      direction: 1,
      turnWait: 0,
    },
  ]);

  // Keys tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio helper
  const playSfx = useCallback(
    (type: 'click' | 'water' | 'success' | 'error' | 'victory' | 'splash' | 'deliver' | 'jump' | 'hurdle') => {
      if (isSoundMuted) return;
      switch (type) {
        case 'click':
          sound.playClick();
          break;
        case 'water':
          sound.playWaterFlow();
          break;
        case 'success':
          sound.playSuccessChime();
          break;
        case 'error':
          sound.playErrorBuzz();
          break;
        case 'victory':
          sound.playVictoryFanfare();
          break;
        case 'splash':
          sound.playSplash();
          break;
        case 'deliver':
          sound.playWaterDrop();
          break;
        case 'jump':
          sound.playVoicePop();
          break;
        case 'hurdle':
          sound.playHurdleSpawn();
          break;
      }
    },
    [isSoundMuted]
  );

  // Restart / Reset Level (Always reloads fresh 3 hearts/lifespans, timer, and plays hurdle sound)
  const handleResetLevel = useCallback((targetMode: 'tutorial' | 'real' = 'real') => {
    setGameMode(targetMode);
    setGameState('playing');
    setLives(3); // Reset lives to full (3 hearts) for both tutorial and real game
    setTimeRemaining(75);
    setTankWater(0);
    setHasBucketWater(false);
    setPlayerSegment('bottom');
    setPlayerX(500);
    setPlayerY(530);
    setPlayerFacing('left');
    setIsWalking(false);
    setIsInvincible(false);
    setIsPouringAnimation(false);
    setIsJumping(false);
    setJumpOffset(0);
    jumpVelocityRef.current = 0;
    setShowTutorialFinishModal(false);
    setTutorialStep(1);

    // Play hurdle load audio cue
    playSfx('hurdle');

    setCockroaches([
      {
        id: 'deedee_lower_left',
        name: 'Dee Dee',
        variant: 'deedee',
        segment: 'lower_l',
        x: 170,
        y: 430,
        minX: 130,
        maxX: 210,
        speed: targetMode === 'tutorial' ? 0.65 : 0.9,
        direction: 1,
        turnWait: 0,
      },
      {
        id: 'marky_mid_left',
        name: 'Marky',
        variant: 'marky',
        segment: 'mid_l',
        x: 150,
        y: 290,
        minX: 100,
        maxX: 190,
        speed: targetMode === 'tutorial' ? 0.7 : 0.95,
        direction: -1,
        turnWait: 0,
      },
      {
        id: 'joey_mid_right',
        name: 'Joey',
        variant: 'joey',
        segment: 'mid_r',
        x: 850,
        y: 290,
        minX: 810,
        maxX: 890,
        speed: targetMode === 'tutorial' ? 0.65 : 0.9,
        direction: 1,
        turnWait: 0,
      },
    ]);
  }, [playSfx]);

  // Open handler
  useEffect(() => {
    if (isOpen) {
      handleResetLevel('tutorial');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isOpen, handleResetLevel]);

  // 75-second Countdown Timer (ONLY IN REAL GAME MODE)
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'real') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setFailReason('time');
            setGameState('gameover');
            playSfx('error');
            return 0;
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
  }, [gameState, gameMode, playSfx]);

  // Proximity to bottom water reservoir (Baori Kund)
  const isNearWater = useCallback(() => {
    return playerSegment === 'bottom' && playerX >= 360 && playerX <= 640;
  }, [playerSegment, playerX]);

  // Proximity to top water storage (Village Tanka)
  const isNearTopTank = useCallback(() => {
    return playerSegment === 'top' && playerX >= 360 && playerX <= 640;
  }, [playerSegment, playerX]);

  // Jump Action (hops over cockroaches on the stairs)
  const handleJump = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!isJumping) {
      setIsJumping(true);
      jumpVelocityRef.current = -9.5;
      playSfx('jump');
    }
  }, [gameState, isJumping, playSfx]);

  // Collect water at bottom Baori Kund
  const handleCollectWater = useCallback(() => {
    if (gameState !== 'playing') return;
    if (isNearWater()) {
      if (!hasBucketWater) {
        setHasBucketWater(true);
        playSfx('splash');
        setSplashEffect({ x: playerX, y: 550 });
        setTimeout(() => setSplashEffect(null), 600);

        if (gameMode === 'tutorial') {
          setTutorialStep(2);
        }
      }
    }
  }, [gameState, isNearWater, hasBucketWater, playerX, playSfx, gameMode]);

  // Deliver water to top community Tanka
  const handleDeliverWater = useCallback(() => {
    if (gameState !== 'playing') return;
    if (isNearTopTank() && hasBucketWater && !isPouringAnimation) {
      setIsPouringAnimation(true);
      playSfx('deliver');
      setSplashEffect({ x: 500, y: 130 });

      setTimeout(() => {
        setHasBucketWater(false);
        setIsPouringAnimation(false);
        setSplashEffect(null);

        if (gameMode === 'tutorial') {
          setTutorialStep(5); // Now descend right stairs
          playSfx('success');
          return;
        }

        setTankWater((prev) => {
          const next = prev + 1;
          playSfx('water');
          if (next >= TARGET_WATER) {
            setTimeout(() => {
              setGameState('success');
              playSfx('victory');
              try {
                confetti({
                  particleCount: 150,
                  spread: 85,
                  origin: { y: 0.6 },
                });
              } catch {
                // ignore
              }
            }, 400);
          }
          return next;
        });
      }, 500);
    }
  }, [gameState, isNearTopTank, hasBucketWater, isPouringAnimation, playSfx, gameMode]);

  const handleActionButton = useCallback(() => {
    if (isNearWater()) {
      handleCollectWater();
    } else if (isNearTopTank()) {
      handleDeliverWater();
    }
  }, [isNearWater, handleCollectWater, isNearTopTank, handleDeliverWater]);

  // Key Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'e', 'p', 'j'].includes(key)) {
        e.preventDefault();
      }
      keysPressed.current[key] = true;

      if (key === 'p') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        playSfx('click');
      }

      if (key === 'e') {
        handleActionButton();
      }

      if (key === ' ' || key === 'j') {
        if (isNearWater() || (isNearTopTank() && hasBucketWater)) {
          handleActionButton();
        } else {
          handleJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isOpen, handleActionButton, handleJump, isNearWater, isNearTopTank, hasBucketWater, playSfx]);

  // =========================================================================
  // DIRECTIONAL STEPWELL CIRCULATION GRAPH (LEFT CLIMB UP, RIGHT DESCEND DOWN)
  // =========================================================================
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const keys = keysPressed.current;
      const moveLeft = keys['arrowleft'] || keys['a'];
      const moveRight = keys['arrowright'] || keys['d'];
      const moveUp = keys['arrowup'] || keys['w'];
      const moveDown = keys['arrowdown'] || keys['s'];
      const isMoving = moveLeft || moveRight || moveUp || moveDown;
      setIsWalking(isMoving);

      const speed = 4.2;

      // Handle Jump Physics with high clearance
      setJumpOffset((prevOffset) => {
        if (jumpVelocityRef.current !== 0 || prevOffset < 0) {
          const nextOffset = prevOffset + jumpVelocityRef.current;
          jumpVelocityRef.current += 0.65; // gravity

          if (nextOffset >= 0) {
            jumpVelocityRef.current = 0;
            setIsJumping(false);
            return 0;
          }
          return nextOffset;
        }
        return 0;
      });

      // Update Player Position along Stepwell Graph
      setPlayerSegment((curSeg) => {
        let curX = playerX;
        let nextSeg = curSeg;
        let nextX = curX;

        if (moveLeft) setPlayerFacing('left');
        if (moveRight) setPlayerFacing('right');

        // =====================================================================
        // 1. BOTTOM KUND PLATFORM (Y = 530, X: 360..640)
        // =====================================================================
        if (curSeg === 'bottom') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // UP Arrow / W moves towards left ascent stairs when at bottom
          if (moveUp && !moveRight) {
            nextX -= speed;
          }

          // Junction to CLIMB UP Left Stairs: ONLY triggered by Left / Up at the left stair base (X <= 380)
          // Right arrow CANNOT climb up this stair
          if ((moveLeft || moveUp) && !moveRight && nextX <= 380) {
            nextSeg = 'stair_b_l';
            nextX = 378;
            setPlayerFacing('left');
            if (gameMode === 'tutorial' && tutorialStep === 2) {
              setTutorialStep(3); // On stairs
            }
          }
          // Junction from RIGHT Stairs Descending (at X >= 620)
          else if (moveLeft && curX >= 620 && nextX < 620) {
            nextX = 618;
          } else {
            nextX = Math.max(360, Math.min(640, nextX));
          }

          // In tutorial: If completed round loop and returned to bottom
          if (gameMode === 'tutorial' && tutorialStep === 5 && nextX >= 360 && nextX <= 640) {
            setTutorialStep(6);
            setShowTutorialFinishModal(true);
            playSfx('victory');
          }
        }

        // =====================================================================
        // 2. LEFT STAIRS BOTTOM (Climbing UP from 380,530 to 260,430)
        // =====================================================================
        else if (curSeg === 'stair_b_l') {
          // UP Arrow / Left / W climbs UP towards Lower Left Terrace (260)
          if (moveUp || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 260) {
              nextSeg = 'lower_l';
              nextX = 258;
            }
          }
          // DOWN Arrow / Right / S steps back DOWN to Bottom Pool (380)
          if (moveDown || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 380) {
              nextSeg = 'bottom';
              nextX = 382;
            }
          }
        }

        // =====================================================================
        // 3. LOWER LEFT TERRACE (Y = 430, X: 60..260)
        // =====================================================================
        else if (curSeg === 'lower_l') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // UP Arrow / W moves towards ascending stair at X=100
          if (moveUp && !moveRight) {
            nextX -= speed;
            setPlayerFacing('left');
          }
          // DOWN Arrow / S moves towards descending stair back to bottom at X=260
          if (moveDown && !moveLeft) {
            nextX += speed;
            setPlayerFacing('right');
          }

          // Junction to Lower-to-Mid Left Stairs (at X <= 105, ascending up-right to 240)
          // Must move Left or Up to reach the stair base
          if ((moveLeft || moveUp) && !moveRight && nextX <= 105) {
            nextSeg = 'stair_lm_l';
            nextX = 106;
            setPlayerFacing('right');
          }
          // Junction back down to bottom stairs (at X >= 260)
          else if ((moveRight || moveDown) && nextX >= 260) {
            nextSeg = 'stair_b_l';
            nextX = 262;
            setPlayerFacing('right');
          } else {
            nextX = Math.max(60, Math.min(260, nextX));
          }
        }

        // =====================================================================
        // 4. LOWER-TO-MID LEFT STAIRS (Climbing UP-RIGHT from 100,430 to 240,290)
        // =====================================================================
        else if (curSeg === 'stair_lm_l') {
          // UP Arrow / Right / W climbs UP towards Mid Left Terrace (240)
          if (moveUp || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 240) {
              nextSeg = 'mid_l';
              nextX = 242;
            }
          }
          // DOWN Arrow / Left / S steps back DOWN to Lower Left Terrace (100)
          if (moveDown || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 100) {
              nextSeg = 'lower_l';
              nextX = 98;
            }
          }
        }

        // =====================================================================
        // 5. MID LEFT TERRACE (Y = 290, X: 60..360)
        // =====================================================================
        else if (curSeg === 'mid_l') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // UP Arrow / W moves towards ascending upper stair at X=220
          if (moveUp) {
            if (nextX < 220) {
              nextX += speed;
              setPlayerFacing('right');
            } else {
              nextSeg = 'stair_mt_l';
              nextX = 222;
              setPlayerFacing('right');
            }
          }

          // Junction to Mid-to-Top Left Stairs (at X in 218..245) - only if moving Up or Right
          if ((moveRight || moveUp) && nextX >= 220 && nextSeg !== 'stair_mt_l') {
            nextSeg = 'stair_mt_l';
            nextX = 222;
            setPlayerFacing('right');
          }
          // Junction back down to lower-mid stairs (at X <= 100 or when moving down at X <= 240)
          else if (moveDown && nextX <= 245) {
            nextSeg = 'stair_lm_l';
            nextX = 238;
            setPlayerFacing('left');
          } else {
            nextX = Math.max(60, Math.min(360, nextX));
          }
        }

        // =====================================================================
        // 6. MID-TO-TOP LEFT STAIRS (Climbing UP-RIGHT from 220,290 to 360,160)
        // =====================================================================
        else if (curSeg === 'stair_mt_l') {
          // UP Arrow / Right / W climbs UP to TOP TANKA (360)
          if (moveUp || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 360) {
              nextSeg = 'top';
              nextX = 362;
              if (gameMode === 'tutorial') {
                setTutorialStep(4); // Reached Top Tanka
              }
            }
          }
          // DOWN Arrow / Left / S steps back DOWN to Mid Left Terrace (220)
          if (moveDown || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 220) {
              nextSeg = 'mid_l';
              nextX = 218;
            }
          }
        }

        // =====================================================================
        // 7. TOP VILLAGE TANKA PLATFORM (Y = 160, X: 340..660)
        // =====================================================================
        else if (curSeg === 'top') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // DOWN Arrow / S directs Oggy towards the right descent stairs
          if (moveDown && !moveLeft) {
            nextX += speed;
            setPlayerFacing('right');
          }

          // Junction to RIGHT STAIRS DESCENDING (at X >= 635, descending down-right)
          if ((moveRight || moveDown) && nextX >= 635) {
            nextSeg = 'stair_mt_r';
            nextX = 642;
            setPlayerFacing('right');
          }
          // Can also step back to Left stairs (at X <= 360)
          else if ((moveLeft || moveUp) && nextX <= 360) {
            nextSeg = 'stair_mt_l';
            nextX = 358;
            setPlayerFacing('left');
          } else {
            nextX = Math.max(340, Math.min(660, nextX));
          }
        }

        // =====================================================================
        // 8. MID-TO-TOP RIGHT STAIRS (Descending DOWN-RIGHT from 640,160 to 780,290)
        // =====================================================================
        else if (curSeg === 'stair_mt_r') {
          // DOWN Arrow / Right / S descends DOWN to Mid Right Terrace (780)
          if (moveDown || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 780) {
              nextSeg = 'mid_r';
              nextX = 782;
            }
          }
          // UP Arrow / Left / W climbs back UP to Top Tanka (640)
          if (moveUp || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 640) {
              nextSeg = 'top';
              nextX = 638;
            }
          }
        }

        // =====================================================================
        // 9. MID RIGHT TERRACE (Y = 290, X: 640..940)
        // =====================================================================
        else if (curSeg === 'mid_r') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // DOWN Arrow / S directs Oggy towards lower stairs (760)
          if (moveDown) {
            if (nextX > 765) {
              nextX -= speed;
              setPlayerFacing('left');
            } else {
              nextSeg = 'stair_lm_r';
              nextX = 762;
              setPlayerFacing('right');
            }
          }

          // Junction to Lower-to-Mid Right Stairs (at X in 755..775)
          if ((moveRight || moveDown) && nextX >= 760 && nextSeg !== 'stair_lm_r' && curX <= 765) {
            nextSeg = 'stair_lm_r';
            nextX = 762;
            setPlayerFacing('right');
          }
          // Junction back up to top stairs (at X <= 780 when moving left/up)
          else if ((moveLeft || moveUp) && nextX <= 780 && curX > 780) {
            nextSeg = 'stair_mt_r';
            nextX = 778;
            setPlayerFacing('left');
          } else {
            nextX = Math.max(640, Math.min(940, nextX));
          }
        }

        // =====================================================================
        // 10. LOWER-TO-MID RIGHT STAIRS (Descending DOWN-RIGHT from 760,290 to 900,430)
        // =====================================================================
        else if (curSeg === 'stair_lm_r') {
          // DOWN Arrow / Right / S descends DOWN to Lower Right Terrace (900)
          if (moveDown || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 900) {
              nextSeg = 'lower_r';
              nextX = 902;
            }
          }
          // UP Arrow / Left / W climbs back UP to Mid Right Terrace (760)
          if (moveUp || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 760) {
              nextSeg = 'mid_r';
              nextX = 758;
            }
          }
        }

        // =====================================================================
        // 11. LOWER RIGHT TERRACE (Y = 430, X: 740..940)
        // =====================================================================
        else if (curSeg === 'lower_r') {
          if (moveLeft) nextX -= speed;
          if (moveRight) nextX += speed;

          // DOWN Arrow / S directs Oggy towards bottom stairs at X=740
          if (moveDown && !moveRight) {
            nextX -= speed;
            setPlayerFacing('left');
          }

          // Junction to Bottom Right Stairs (at X <= 745, descending down-left to 620)
          if ((moveLeft || moveDown) && nextX <= 745) {
            nextSeg = 'stair_b_r';
            nextX = 738;
            setPlayerFacing('left');
          }
          // Junction back up to lower-mid stairs (at X >= 900)
          else if ((moveRight || moveUp) && nextX >= 900) {
            nextSeg = 'stair_lm_r';
            nextX = 898;
            setPlayerFacing('left');
          } else {
            nextX = Math.max(740, Math.min(940, nextX));
          }
        }

        // =====================================================================
        // 12. RIGHT STAIRS BOTTOM (Descending DOWN-LEFT from 740,430 to 620,530)
        // =====================================================================
        else if (curSeg === 'stair_b_r') {
          // DOWN Arrow / Left / S descends DOWN to Bottom Kund (620)
          if (moveDown || moveLeft) {
            nextX -= speed;
            setPlayerFacing('left');
            if (nextX <= 620) {
              nextSeg = 'bottom';
              nextX = 618;
            }
          }
          // UP Arrow / Right / W climbs back UP to Lower Right Terrace (740)
          if (moveUp || moveRight) {
            nextX += speed;
            setPlayerFacing('right');
            if (nextX >= 740) {
              nextSeg = 'lower_r';
              nextX = 742;
            }
          }
        }

        setPlayerX(nextX);
        setPlayerY(calculateSegmentY(nextSeg, nextX));
        return nextSeg;
      });

      // Move Cockroaches along their step segments with generous 1.3 - 1.5s turn pauses
      setCockroaches((prevRoaches) =>
        prevRoaches.map((roach) => {
          if (roach.turnWait > 0) {
            return { ...roach, turnWait: roach.turnWait - 1 };
          }

          let nextX = roach.x + roach.speed * roach.direction;
          let nextDir = roach.direction;
          let newWait = 0;

          if (nextX >= roach.maxX) {
            nextX = roach.maxX;
            nextDir = -1;
            newWait = gameMode === 'tutorial' ? 90 : 75; // 1.3 to 1.5s resting pause at edge
          } else if (nextX <= roach.minX) {
            nextX = roach.minX;
            nextDir = 1;
            newWait = gameMode === 'tutorial' ? 90 : 75; // 1.3 to 1.5s resting pause at edge
          }

          const nextY = calculateSegmentY(roach.segment, nextX);

          return {
            ...roach,
            x: nextX,
            y: nextY,
            direction: nextDir,
            turnWait: newWait,
          };
        })
      );

      // Check Collision between Oggy and Cockroach Hurdles (Only if NOT jumping high or invincible)
      setCockroaches((currentRoaches) => {
        if (!isInvincible && jumpOffset > -8) {
          for (const roach of currentRoaches) {
            // Only check collision if player is on the same segment as the cockroach
            const dx = Math.abs(roach.x - playerX);
            const dy = Math.abs(roach.y - playerY);

            // Precise, fair bounding box collision (only direct body hits)
            if (dx < 22 && dy < 18) {
              playSfx('error');
              setIsInvincible(true);

              // Gentle comic knockback along the platform
              setPlayerX((prevX) => (prevX < 500 ? Math.max(80, prevX - 25) : Math.min(920, prevX + 25)));

              // In real mode: lose life
              if (gameMode === 'real') {
                setLives((prevLives) => {
                  const nextLives = prevLives - 1;
                  if (nextLives <= 0) {
                    setFailReason('lives');
                    setGameState('gameover');
                  }
                  return Math.max(0, nextLives);
                });
              }

              // 1.8s invincibility shield
              setTimeout(() => {
                setIsInvincible(false);
              }, 1800);

              break;
            }
          }
        }
        return currentRoaches;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, playerX, playerY, jumpOffset, isInvincible, playSfx, gameMode, tutorialStep]);

  if (!isOpen) return null;

  // Dynamic Guide Hint based on Game Mode & Tutorial Step
  const getDynamicHint = () => {
    if (gameMode === 'tutorial') {
      switch (tutorialStep) {
        case 1:
          return '🎓 TUTORIAL: Walk to the Bottom Kund pool & Press E / Space (or tap "💧 Fill Bucket")!';
        case 2:
        case 3:
          return '🎓 TUTORIAL: Great! Now climb UP using the LEFT STAIRS (← / ↑ / A / W). Press Space / J to jump over hurdles!';
        case 4:
          return '🎓 TUTORIAL: Reached the Top! Press E / Space (or tap "🪣 Pour Water") to fill the Village Tanka!';
        case 5:
          return '🎓 TUTORIAL: Perfect! Now descend DOWN using the RIGHT STAIRS (→ / ↓ / D / S) back to the water pool!';
        case 6:
          return '🎉 TUTORIAL COMPLETE! You mastered the Baori circulation loop!';
        default:
          return 'Follow the glowing guidance arrows to complete the practice loop!';
      }
    } else {
      if (!hasBucketWater && playerSegment === 'bottom') {
        return 'Step 1: Fill your bucket at the bottom Kund pool!';
      } else if (hasBucketWater && playerSegment !== 'top') {
        return 'Step 2: 🪣 Bucket Full! Climb UP the LEFT STAIRS and dodge cockroach hurdles!';
      } else if (hasBucketWater && playerSegment === 'top') {
        return 'Step 3: Pour the water into the Top Village Tanka!';
      } else {
        return 'Step 4: Descend DOWN the RIGHT STAIRS to collect the next bucket!';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-amber-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#231709] rounded-3xl border-4 border-[#B45309] shadow-2xl overflow-hidden flex flex-col my-auto font-sans select-none">
        
        {/* ================= TOP HEADER BAR (RAJASTHANI BAORI STEPWELL THEME) ================= */}
        <div className="w-full bg-[#1C1106] px-4 py-2.5 sm:px-6 sm:py-3 border-b-4 border-[#B45309] flex items-center justify-between z-20">
          
          {/* Title & Prompt Goal */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏰</span>
              <h2 className="text-base sm:text-lg font-black text-[#FBBF24] tracking-wide uppercase font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {stageTitle}
              </h2>
              <span className="hidden sm:inline-block bg-[#78350F] text-[#FEF3C7] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#F59E0B] font-mono">
                {stageRegion}
              </span>
              {gameMode === 'tutorial' && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 font-mono animate-pulse">
                  🎓 TUTORIAL / PRACTICE
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-bold text-[#FDE68A] tracking-tight mt-0.5 drop-shadow-sm flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-amber-300 inline" />
              <span>{getDynamicHint()}</span>
            </p>
          </div>

          {/* Mode Switch, Sound, Pause & Exit Controls */}
          <div className="flex items-center gap-2">
            {gameMode === 'tutorial' ? (
              <button
                type="button"
                onClick={() => handleResetLevel('real')}
                className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl border-2 border-amber-200 shadow-md cursor-pointer transition active:scale-95"
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
                <span>Start Timed Real Game</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleResetLevel('tutorial')}
                className="hidden sm:flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl border-2 border-stone-600 shadow-md cursor-pointer transition active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Play Tutorial</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="w-9 h-9 bg-[#38200B] hover:bg-[#4E2D10] text-[#FEF3C7] rounded-xl border-2 border-[#D97706] flex items-center justify-center cursor-pointer active:scale-95 transition"
              title={isSoundMuted ? 'Unmute SFX' : 'Mute SFX'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#FEF3C7]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
                playSfx('click');
              }}
              className="w-9 h-9 bg-[#38200B] hover:bg-[#4E2D10] text-[#FBBF24] rounded-xl border-2 border-[#D97706] flex items-center justify-center cursor-pointer active:scale-95 shadow-md transition font-black font-mono text-sm"
              title="Pause Game (P)"
            >
              {gameState === 'paused' ? <Play className="w-4 h-4 fill-current text-emerald-300" /> : <Pause className="w-4 h-4 fill-current text-[#FBBF24]" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 bg-rose-600 hover:bg-rose-500 text-white rounded-xl border-2 border-slate-950 flex items-center justify-center cursor-pointer active:scale-95 shadow-xs transition"
              title="Exit Stage"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MAIN 2D STEPPED RAJASTHANI BAORI CANVAS ================= */}
        <div className="relative w-full aspect-[1000/620] bg-[#1A1006] overflow-hidden flex items-center justify-center">
          
          <svg viewBox="0 0 1000 620" className="absolute inset-0 w-full h-full select-none">
            <defs>
              {/* Thar Desert Sunset Sky Gradient */}
              <linearGradient id="tharSunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7C2D12" />
                <stop offset="35%" stopColor="#C2410C" />
                <stop offset="70%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#FDBA74" />
              </linearGradient>

              {/* Jodhpur Golden Sandstone Gradient */}
              <linearGradient id="sandstoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>

              {/* Step Edge Highlight Gradient */}
              <linearGradient id="stepGoldEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="100%" stopColor="#FDE68A" />
              </linearGradient>

              {/* Cool Subterranean Baori Aquifer Water Gradient */}
              <linearGradient id="baoriAquiferGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="30%" stopColor="#0EA5E9" />
                <stop offset="70%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Rajasthani Jali Latticework Pattern */}
              <pattern id="jaliPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#78350F" />
                <circle cx="10" cy="10" r="5" fill="#451A03" />
                <polygon points="10,0 20,10 10,20 0,10" fill="none" stroke="#B45309" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* --- 1. THAR DESERT & MEHRANGARH FORT BACKDROP --- */}
            {/* Sunset Sky */}
            <rect width="1000" height="260" fill="url(#tharSunsetSky)" />

            {/* Glowing Desert Sun */}
            <circle cx="500" cy="90" r="45" fill="#FEF08A" opacity="0.8" className="animate-pulse" />
            <circle cx="500" cy="90" r="60" fill="#FDE047" opacity="0.3" />

            {/* Fort Mehrangarh & Palace Ramparts Silhouette */}
            <path
              d="M 0 200 L 80 180 L 110 180 L 110 160 L 140 160 L 140 180 L 220 170 L 250 140 L 290 140 L 320 170 L 400 175 L 440 130 L 560 130 L 600 175 L 680 170 L 710 140 L 750 140 L 780 170 L 860 180 L 860 160 L 890 160 L 890 180 L 920 180 L 1000 200 L 1000 260 L 0 260 Z"
              fill="#431407"
              opacity="0.95"
            />

            {/* Rajasthani Chhatri Pavilions (Left & Right) */}
            <g transform="translate(160, 110)">
              <polygon points="40,0 10,25 70,25" fill="#D97706" stroke="#78350F" strokeWidth="2" />
              <rect x="22" y="25" width="6" height="35" fill="#B45309" />
              <rect x="52" y="25" width="6" height="35" fill="#B45309" />
              <rect x="15" y="60" width="50" height="8" fill="#78350F" />
            </g>
            <g transform="translate(760, 110)">
              <polygon points="40,0 10,25 70,25" fill="#D97706" stroke="#78350F" strokeWidth="2" />
              <rect x="22" y="25" width="6" height="35" fill="#B45309" />
              <rect x="52" y="25" width="6" height="35" fill="#B45309" />
              <rect x="15" y="60" width="50" height="8" fill="#78350F" />
            </g>

            {/* Subterranean Stepwell Stone Pit Wall */}
            <rect x="0" y="160" width="1000" height="460" fill="#2E1B0E" />
            <path d="M 380 160 L 620 160 L 620 540 L 380 540 Z" fill="#1C0F08" />
            <path d="M 400 190 L 600 190 L 600 540 L 400 540 Z" fill="#120A05" />

            {/* Sandstone Wall Insets / Jharokha Arches */}
            {[120, 240, 720, 840].map((jx) => (
              <g key={`jharokha-${jx}`} transform={`translate(${jx}, 200)`}>
                <path d="M 0 40 Q 20 10 40 40 L 40 70 L 0 70 Z" fill="#451A03" stroke="#B45309" strokeWidth="2" />
                <line x1="20" y1="25" x2="20" y2="70" stroke="#78350F" strokeWidth="1.5" />
              </g>
            ))}

            {/* --- 2. TOP VILLAGE RAJASTHANI TANKA (CISTERN / HAUZ) --- */}
            <g transform="translate(350, 30)">
              {/* Rajasthani Dome Roof with Golden Kalash Finial */}
              <path d="M 50 35 Q 150 -15 250 35 Z" fill="#B45309" stroke="#78350F" strokeWidth="3" />
              <path d="M 80 35 Q 150 0 220 35 Z" fill="#D97706" />
              <circle cx="150" cy="-6" r="9" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
              <line x1="150" y1="-15" x2="150" y2="-6" stroke="#FBBF24" strokeWidth="3" />

              {/* Tanka Body with Jali stone pattern */}
              <rect x="20" y="35" width="260" height="95" fill="url(#jaliPattern)" stroke="#78350F" strokeWidth="4" />
              
              {/* Water Storage Reservoir Window */}
              <rect x="45" y="45" width="210" height="75" fill="#0A0F1D" stroke="#F59E0B" strokeWidth="3" rx="6" />
              
              {/* Dynamic Water Level inside Tanka */}
              <rect
                x="48"
                y={117 - (tankWater / TARGET_WATER) * 69}
                width="204"
                height={(tankWater / TARGET_WATER) * 69}
                fill="url(#baoriAquiferGrad)"
                rx="4"
                className="transition-all duration-500"
              />
              {tankWater > 0 && (
                <rect
                  x="48"
                  y={117 - (tankWater / TARGET_WATER) * 69}
                  width="204"
                  height="6"
                  fill="#E0F2FE"
                  className="animate-pulse"
                />
              )}

              {/* Tanka Label & Counter */}
              <text
                x="150"
                y="88"
                fill="#FFFFFF"
                fontSize="17"
                fontWeight="900"
                textAnchor="middle"
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-mono tracking-wider"
              >
                {String(tankWater).padStart(2, '0')} / {String(TARGET_WATER).padStart(2, '0')} BUCKETS
              </text>
              <text
                x="150"
                y="108"
                fill="#FDE68A"
                fontSize="10"
                fontWeight="800"
                textAnchor="middle"
                className="tracking-wider uppercase"
              >
                Rajasthan Village Tanka
              </text>
            </g>

            {/* --- 3. STEPPED TERRACE LEVELS & STAIRWAYS --- */}

            {/* TOP PLATFORM (Y = 160, X: 340..660) */}
            <g>
              <rect x="340" y="160" width="320" height="24" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="340" y="160" width="320" height="6" fill="url(#stepGoldEdge)" />
              {/* Directional Flow Guide at Top Platform (Walk Left to Right) */}
              <text x="500" y="177" fill="#451A03" fontSize="10" fontWeight="900" textAnchor="middle" className="font-mono">
                ➡️ TOP TANKA PLATFORM (FILL TANK & WALK TO RIGHT STAIRS) ➡️
              </text>
            </g>

            {/* ========================================================================= */}
            {/* LEFT STAIRS: CLIMB UP ⬆️ (Bottom -> Lower-Left -> Mid-Left -> Top Tanka) */}
            {/* ========================================================================= */}

            {/* Upper-Left Stairs: (220, 290) up-right to (360, 160) */}
            {[0, 1, 2, 3, 4, 5].map((s) => {
              const sx = 220 + s * 23.3;
              const sy = 290 - s * 21.6;
              return (
                <g key={`ustair-l-${s}`}>
                  <rect x={sx} y={sy} width="30" height="24" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="30" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Left Climb Indicator Badge */}
            <g transform="translate(270, 205)">
              <rect x="-45" y="-10" width="90" height="20" rx="10" fill="#15803D" stroke="#86EFAC" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬆️ CLIMB UP
              </text>
            </g>

            {/* Lower-Left Stairs: (100, 430) up-right to (240, 290) */}
            {[0, 1, 2, 3, 4, 5].map((s) => {
              const sx = 100 + s * 23.3;
              const sy = 430 - s * 23.3;
              return (
                <g key={`lstair-l-${s}`}>
                  <rect x={sx} y={sy} width="30" height="24" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="30" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Left Climb Lower Indicator Badge */}
            <g transform="translate(150, 345)">
              <rect x="-45" y="-10" width="90" height="20" rx="10" fill="#15803D" stroke="#86EFAC" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬆️ CLIMB UP
              </text>
            </g>

            {/* Bottom-Left Stairs: (380, 530) to (260, 430) */}
            {[0, 1, 2, 3].map((s) => {
              const sx = 260 + s * 30;
              const sy = 430 + s * 25;
              return (
                <g key={`bstair-l-${s}`}>
                  <rect x={sx} y={sy} width="32" height="26" fill="#92400E" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="32" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Bottom Left Climb Indicator */}
            <g transform="translate(300, 470)">
              <rect x="-45" y="-10" width="90" height="20" rx="10" fill="#15803D" stroke="#86EFAC" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬆️ CLIMB UP
              </text>
            </g>

            {/* ========================================================================= */}
            {/* RIGHT STAIRS: DESCEND DOWN ⬇️ (Top Tanka -> Mid-Right -> Lower-Right -> Pool) */}
            {/* ========================================================================= */}

            {/* Upper-Right Stairs: (780, 290) to (640, 160) */}
            {[0, 1, 2, 3, 4, 5].map((s) => {
              const sx = 780 - s * 23.3 - 30;
              const sy = 290 - s * 21.6;
              return (
                <g key={`ustair-r-${s}`}>
                  <rect x={sx} y={sy} width="30" height="24" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="30" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Right Descend Upper Indicator Badge */}
            <g transform="translate(730, 205)">
              <rect x="-55" y="-10" width="110" height="20" rx="10" fill="#B91C1C" stroke="#FCA5A5" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬇️ DESCEND DOWN
              </text>
            </g>

            {/* Lower-Right Stairs: (900, 430) to (760, 290) */}
            {[0, 1, 2, 3, 4, 5].map((s) => {
              const sx = 900 - s * 23.3 - 30;
              const sy = 430 - s * 23.3;
              return (
                <g key={`lstair-r-${s}`}>
                  <rect x={sx} y={sy} width="30" height="24" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="30" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Right Descend Lower Indicator Badge */}
            <g transform="translate(850, 345)">
              <rect x="-55" y="-10" width="110" height="20" rx="10" fill="#B91C1C" stroke="#FCA5A5" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬇️ DESCEND DOWN
              </text>
            </g>

            {/* Bottom-Right Stairs: (620, 530) to (740, 430) */}
            {[0, 1, 2, 3].map((s) => {
              const sx = 740 - s * 30 - 32;
              const sy = 430 + s * 25;
              return (
                <g key={`bstair-r-${s}`}>
                  <rect x={sx} y={sy} width="32" height="26" fill="#92400E" stroke="#78350F" strokeWidth="2" />
                  <rect x={sx} y={sy} width="32" height="6" fill="#FDE68A" />
                </g>
              );
            })}
            {/* Bottom Right Descend Indicator */}
            <g transform="translate(700, 470)">
              <rect x="-55" y="-10" width="110" height="20" rx="10" fill="#B91C1C" stroke="#FCA5A5" strokeWidth="2" />
              <text x="0" y="4" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" className="font-mono">
                ⬇️ DESCEND DOWN
              </text>
            </g>

            {/* MIDDLE TIER WALKWAYS (Y = 290) */}
            <g>
              <rect x="60" y="290" width="300" height="26" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="60" y="290" width="300" height="6" fill="url(#stepGoldEdge)" />
              <text x="120" y="310" fill="#451A03" fontSize="10" fontWeight="900" opacity="0.8">🟢 SAFE REST TERRACE</text>
            </g>
            <g>
              <rect x="640" y="290" width="300" height="26" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="640" y="290" width="300" height="6" fill="url(#stepGoldEdge)" />
              <text x="800" y="310" fill="#451A03" fontSize="10" fontWeight="900" opacity="0.8">🟢 SAFE REST TERRACE</text>
            </g>

            {/* LOWER TIER WALKWAYS (Y = 430) */}
            <g>
              <rect x="60" y="430" width="200" height="28" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="60" y="430" width="200" height="6" fill="url(#stepGoldEdge)" />
            </g>
            <g>
              <rect x="740" y="430" width="200" height="28" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="740" y="430" width="200" height="6" fill="url(#stepGoldEdge)" />
            </g>

            {/* BOTTOM RESERVOIR PLATFORM (Y = 530, X: 360..640) */}
            <g>
              <rect x="360" y="530" width="280" height="28" fill="url(#sandstoneGrad)" stroke="#78350F" strokeWidth="3" />
              <rect x="360" y="530" width="280" height="6" fill="url(#stepGoldEdge)" />
              {[0, 1, 2, 3, 4, 5, 6].map((s) => (
                <line key={`bmark-${s}`} x1={360 + s * 40} y1="530" x2={360 + s * 40} y2="558" stroke="#78350F" strokeWidth="1.5" opacity="0.6" />
              ))}
            </g>

            {/* --- 4. BOTTOM THAR BAORI KUND (UNDERGROUND NATURAL AQUIFER RESERVOIR) --- */}
            <g transform="translate(0, 548)">
              <rect x="160" y="0" width="680" height="72" fill="url(#baoriAquiferGrad)" />
              <path
                d="M 160 0 L 360 0 L 360 14 L 640 14 L 640 0 L 840 0 L 840 72 L 160 72 Z"
                fill="url(#baoriAquiferGrad)"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              <ellipse cx="500" cy="25" rx="110" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="2" className="animate-ping opacity-60" />
              <ellipse cx="340" cy="40" rx="70" ry="7" fill="none" stroke="#A5F3FC" strokeWidth="2" className="animate-pulse" />
              <ellipse cx="660" cy="40" rx="70" ry="7" fill="none" stroke="#A5F3FC" strokeWidth="2" className="animate-pulse" />
              
              <text x="500" y="55" fill="#E0F2FE" fontSize="13" fontWeight="900" textAnchor="middle" className="font-mono drop-shadow-md">
                🌊 ANCIENT RAJASTHANI BAORI KUND (UNDERGROUND AQUIFER POOL) 🌊
              </text>
            </g>

            {/* Splash Animation Effect */}
            {splashEffect && (
              <g transform={`translate(${splashEffect.x}, ${splashEffect.y})`}>
                <circle cx="0" cy="0" r="28" fill="none" stroke="#FBBF24" strokeWidth="4" className="animate-ping" />
                <circle cx="-14" cy="-10" r="6" fill="#FFFFFF" />
                <circle cx="14" cy="-10" r="6" fill="#FFFFFF" />
                <circle cx="0" cy="-18" r="8" fill="#38BDF8" />
              </g>
            )}

            {/* --- 5. INTERACTIVE ACTION PROMPT BUTTONS ON CANVAS --- */}
            {/* Prompt at Bottom Baori Reservoir */}
            {isNearWater() && !hasBucketWater && (
              <g transform="translate(500, 492)" onClick={handleCollectWater} className="cursor-pointer">
                <rect x="-115" y="-18" width="230" height="36" rx="14" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3" className="filter drop-shadow-lg animate-bounce" />
                <text x="0" y="5" fill="#FFFFFF" fontSize="12" fontWeight="900" textAnchor="middle">
                  💧 Press E / Space to Fill Bucket
                </text>
              </g>
            )}

            {/* Prompt at Top Tanka */}
            {isNearTopTank() && hasBucketWater && (
              <g transform="translate(500, 195)" onClick={handleDeliverWater} className="cursor-pointer">
                <rect x="-120" y="-18" width="240" height="36" rx="14" fill="#15803D" stroke="#FFFFFF" strokeWidth="3" className="filter drop-shadow-lg animate-bounce" />
                <text x="0" y="5" fill="#FFFFFF" fontSize="12" fontWeight="900" textAnchor="middle">
                  🪣 Press E / Space to Pour in Tanka
                </text>
              </g>
            )}

            {/* --- 6. REAL COCKROACH HURDLES IN ROUND FRAMES (Dee Dee, Joey, Marky) --- */}
            {cockroaches.map((roach) => (
              <g
                key={roach.id}
                transform={`translate(${roach.x}, ${roach.y - 54})`}
                className="select-none pointer-events-none"
              >
                {/* Hurdle Shadow on Step */}
                <ellipse cx="0" cy="54" rx="20" ry="6" fill="rgba(0,0,0,0.6)" />
                {/* Real Cockroach Character in Circular Frame */}
                <foreignObject x="-28" y="0" width="56" height="56" className="overflow-visible">
                  <CockroachSvgSprite
                    variant={roach.variant}
                    direction={roach.direction}
                    size={54}
                    usePhotoCharacter={true}
                  />
                </foreignObject>
              </g>
            ))}

            {/* --- 7. REAL OGGY CAT IN ROUND FRAME (On Step Position + Jump Arc) --- */}
            <g
              transform={`translate(${playerX}, ${playerY + jumpOffset - 84})`}
              className={`select-none pointer-events-none ${isInvincible ? 'animate-pulse opacity-70' : 'opacity-100'}`}
            >
              {/* Ground Shadow on the step (stays on ground during jump) */}
              <ellipse
                cx="0"
                cy={88 - jumpOffset}
                rx={Math.max(16, 32 + jumpOffset * 0.4)}
                ry={Math.max(4, 9 + jumpOffset * 0.1)}
                fill="rgba(0,0,0,0.6)"
              />

              {/* Real Oggy Character in Round Frame */}
              <foreignObject x="-44" y="-8" width="88" height="96" className="overflow-visible">
                <OggySvgSprite
                  facing={playerFacing}
                  hasBucket={true}
                  hasWater={hasBucketWater}
                  isWalking={isWalking}
                  isInvincible={isInvincible}
                  size={84}
                  usePhotoCharacter={true}
                />
              </foreignObject>

              {/* Status Badge above Oggy */}
              <g transform="translate(0, -22)">
                <rect
                  x="-44"
                  y="-10"
                  width="88"
                  height="20"
                  rx="10"
                  fill={hasBucketWater ? '#0284C7' : isJumping ? '#10B981' : '#78350F'}
                  stroke="#FDE68A"
                  strokeWidth="1.5"
                  className="filter drop-shadow-md"
                />
                <text
                  x="0"
                  y="4"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="900"
                  textAnchor="middle"
                  className="font-mono tracking-tight"
                >
                  {hasBucketWater ? '💧 BUCKET FULL' : isJumping ? '🦘 JUMPING' : 'OGGY'}
                </text>
              </g>
            </g>
          </svg>

          {/* ================= IN-GAME HUD & METRICS ================= */}
          
          {/* Top-Left Progress Box */}
          <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
            {/* Tanka Fill Badge */}
            <div className="bg-[#1C1106]/95 border-2 border-[#D97706] px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#000] flex items-center gap-3">
              <Droplets className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#FDE68A] uppercase tracking-wider">Village Tanka</span>
                <span className="text-lg font-black text-white font-mono tracking-wider leading-none">
                  {String(tankWater).padStart(2, '0')}/{String(TARGET_WATER).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Timer Badge (Real Mode) or Practice Badge */}
            <div className="bg-[#1C1106]/95 border-2 border-[#D97706] px-4 py-1.5 rounded-2xl shadow-[3px_3px_0px_#000] flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FACC15]" />
              {gameMode === 'real' ? (
                <span className={`text-base font-black font-mono ${timeRemaining <= 15 ? 'text-rose-400 animate-ping' : 'text-white'}`}>
                  {String(timeRemaining).padStart(2, '0')}s
                </span>
              ) : (
                <span className="text-xs font-black text-emerald-400 font-mono uppercase">
                  PRACTICE (NO TIMER)
                </span>
              )}
            </div>

            {/* Lives Badge */}
            <div className="bg-[#1C1106]/95 border-2 border-[#D97706] px-3.5 py-1.5 rounded-2xl shadow-[3px_3px_0px_#000] flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <div className="flex items-center gap-1 ml-1">
                {[1, 2, 3].map((heartIndex) => (
                  <Heart
                    key={heartIndex}
                    className={`w-4 h-4 ${
                      heartIndex <= lives
                        ? 'text-rose-500 fill-rose-500 scale-100'
                        : 'text-stone-600 fill-stone-700 scale-90 opacity-40'
                    } transition-all`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top-Right Objective / Path Rules Box */}
          <div className="absolute top-4 right-4 z-30 hidden sm:flex flex-col bg-[#1C1106]/95 border-2 border-[#D97706] p-3 rounded-2xl shadow-[3px_3px_0px_#000] max-w-[230px] text-left">
            <span className="text-[11px] font-black text-[#FBBF24] uppercase tracking-wider block font-mono">
              BAORI CIRCULATION RULE
            </span>
            <div className="flex flex-col gap-1 mt-1 text-[10px] font-bold text-[#FEF3C7]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>CLIMB UP: Left Stairs</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>DESCEND DOWN: Right Stairs</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DODGE: Jump over Roaches</span>
              </div>
            </div>
          </div>

          {/* ================= MOBILE / TOUCH ON-SCREEN CONTROLS ================= */}
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
            {/* D-PAD DIRECTION KEYS */}
            <div className="grid grid-cols-3 gap-1 bg-[#1C1106]/90 p-2 rounded-2xl border-2 border-[#D97706] shadow-lg">
              <div />
              <button
                type="button"
                onMouseDown={() => {
                  keysPressed.current['arrowup'] = true;
                }}
                onMouseUp={() => {
                  keysPressed.current['arrowup'] = false;
                }}
                onTouchStart={() => {
                  keysPressed.current['arrowup'] = true;
                }}
                onTouchEnd={() => {
                  keysPressed.current['arrowup'] = false;
                }}
                className="w-10 h-10 bg-[#38200B] hover:bg-[#4E2D10] text-[#FEF3C7] rounded-xl flex items-center justify-center font-black active:scale-90 transition border border-[#D97706]"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />
              <button
                type="button"
                onMouseDown={() => {
                  keysPressed.current['arrowleft'] = true;
                }}
                onMouseUp={() => {
                  keysPressed.current['arrowleft'] = false;
                }}
                onTouchStart={() => {
                  keysPressed.current['arrowleft'] = true;
                }}
                onTouchEnd={() => {
                  keysPressed.current['arrowleft'] = false;
                }}
                className="w-10 h-10 bg-[#38200B] hover:bg-[#4E2D10] text-[#FEF3C7] rounded-xl flex items-center justify-center font-black active:scale-90 transition border border-[#D97706]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onMouseDown={() => {
                  keysPressed.current['arrowdown'] = true;
                }}
                onMouseUp={() => {
                  keysPressed.current['arrowdown'] = false;
                }}
                onTouchStart={() => {
                  keysPressed.current['arrowdown'] = true;
                }}
                onTouchEnd={() => {
                  keysPressed.current['arrowdown'] = false;
                }}
                className="w-10 h-10 bg-[#38200B] hover:bg-[#4E2D10] text-[#FEF3C7] rounded-xl flex items-center justify-center font-black active:scale-90 transition border border-[#D97706]"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                type="button"
                onMouseDown={() => {
                  keysPressed.current['arrowright'] = true;
                }}
                onMouseUp={() => {
                  keysPressed.current['arrowright'] = false;
                }}
                onTouchStart={() => {
                  keysPressed.current['arrowright'] = true;
                }}
                onTouchEnd={() => {
                  keysPressed.current['arrowright'] = false;
                }}
                className="w-10 h-10 bg-[#38200B] hover:bg-[#4E2D10] text-[#FEF3C7] rounded-xl flex items-center justify-center font-black active:scale-90 transition border border-[#D97706]"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* RIGHT TOUCH ACTION BUTTONS */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2.5">
            {/* Jump Button */}
            <button
              type="button"
              onClick={handleJump}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border-2 border-emerald-300 font-black text-sm shadow-[0_4px_0_#065F46] active:translate-y-1 active:shadow-none transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🦘</span>
              <span>JUMP</span>
            </button>

            {/* Fill / Pour Action Button */}
            <button
              type="button"
              onClick={handleActionButton}
              disabled={!isNearWater() && !(isNearTopTank() && hasBucketWater)}
              className={`px-5 py-3 rounded-2xl border-2 font-black text-sm shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition flex items-center gap-2 cursor-pointer ${
                isNearWater()
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-300 animate-pulse'
                  : isNearTopTank() && hasBucketWater
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300 animate-pulse'
                  : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>{hasBucketWater ? 'POUR WATER' : 'FILL BUCKET'}</span>
            </button>
          </div>
        </div>

        {/* ================= TUTORIAL COMPLETION MODAL ================= */}
        <AnimatePresence>
          {showTutorialFinishModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-[#231709] border-4 border-amber-500 p-6 rounded-3xl text-center shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3">
                  🎉
                </div>
                <h3 className="text-xl font-black text-amber-300 uppercase tracking-wide font-mono">
                  Tutorial Completed!
                </h3>
                <p className="text-sm font-medium text-amber-100 mt-2 leading-relaxed">
                  Shabaash! You mastered the authentic Rajasthani Baori workflow:
                </p>
                <div className="w-full bg-[#160E05] border border-amber-800/80 rounded-2xl p-3 my-3 text-left text-xs font-bold text-amber-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Climb UP using Left Stairs</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Pour water into the Village Tanka</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Descend DOWN using Right Stairs</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full mt-2">
                  <button
                    type="button"
                    onClick={() => handleResetLevel('tutorial')}
                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-black rounded-2xl border-2 border-stone-600 transition cursor-pointer text-xs"
                  >
                    🔄 Replay Tutorial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetLevel('real')}
                    className="flex-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl border-2 border-amber-200 shadow-lg active:scale-95 transition cursor-pointer text-sm font-mono flex items-center justify-center gap-2"
                  >
                    <span>🚀 START REAL GAME</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= SUCCESS MODAL (REAL MODE) ================= */}
        <AnimatePresence>
          {gameState === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-[#231709] border-4 border-amber-400 p-6 rounded-3xl text-center shadow-2xl flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-400/20 rounded-full border-3 border-amber-400 flex items-center justify-center text-4xl mb-3">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-amber-300 uppercase tracking-wide font-mono">
                  Stage Cleared!
                </h3>
                <p className="text-sm font-bold text-amber-100 mt-1">
                  You filled the Village Tanka with 7,500L of pure Baori rainwater!
                </p>

                {/* Score & Rewards */}
                <div className="grid grid-cols-2 gap-3 w-full my-4">
                  <div className="bg-[#180F05] p-3 rounded-2xl border border-amber-700/60">
                    <span className="text-[10px] font-black text-amber-400 uppercase">Coins Earned</span>
                    <p className="text-xl font-black text-white font-mono">+350 🪙</p>
                  </div>
                  <div className="bg-[#180F05] p-3 rounded-2xl border border-amber-700/60">
                    <span className="text-[10px] font-black text-amber-400 uppercase">Stars Rating</span>
                    <p className="text-xl font-black text-amber-400 font-mono">⭐⭐⭐</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => handleResetLevel('real')}
                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold rounded-2xl border-2 border-stone-600 transition cursor-pointer text-xs"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCompleteStage(350, 3);
                      if (onNextStage) {
                        onNextStage();
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl border-2 border-amber-200 shadow-lg active:scale-95 transition cursor-pointer text-sm font-mono flex items-center justify-center gap-2"
                  >
                    <span>Claim & Next Stage</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= GAME OVER MODAL ================= */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-[#231709] border-4 border-rose-600 p-6 rounded-3xl text-center shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-rose-600/20 rounded-full border-2 border-rose-500 flex items-center justify-center text-3xl mb-3">
                  💔
                </div>
                <h3 className="text-xl font-black text-rose-400 uppercase tracking-wide font-mono">
                  {failReason === 'time' ? "Time's Up!" : 'Out of Hearts!'}
                </h3>
                <p className="text-xs font-medium text-amber-100 mt-2">
                  {failReason === 'time'
                    ? 'The Thar sun set before the Tanka was filled. Try again!'
                    : 'The cockroaches knocked Oggy too many times. Jump over them on the stairs!'}
                </p>

                <div className="flex items-center gap-3 w-full mt-5">
                  <button
                    type="button"
                    onClick={() => handleResetLevel('tutorial')}
                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-2xl border-2 border-stone-600 transition cursor-pointer text-xs"
                  >
                    Try Tutorial First
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetLevel('real')}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl border-2 border-rose-300 shadow-lg active:scale-95 transition cursor-pointer text-sm font-mono flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
