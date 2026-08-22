import { UserProfile, UserBadge, DailyMission } from '../types';

export const STATIC_CREDENTIALS = [
  {
    username: 'hydro_hero',
    password: 'oggywater123',
    name: 'Hydro Hero Oggy',
    avatar: 'oggy' as const,
    rank: 'Groundwater Master Guardian',
    streak: 5,
  },
  {
    username: 'oggy_cat',
    password: 'water2026',
    name: 'Oggy The Explorer',
    avatar: 'oggy' as const,
    rank: 'Aquifer Apprentice',
    streak: 3,
  },
  {
    username: 'jack_builder',
    password: 'builderjack123',
    name: 'Jack Hydro-Engineer',
    avatar: 'jack' as const,
    rank: 'Deep Sandstone Driller',
    streak: 7,
  },
];

export const INITIAL_BADGES: UserBadge[] = [
  {
    id: 'badge-1',
    name: 'Himalayan Kul Scout',
    icon: '🏔️',
    description: 'Guided glacial runoff through Himalayan mountain kuls with 0% wastage.',
    unlocked: true,
    category: 'explorer',
    unlockedDate: '2026-08-18',
  },
  {
    id: 'badge-2',
    name: 'Bawadi Stepwell Master',
    icon: '🏛️',
    description: 'Cleared desert stepwell silt and restored ancient groundwater filtration.',
    unlocked: true,
    category: 'harvest',
    unlockedDate: '2026-08-19',
  },
  {
    id: 'badge-3',
    name: 'Bamboo Drip Pioneer',
    icon: '🎋',
    description: 'Engineered Khasi hills gravity bamboo cascade irrigation in Meghalaya.',
    unlocked: true,
    category: 'mastery',
    unlockedDate: '2026-08-20',
  },
  {
    id: 'badge-4',
    name: '5-Day Streak Champion',
    icon: '🔥',
    description: 'Logged in and protected groundwater aquifers 5 days in a row.',
    unlocked: true,
    category: 'streak',
    unlockedDate: '2026-08-21',
  },
  {
    id: 'badge-5',
    name: 'Roach Deflector Pro',
    icon: '🪳',
    description: 'Swatted 20 cockroaches before they contaminated clean harvesting recharge pits.',
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'badge-6',
    name: 'Aquifer Pristine Level',
    icon: '🌊',
    description: 'Raised deep underground water table to top 2.0 meters depth.',
    unlocked: false,
    category: 'harvest',
  },
];

export const INITIAL_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'mission-1',
    title: 'Daily Groundwater Check-in',
    description: 'Visit the India Road Trip and monitor the regional water tables.',
    target: 1,
    current: 1,
    rewardCoins: 50,
    rewardWater: 100,
    completed: true,
    claimed: false,
    icon: '💧',
  },
  {
    id: 'mission-2',
    title: 'Harvest 500 Liters',
    description: 'Play any interactive harvesting mini-game and collect 500L clean rainwater.',
    target: 500,
    current: 350,
    rewardCoins: 80,
    rewardWater: 200,
    completed: false,
    claimed: false,
    icon: '🪣',
  },
  {
    id: 'mission-3',
    title: 'Swat Mischievous Cockroaches',
    description: 'Block Joey, Dee Dee, and Marky from tampering with rainwater filters.',
    target: 5,
    current: 3,
    rewardCoins: 60,
    rewardWater: 150,
    completed: false,
    claimed: false,
    icon: '⚡',
  },
];

export const generateDefaultProfile = (username = 'hydro_hero'): UserProfile => {
  const matched = STATIC_CREDENTIALS.find((c) => c.username.toLowerCase() === username.toLowerCase());
  const streak = matched ? matched.streak : 5;
  const avatar = matched ? matched.avatar : 'oggy';
  const displayName = matched ? matched.name : 'Hydro Hero Oggy';
  const rank = matched ? matched.rank : 'Groundwater Master Guardian';

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = 4; // Friday in current cycle

  const streakHistory = days.map((day, idx) => ({
    day,
    dayIndex: idx,
    claimed: idx < streak % 7 || (streak >= 7 && idx <= todayIdx),
    date: `Day ${idx + 1}`,
  }));

  return {
    id: 'user-hydro-001',
    username: username || 'hydro_hero',
    displayName,
    avatar,
    streakDays: streak,
    bestStreak: Math.max(streak, 7),
    lastClaimDate: '2026-08-21',
    streakHistory,
    rankTitle: rank,
    rankLevel: 4,
    xp: 2850,
    xpToNextLevel: 3500,
    joinedDate: 'August 2026',
    badges: INITIAL_BADGES,
    dailyMissions: INITIAL_DAILY_MISSIONS,
    isLoggedIn: true,
  };
};
