import React from 'react';
import { 
  Bike, Leaf, Train, Utensils, Lightbulb, 
  TreePine, Globe, Shield, Star, Trophy, ShoppingBag, Flame, Sprout
} from 'lucide-react';

export type AchievementDefinition = {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  check: (profile: { streak?: number; ecoScore?: number; totalCO2Saved?: number } | null, activities: { category?: string }[]) => boolean;
};

export type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  unlocked: boolean;
};

const colors = [
  { g: 'from-purple-400 to-purple-600', s: 'shadow-[0_8px_20px_rgba(168,85,247,0.25)]' },
  { g: 'from-emerald-400 to-emerald-600', s: 'shadow-[0_8px_20px_rgba(16,185,129,0.25)]' },
  { g: 'from-amber-400 to-amber-600', s: 'shadow-[0_8px_20px_rgba(251,191,36,0.25)]' },
  { g: 'from-blue-400 to-blue-600', s: 'shadow-[0_8px_20px_rgba(59,130,246,0.25)]' },
  { g: 'from-rose-400 to-rose-600', s: 'shadow-[0_8px_20px_rgba(244,63,94,0.25)]' },
  { g: 'from-cyan-400 to-cyan-600', s: 'shadow-[0_8px_20px_rgba(34,211,238,0.25)]' },
  { g: 'from-indigo-400 to-indigo-600', s: 'shadow-[0_8px_20px_rgba(99,102,241,0.25)]' },
  { g: 'from-orange-400 to-orange-600', s: 'shadow-[0_8px_20px_rgba(249,115,22,0.25)]' },
  { g: 'from-teal-400 to-teal-600', s: 'shadow-[0_8px_20px_rgba(20,184,166,0.25)]' },
  { g: 'from-pink-400 to-pink-600', s: 'shadow-[0_8px_20px_rgba(236,72,153,0.25)]' }
];

function getTheme(index: number) {
  const theme = colors[index % colors.length];
  return theme || { g: 'from-purple-400 to-purple-600', s: 'shadow-[0_8px_20px_rgba(168,85,247,0.25)]' };
}

const sizeProps = { size: 18, strokeWidth: 2, className: "w-[18px] h-[18px]" };

export const achievementDefinitions: AchievementDefinition[] = [
  { 
    id: '1', 
    name: 'First Footprint', 
    desc: 'Log your first eco activity', 
    icon: <Sprout {...sizeProps} />, 
    gradient: getTheme(1).g, 
    shadow: getTheme(1).s,
    check: (_profile, activities) => activities.length >= 1
  },
  { 
    id: '2', 
    name: 'Eco Commuter', 
    desc: 'Log a transport activity', 
    icon: <Bike {...sizeProps} />, 
    gradient: getTheme(0).g, 
    shadow: getTheme(0).s,
    check: (_profile, activities) => activities.some(a => a.category?.toLowerCase() === 'transport')
  },
  { 
    id: '3', 
    name: 'Transit Titan', 
    desc: 'Log 3 transport activities', 
    icon: <Train {...sizeProps} />, 
    gradient: getTheme(3).g, 
    shadow: getTheme(3).s,
    check: (_profile, activities) => activities.filter(a => a.category?.toLowerCase() === 'transport').length >= 3
  },
  { 
    id: '4', 
    name: 'Plant Powered', 
    desc: 'Log a food activity', 
    icon: <Leaf {...sizeProps} />, 
    gradient: getTheme(1).g, 
    shadow: getTheme(1).s,
    check: (_profile, activities) => activities.some(a => a.category?.toLowerCase() === 'food')
  },
  { 
    id: '5', 
    name: 'Green Diet', 
    desc: 'Log 3 food activities', 
    icon: <Utensils {...sizeProps} />, 
    gradient: getTheme(7).g, 
    shadow: getTheme(7).s,
    check: (_profile, activities) => activities.filter(a => a.category?.toLowerCase() === 'food').length >= 3
  },
  { 
    id: '6', 
    name: 'Power Savior', 
    desc: 'Log an energy activity', 
    icon: <Lightbulb {...sizeProps} />, 
    gradient: getTheme(2).g, 
    shadow: getTheme(2).s,
    check: (_profile, activities) => activities.some(a => a.category?.toLowerCase() === 'energy')
  },
  { 
    id: '7', 
    name: 'Energy Ninja', 
    desc: 'Log 3 energy activities', 
    icon: <Flame {...sizeProps} />, 
    gradient: getTheme(7).g, 
    shadow: getTheme(7).s,
    check: (_profile, activities) => activities.filter(a => a.category?.toLowerCase() === 'energy').length >= 3
  },
  { 
    id: '8', 
    name: 'Thrift Shopper', 
    desc: 'Log a shopping activity', 
    icon: <ShoppingBag {...sizeProps} />, 
    gradient: getTheme(9).g, 
    shadow: getTheme(9).s,
    check: (_profile, activities) => activities.some(a => a.category?.toLowerCase() === 'shopping')
  },
  { 
    id: '9', 
    name: 'Streak Starter', 
    desc: 'Achieve a 3-day streak', 
    icon: <Flame {...sizeProps} />, 
    gradient: getTheme(7).g, 
    shadow: getTheme(7).s,
    check: (profile) => !!profile && (profile.streak ?? 0) >= 3
  },
  { 
    id: '10', 
    name: 'Persistent Planter', 
    desc: 'Achieve a 7-day streak', 
    icon: <TreePine {...sizeProps} />, 
    gradient: getTheme(1).g, 
    shadow: getTheme(1).s,
    check: (profile) => !!profile && (profile.streak ?? 0) >= 7
  },
  { 
    id: '11', 
    name: 'Eco Score Starter', 
    desc: 'Reach an Eco Score of 60', 
    icon: <Star {...sizeProps} />, 
    gradient: getTheme(2).g, 
    shadow: getTheme(2).s,
    check: (profile) => !!profile && (profile.ecoScore ?? 0) >= 60
  },
  { 
    id: '12', 
    name: 'Eco Warrior', 
    desc: 'Reach an Eco Score of 80', 
    icon: <Shield {...sizeProps} />, 
    gradient: getTheme(6).g, 
    shadow: getTheme(6).s,
    check: (profile) => !!profile && (profile.ecoScore ?? 0) >= 80
  },
  { 
    id: '13', 
    name: 'Super Saver', 
    desc: 'Save total 10kg CO₂', 
    icon: <Trophy {...sizeProps} />, 
    gradient: getTheme(2).g, 
    shadow: getTheme(2).s,
    check: (profile) => !!profile && (profile.totalCO2Saved ?? 0) >= 10
  },
  { 
    id: '14', 
    name: 'Carbon Conqueror', 
    desc: 'Save total 50kg CO₂', 
    icon: <Globe {...sizeProps} />, 
    gradient: getTheme(3).g, 
    shadow: getTheme(3).s,
    check: (profile) => !!profile && (profile.totalCO2Saved ?? 0) >= 50
  }
];
