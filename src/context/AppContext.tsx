import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { type User } from '@supabase/supabase-js';
import { calculateTransportEmissions, calculateFoodEmissions, calculateEnergyEmissions, calculateShoppingEmissions } from '../lib/carbonEngine';
import { achievementDefinitions, type Achievement } from '../data/achievements';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  ecoScore: number;
  totalCO2Saved: number;
  streak: number;
  goals: string[];
}

export interface Activity {
  id: string;
  category: string;
  title: string;
  co2Saved: number;
  date: string;
}

export interface Emission {
  id: string;
  category: string;
  amount: number;
  date: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

export interface NewActivityInput {
  category: string;
  title: string;
  co2Saved: number;
  co2Generated?: number | undefined;
  saved?: number | undefined;
}

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activities: Activity[];
  emissions: Emission[];
  addActivity: (activity: NewActivityInput) => Promise<void>;
  challenges: Challenge[];
  completeChallenge: (id: string) => Promise<void>;
  loading: boolean;
  achievements: Achievement[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('climeo_profile');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [activities, setActivities] = useState<Activity[]>(() => {
    const cached = localStorage.getItem('climeo_activities');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [emissions, setEmissions] = useState<Emission[]>(() => {
    const cached = localStorage.getItem('climeo_emissions');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const completeChallenge = useCallback(async (id: string) => {
    if (!user) return;

    // Find challenge to get points
    const challenge = challenges.find(c => c.id === id);
    const points = challenge ? challenge.points : 10;
    
    // Update local state
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, completed: true } : c));
    
    // Insert into user_challenges
    await supabase.from('user_challenges').insert([{
      user_id: user.id,
      challenge_id: id,
      status: 'completed',
      completed_at: new Date().toISOString()
    }]);

    // Update profile ecoScore locally and in Supabase
    if (profile) {
      const newScore = Math.min(100, profile.ecoScore + points);
      await supabase.from('profiles').update({ eco_score: newScore }).eq('id', user.id);
      
      setProfile(prev => {
        if (!prev) return null;
        const updatedProfile = { ...prev, ecoScore: newScore };
        localStorage.setItem('climeo_profile', JSON.stringify(updatedProfile));
        return updatedProfile;
      });
    }
  }, [user, challenges, profile]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id, true);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id, true);
      } else {
        setProfile(null);
        setActivities([]);
        setEmissions([]);
        localStorage.removeItem('climeo_profile');
        localStorage.removeItem('climeo_activities');
        localStorage.removeItem('climeo_emissions');
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Automatic Challenge Progress & Completion check
  useEffect(() => {
    if (!user || challenges.length === 0) return;

    const checkAndCompleteChallenges = async () => {
      // 1. Commute Green Challenge (ID: c1c1c1c1-1111-1111-1111-111111111111)
      const greenTransitCount = activities.filter(a => 
        a.category?.toLowerCase() === 'transport' && 
        (
          a.title?.toLowerCase().includes('cycle') || 
          a.title?.toLowerCase().includes('walk') || 
          a.title?.toLowerCase().includes('bus') || 
          a.title?.toLowerCase().includes('train') || 
          a.title?.toLowerCase().includes('ev')
        )
      ).length;

      const commuteGreenChall = challenges.find(c => c.id === 'c1c1c1c1-1111-1111-1111-111111111111');
      if (commuteGreenChall && !commuteGreenChall.completed && greenTransitCount >= 3) {
        console.log("Auto-completing Commute Green Challenge!");
        await completeChallenge('c1c1c1c1-1111-1111-1111-111111111111');
      }

      // 2. Plant-Based Feast Challenge (ID: c2c2c2c2-2222-2222-2222-222222222222)
      const plantMealCount = activities.filter(a => 
        a.category?.toLowerCase() === 'food' && 
        (
          a.title?.toLowerCase().includes('veg') || 
          a.title?.toLowerCase().includes('vegan') || 
          a.title?.toLowerCase().includes('vegetarian')
        )
      ).length;

      const plantFeastChall = challenges.find(c => c.id === 'c2c2c2c2-2222-2222-2222-222222222222');
      if (plantFeastChall && !plantFeastChall.completed && plantMealCount >= 3) {
        console.log("Auto-completing Plant-Based Feast Challenge!");
        await completeChallenge('c2c2c2c2-2222-2222-2222-222222222222');
      }

      // 3. Power Saver Challenge (ID: c3c3c3c3-3333-3333-3333-333333333333)
      const energySaveCount = activities.filter(a => 
        a.category?.toLowerCase() === 'energy' && 
        (
          a.title?.toLowerCase().includes('ac') || 
          a.title?.toLowerCase().includes('solar') || 
          a.title?.toLowerCase().includes('power') || 
          a.title?.toLowerCase().includes('appliances') || 
          a.title?.toLowerCase().includes('line-dried')
        )
      ).length;

      const powerSaverChall = challenges.find(c => c.id === 'c3c3c3c3-3333-3333-3333-333333333333');
      if (powerSaverChall && !powerSaverChall.completed && energySaveCount >= 3) {
        console.log("Auto-completing Power Saver Challenge!");
        await completeChallenge('c3c3c3c3-3333-3333-3333-333333333333');
      }
    };

    checkAndCompleteChallenges();
  }, [activities, challenges, user, completeChallenge]);

  async function fetchUserData(userId: string, showLoader = false) {
    if (showLoader) {
      setLoading(true);
    }
    try {
      // Fetch Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();

      // Fetch Activities
      const { data: actData } = await supabase.from('activities').select('*').eq('user_id', userId).order('date', { ascending: false });
      
      let totalSaved = 0;
      let mappedActs: Activity[] = [];
      if (actData) {
        mappedActs = actData.map(a => ({
          id: a.id,
          category: a.category,
          title: a.title,
          co2Saved: a.co2_amount || a.details?.co2Saved || a.details?.saved || 0,
          date: a.date || a.created_at
        }));
        setActivities(mappedActs);
        localStorage.setItem('climeo_activities', JSON.stringify(mappedActs));
        totalSaved = mappedActs.reduce((sum, act) => sum + act.co2Saved, 0);
      }

      // Fetch Carbon Calculations
      const { data: calcData } = await supabase.from('carbon_calculations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (calcData) {
        const mappedEmissions = calcData.map(c => ({
          id: c.id,
          category: c.category,
          amount: c.co2_amount || 0,
          date: c.created_at
        }));
        setEmissions(mappedEmissions);
        localStorage.setItem('climeo_emissions', JSON.stringify(mappedEmissions));
      }

      if (profileData) {
        const updatedProfile = {
          id: profileData.id,
          name: profileData.full_name || 'Eco Warrior',
          avatar_url: profileData.avatar_url,
          ecoScore: profileData.eco_score,
          totalCO2Saved: Number(totalSaved.toFixed(1)),
          streak: profileData.streak || 1,
          goals: ['Use public transport', 'Reduce meat consumption']
        };
        setProfile(updatedProfile);
        localStorage.setItem('climeo_profile', JSON.stringify(updatedProfile));
      } else {
        // Create initial profile using onboarding starting score if present
        const startingScoreStr = localStorage.getItem('climeo_starting_score') || '50';
        const startingScore = parseInt(startingScoreStr, 10);
        localStorage.removeItem('climeo_starting_score');

        // Fetch auth user metadata to retrieve registered name (e.g. from Google Sign In or Email Sign Up)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const metaName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'Eco Warrior';

        const { data: newProfile } = await supabase.from('profiles').insert([{ id: userId, full_name: metaName, eco_score: startingScore }]).select().single();
        if (newProfile) {
          const updatedProfile = {
            id: newProfile.id,
            name: newProfile.full_name,
            avatar_url: newProfile.avatar_url,
            ecoScore: newProfile.eco_score,
            totalCO2Saved: Number(totalSaved.toFixed(1)),
            streak: 1,
            goals: []
          };
          setProfile(updatedProfile);
          localStorage.setItem('climeo_profile', JSON.stringify(updatedProfile));
        }
      }

      // Fetch user completed challenges
      const { data: userChallData } = await supabase
        .from('user_challenges')
        .select('challenge_id')
        .eq('user_id', userId)
        .eq('status', 'completed');
      
      const completedChallengeIds = new Set(userChallData?.map(uc => uc.challenge_id) || []);

      // Fetch Challenges
      const { data: challData } = await supabase.from('challenges').select('*');
      let mappedChallenges: Challenge[] = [];
      if (challData && challData.length > 0) {
        mappedChallenges = challData.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          points: c.points,
          completed: completedChallengeIds.has(c.id)
        }));
      } else {
        // Fallback seeded challenges in memory
        const fallbackChallenges = [
          {
            id: 'c1c1c1c1-1111-1111-1111-111111111111',
            title: "Commute Green",
            description: "Log 3 public transport or cycling trips to reduce your transit emissions.",
            category: "transport",
            points: 30
          },
          {
            id: 'c2c2c2c2-2222-2222-2222-222222222222',
            title: "Plant-Based Feast",
            description: "Eat and log 3 vegetarian or vegan meals to cut down beef/meat carbon load.",
            category: "food",
            points: 40
          },
          {
            id: 'c3c3c3c3-3333-3333-3333-333333333333',
            title: "Power Saver",
            description: "Log 3 energy saving actions (like turning off AC or using solar power).",
            category: "energy",
            points: 50
          }
        ];
        mappedChallenges = fallbackChallenges.map(c => ({
          ...c,
          completed: completedChallengeIds.has(c.id)
        }));
      }
      setChallenges(mappedChallenges);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }

  const addActivity = async (activityInputs: NewActivityInput) => {
    if (!user) return;
    
    // 1. Calculate CO2 based on category using carbonEngine
    let co2Generated: number;
    if (activityInputs.co2Generated !== undefined) {
      co2Generated = activityInputs.co2Generated;
    } else {
      const cat = activityInputs.category?.toLowerCase() || '';
      if (cat === 'transport') co2Generated = calculateTransportEmissions('car', 10); 
      else if (cat === 'food') co2Generated = calculateFoodEmissions('chicken', 1);
      else if (cat === 'energy') co2Generated = calculateEnergyEmissions('electricity', 8);
      else if (cat === 'shopping') co2Generated = calculateShoppingEmissions('clothing', 1);
      else co2Generated = 2.5; // fallback for waste/other
    }

    // 2. Insert into activities
    const co2SavedValue = activityInputs.co2Saved || activityInputs.saved || 0;
    const { data: newAct, error: actErr } = await supabase.from('activities').insert([{
      user_id: user.id,
      category: activityInputs.category.toLowerCase(),
      title: activityInputs.title || `Logged ${activityInputs.category}`,
      details: activityInputs,
      co2_amount: co2SavedValue
    }]).select().single();

    if (actErr) {
      console.error("Error inserting activity:", actErr);
      throw new Error(`Failed to log activity: ${actErr.message}`);
    }

    // 3. Insert into carbon_calculations
    const { error: calcErr } = await supabase.from('carbon_calculations').insert([{
      activity_id: newAct.id,
      user_id: user.id,
      category: activityInputs.category.toLowerCase(),
      co2_amount: co2Generated,
      calculation_details: activityInputs
    }]);

    if (calcErr) {
      console.error("Error inserting carbon calculation:", calcErr);
      throw new Error(`Failed to record carbon calculation: ${calcErr.message}`);
    }

    // 4. Update Profile EcoScore and totalCO2Saved dynamically
    if (profile) {
      const co2SavedValue = activityInputs.co2Saved || activityInputs.saved || 0;
      const newScore = Math.min(100, profile.ecoScore + Math.round(co2SavedValue * 4));
      
      // Update Supabase profiles table
      const { error: profErr } = await supabase.from('profiles').update({ eco_score: newScore }).eq('id', user.id);
      if (profErr) {
        console.error("Error updating profile eco_score:", profErr);
        throw new Error(`Failed to update profile eco score: ${profErr.message}`);
      }
      
      // Update local profile state immediately
      setProfile(prev => {
        if (!prev) return null;
        const updatedTotalSaved = Number((prev.totalCO2Saved + co2SavedValue).toFixed(1));
        return {
          ...prev,
          ecoScore: newScore,
          totalCO2Saved: updatedTotalSaved
        };
      });
    }

    await fetchUserData(user.id);
  };


  const achievements = useMemo<Achievement[]>(() => {
    return achievementDefinitions.map(def => ({
      id: def.id,
      name: def.name,
      desc: def.desc,
      icon: def.icon,
      gradient: def.gradient,
      shadow: def.shadow,
      unlocked: def.check(profile, activities)
    }));
  }, [profile, activities]);

  return (
    <AppContext.Provider value={{ user, profile, setProfile, activities, emissions, addActivity, challenges, completeChallenge, loading, achievements }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
