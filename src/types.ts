export interface StageChallengeOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface RoadTripStage {
  id: number;
  state: string;
  city: string;
  title: string;
  subtitle: string;
  landmark: string;
  coords: { x: number; y: number }; // Relative coordinate on India Map viewBox
  transportType: 'rickshaw' | 'train' | 'jeep' | 'cruiser';
  transportLabel: string;
  character: 'oggy' | 'jack' | 'olivia' | 'bob' | 'cockroaches';
  dialogue: string;
  story: string;
  scienceFact: string;
  whyItMatters: string;
  rewardCoins: number;
  waterRechargeLiters: number;
  aquiferTableGain: number; // in meters (e.g. +2.0m)
  interactiveMission: {
    badge: string;
    missionTitle: string;
    description: string;
    miniGameType: 'roof_catcher' | 'stepwell_clean' | 'filter_layer' | 'cascade_link' | 'coastal_barrier';
    question: string;
    options: StageChallengeOption[];
  };
}

export interface PlayerProgress {
  currentStage: number; // 1 to 5
  unlockedStages: number[];
  completedStages: number[];
  stageStars: Record<number, number>; // 1 to 3 stars per stage
  coins: number;
  lives: number; // Max 5 lives
  waterHarvestedLiters: number;
  aquiferDepthMeters: number; // Starts at 12.0m (critical dry), improves to 2.0m (pristine full)
  activeVehiclePosition: { x: number; y: number };
  isAnimatingVehicle: boolean;
}

export interface SoundSettings {
  muted: boolean;
  volume: number;
}

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  category: 'streak' | 'harvest' | 'explorer' | 'mastery';
  unlockedDate?: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardWater: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: 'oggy' | 'jack' | 'olivia' | 'bob';
  streakDays: number;
  bestStreak: number;
  lastClaimDate: string; // YYYY-MM-DD
  streakHistory: Array<{ day: string; dayIndex: number; claimed: boolean; date: string }>;
  rankTitle: string;
  rankLevel: number;
  xp: number;
  xpToNextLevel: number;
  joinedDate: string;
  badges: UserBadge[];
  dailyMissions: DailyMission[];
  isLoggedIn: boolean;
}
