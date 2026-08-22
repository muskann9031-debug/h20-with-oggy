import oggyImg from '../assets/images/oggy_character_action_1787315537222.jpg';
import jackImg from '../assets/images/jack_cat_builder_1787315595398.jpg';
import oliviaImg from '../assets/images/olivia_cat_garden_1787315608554.jpg';
import bobImg from '../assets/images/bob_bulldog_action_1787315578680.jpg';
import roachesImg from '../assets/images/cockroaches_mischief_1787315561517.jpg';

export interface CharacterInfo {
  id: 'oggy' | 'jack' | 'olivia' | 'bob' | 'cockroaches';
  name: string;
  role: string;
  avatarColor: string;
  badgeBg: string;
  badgeBorder: string;
  catchphrase: string;
  accentHex: string;
  image: string;
  emoji: string;
}

export const CHARACTERS: Record<string, CharacterInfo> = {
  oggy: {
    id: 'oggy',
    name: 'Oggy',
    role: 'Rooftop Catchment Hero',
    avatarColor: 'bg-sky-500 text-white',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-400',
    badgeBorder: 'border-sky-500',
    catchphrase: "Meow! Catch every drop before Joey & Dee Dee ruin the tank!",
    accentHex: '#0284C7',
    image: oggyImg,
    emoji: '🐱',
  },
  jack: {
    id: 'jack',
    name: 'Jack',
    role: 'Chief Hydro-Engineer',
    avatarColor: 'bg-lime-600 text-white',
    badgeBg: 'bg-lime-100 text-lime-900 border-lime-400',
    badgeBorder: 'border-lime-500',
    catchphrase: "Stand back, Oggy! I'm drilling straight into the sandstone aquifer!",
    accentHex: '#65A30D',
    image: jackImg,
    emoji: '😾',
  },
  olivia: {
    id: 'olivia',
    name: 'Olivia',
    role: 'Ecology & Flora Guardian',
    avatarColor: 'bg-pink-400 text-white',
    badgeBg: 'bg-pink-100 text-pink-900 border-pink-400',
    badgeBorder: 'border-pink-400',
    catchphrase: "Clean groundwater makes all our garden flowers bloom!",
    accentHex: '#EC4899',
    image: oliviaImg,
    emoji: '🌸',
  },
  bob: {
    id: 'bob',
    name: 'Bob',
    role: 'Tubewell Inspector Bulldog',
    avatarColor: 'bg-amber-800 text-white',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-500',
    badgeBorder: 'border-amber-700',
    catchphrase: "GRRR! Oggy, don't let my well dry out or I'll smash you!",
    accentHex: '#B45309',
    image: bobImg,
    emoji: '🐶',
  },
  cockroaches: {
    id: 'cockroaches',
    name: 'Joey, Dee Dee & Marky',
    role: 'Mischief Masters',
    avatarColor: 'bg-orange-500 text-white',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-400',
    badgeBorder: 'border-orange-500',
    catchphrase: "HEE-HEE-HEE! Clog the pipes, dump the sludge, steal the water!",
    accentHex: '#EA580C',
    image: roachesImg,
    emoji: '🪳',
  },
};
