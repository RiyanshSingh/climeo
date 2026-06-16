import { useState, useMemo } from 'react';
import { 
  Bell, ChevronRight, Zap, Check, MessageSquare, Bike, Leaf, Sparkles, 
  Activity, Flame, Car, Train, Footprints, Sun, Minus, Plus, Utensils, 
  X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

interface Recommendation {
  text: string;
  category: string;
}

const recommendations: Recommendation[] = [
  { text: "Ride a bike for short trips instead of driving to save 2.1 kg of CO₂.", category: "transport" },
  { text: "Use buses or trains to cut down your travel pollution by 70%.", category: "transport" },
  { text: "Share car rides with others to save 15 kg of CO₂ every month.", category: "transport" },
  { text: "Walk for short distances to keep your carbon footprint at zero.", category: "transport" },
  { text: "Eat a meal without meat today to save 1.8 kg of CO₂.", category: "food" },
  { text: "Finish all your food to save 300 kg of CO₂ every year.", category: "food" },
  { text: "Buy food grown near your home to stop transport pollution.", category: "food" },
  { text: "Turn off the AC or heater when you leave a room to save 15% energy.", category: "energy" },
  { text: "Dry clothes in the sun instead of a machine to save 100% laundry carbon.", category: "energy" },
  { text: "Change to LED bulbs to use 75% less electricity for lights.", category: "energy" },
  { text: "Use cloth bags instead of plastic bags when you go shopping.", category: "shopping" },
  { text: "Buy used clothes instead of new ones to cut clothing waste by 80%.", category: "shopping" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, loading, user, addActivity, emissions, achievements, activities } = useAppContext();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [tipFade] = useState(false);

  // --- Modal Configs ---
  const [modalCategory, setModalCategory] = useState<'Transport' | 'Food' | 'Energy' | null>(null);
  
  // Transport Sub-state
  const [transitType, setTransitType] = useState<'cycle' | 'walk' | 'bus' | 'train' | 'ev' | 'suv'>('cycle');
  const [transitDistance, setTransitDistance] = useState<number>(5);

  // Food Sub-state
  const [foodType, setFoodType] = useState<'vegan' | 'vegetarian' | 'chicken' | 'beef'>('vegetarian');
  const [foodQuantity, setFoodQuantity] = useState<number>(1);

  // Energy Sub-state
  const [energyType, setEnergyType] = useState<'ac' | 'solar'>('ac');
  const [energyValue, setEnergyValue] = useState<number>(4);

  // Set personalized suggestion once on mount/activities load
  const currentTip = useMemo(() => {
    if (!activities || activities.length === 0) {
      return "Swap driving for a bike on short runs to save 2.1 kg of CO₂.";
    }
    const loggedCategories = new Set(activities.map(a => a.category?.toLowerCase()));
    let pool = recommendations.filter(r => !loggedCategories.has(r.category));
    if (pool.length === 0) {
      pool = recommendations;
    }
    const idx = activities.length % pool.length;
    const item = pool[idx];
    return item ? item.text : "Swap driving for a bike on short runs to save 2.1 kg of CO₂.";
  }, [activities]);

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\d+(?:\.\d+)?\s*(?:kg of CO₂|kg|%|grams))/g);
    return parts.map((part, index) => {
      const isMatch = /(\d+(?:\.\d+)?\s*(?:kg of CO₂|kg|%|grams))/.test(part);
      return isMatch ? (
        <span key={index} className="font-extrabold text-emerald-400">{part}</span>
      ) : (
        part
      );
    });
  };

  const currentMonthEmissions = useMemo(() => {
    if (!emissions) return 0;
    const filterDate = new Date();
    filterDate.setDate(new Date().getDate() - 30);
    return Math.round(
      emissions
        .filter(e => new Date(e.date) >= filterDate)
        .reduce((sum, e) => sum + e.amount, 0)
    );
  }, [emissions]);

  // Dynamic live calculations inside modal
  const modalImpact = useMemo(() => {
    if (!modalCategory) return { emitted: 0, saved: 0, title: '', baseline: 0, suvKmSaved: 0 };
    
    let emitted = 0;
    let saved = 0;
    let title = '';
    let baseline = 0;
    
    if (modalCategory === 'Transport') {
      let factor = 0;
      if (transitType === 'cycle' || transitType === 'walk') factor = 0;
      else if (transitType === 'bus') factor = 0.08;
      else if (transitType === 'train') factor = 0.04;
      else if (transitType === 'ev') factor = 0.05;
      else if (transitType === 'suv') factor = 0.25;
      
      emitted = factor * transitDistance;
      baseline = 0.25 * transitDistance; // Gas SUV Baseline
      saved = Math.max(0, baseline - emitted);
      
      const label = {
        cycle: 'Cycled',
        walk: 'Walked',
        bus: 'Took bus',
        train: 'Took train',
        ev: 'Drove EV',
        suv: 'Drove Gas SUV'
      }[transitType];
      title = `${label} ${transitDistance} km`;
    } else if (modalCategory === 'Food') {
      let factor = 0;
      if (foodType === 'vegan') factor = 1.0;
      else if (foodType === 'vegetarian') factor = 1.5;
      else if (foodType === 'chicken') factor = 3.5;
      else if (foodType === 'beef') factor = 10.0;
      
      emitted = factor * foodQuantity;
      baseline = 10.0 * foodQuantity; // Beef baseline
      saved = Math.max(0, baseline - emitted);
      
      const label = {
        vegan: 'vegan meal',
        vegetarian: 'vegetarian meal',
        chicken: 'chicken meal',
        beef: 'beef meal'
      }[foodType];
      title = `Ate ${foodQuantity} ${label}${foodQuantity > 1 ? 's' : ''}`;
    } else if (modalCategory === 'Energy') {
      if (energyType === 'ac') {
        emitted = 0;
        baseline = 1.2 * energyValue;
        saved = baseline;
        title = `Turned off AC for ${energyValue} hr${energyValue > 1 ? 's' : ''}`;
      } else {
        emitted = 0;
        baseline = 0.82 * energyValue;
        saved = baseline;
        title = `Saved ${energyValue} kWh grid electricity via Solar`;
      }
    }
    
    // Net CO2 saved translates to equivalent Gas SUV km not driven
    // Standard SUV emission = 0.25 kg/km
    const suvKmSaved = Number((saved / 0.25).toFixed(1));
    
    return {
      emitted: Number(emitted.toFixed(2)),
      saved: Number(saved.toFixed(2)),
      title,
      baseline: Number(baseline.toFixed(2)),
      suvKmSaved
    };
  }, [modalCategory, transitType, transitDistance, foodType, foodQuantity, energyType, energyValue]);

  // Only show the loading state if we do not have cached profile data yet
  if (loading && !profile) {
    return (
      <div className="flex flex-col justify-center items-center h-full bg-gradient-to-b from-eco-green-light via-eco-bg to-white px-6 text-center">
        {/* Pulsing Leaf Loader */}
        <div className="w-16 h-16 bg-white/80 rounded-full flex justify-center items-center text-eco-green shadow-lg border border-white/50 animate-pulse mb-4">
          <Leaf size={30} className="animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="text-[15px] font-extrabold text-gray-800 tracking-tight">Syncing with Climeo...</h3>
        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mt-1">Updating your green footprint</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleQuickLog = async (category: string, title: string, co2Saved: number, co2Generated?: number) => {
    try {
      setToastType('success');
      await addActivity({ category, title, co2Saved, co2Generated });
      setToastMessage(`Logged: ${title} (+${co2Saved} kg saved)`);
      setShowToast(true);
      setModalCategory(null);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setToastType('error');
      setToastMessage(errorMsg || 'Failed to log activity.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleBadgeClick = (badge: typeof achievements[0]) => {
    const status = badge.unlocked ? "Unlocked" : "Locked";
    setToastType('success');
    setToastMessage(`${status}: ${badge.name} - ${badge.desc}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getSliderStyle = (val: number, min: number, max: number, color: string) => {
    const ratio = (val - min) / (max - min);
    const calcPosition = `calc(${ratio} * (100% - 20px) + 10px)`;
    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} ${calcPosition}, #E5E7EB ${calcPosition}, #E5E7EB 100%)`
    };
  };

  return (
    <div className="px-6 pt-12 pb-28 relative h-full overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button 
          className="flex items-center gap-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-0.5" 
          onClick={() => navigate('/profile')}
          aria-label="View Profile"
        >
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}&backgroundColor=b6e3f4`} 
            alt={profile.name} 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <h2 className="text-lg font-bold text-gray-900">
            {(() => {
              const h = new Date().getHours();
              if (h < 12) return 'Morning';
              if (h < 18) return 'Afternoon';
              return 'Evening';
            })()}, {profile.name.split(' ')[0]}
          </h2>
        </button>
        <button aria-label="View notifications" className="bg-white/50 p-2 rounded-full backdrop-blur-md shadow-sm border border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <Bell size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Your Impact Card */}
      <div className="glass-card p-5 mb-8 relative overflow-hidden bg-gradient-to-br from-[#E8F8EA] to-white">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Total CO₂ Saved</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-gray-900">{profile.totalCO2Saved}</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">kg CO<sub className="text-[10px]">2</sub></p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF7ED] border border-[#FED7AA]/50 rounded-full text-[11px] font-extrabold text-[#EA580C] shadow-[0_2px_8px_rgba(234,88,12,0.06)] w-max">
          <Flame size={13} className="text-[#F97316] fill-[#F97316]/20 animate-pulse" /> {profile.streak} Day Streak
        </span>

        {/* Decorative Penguin */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-95 drop-shadow-xl pointer-events-none">
           <img src="/penguine.png" alt="Eco Mascot" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Your Snapshot */}
      <div className="mb-4 flex justify-between items-end">
        <h3 className="text-base font-bold text-gray-900">Your Snapshot</h3>
        <button className="text-sm text-[#3B8B5D] font-bold" onClick={() => navigate('/impact')}>See details</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Footprint Card */}
        <div className="glass-card p-4 flex flex-col justify-between h-36">
          <div className="w-12 h-12 flex justify-start items-center mb-1">
            <img src="/foot.png" alt="Carbon Footprint" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Carbon Footprint</p>
            <p className="text-xl font-bold text-gray-900">{currentMonthEmissions}</p>
            <p className="text-xs text-gray-500">kg CO<sub className="text-[10px]">2</sub> this month</p>
          </div>
        </div>

        {/* Eco Score Card */}
        <button 
          className="glass-card p-4 flex flex-col justify-between h-36 cursor-pointer hover:bg-white/90 transition-colors text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
          onClick={() => navigate('/challenges')}
          aria-label="View Eco Score and Challenges"
        >
          <div className="w-12 h-12 flex justify-start items-center mb-1">
            <img src="/ecoscore.png" alt="Eco Score" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Eco Score</p>
            <p className="text-xl font-bold text-gray-900">{profile.ecoScore}</p>
            <p className="text-xs text-[#4E9B6B] font-medium">Top 15%</p>
          </div>
        </button>
      </div>

      {/* Quick Eco Actions - Slider Redesign */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">Quick Action Log</h3>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Tactile parameter settings</p>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 flex items-center gap-1"><Zap size={10} className="fill-[#10B981] text-[#10B981]"/> Configure</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Bike Action */}
          <button 
            onClick={() => { setModalCategory('Transport'); setTransitType('cycle'); }} 
            className="group relative flex flex-col items-center p-4 rounded-[24px] bg-white border border-gray-100/80 hover:border-emerald-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1 active:translate-y-0 transition-all duration-500 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full blur-[30px] opacity-0 group-hover:opacity-60 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 flex justify-center items-center group-hover:scale-110 transition-transform duration-500 ease-out mb-3 shadow-sm border border-white relative z-10">
              <Bike size={20} strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-semibold text-gray-800 mb-1 relative z-10">Log Transit</span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md relative z-10">Config</span>
          </button>
          
          {/* Veg Meal Action */}
          <button 
            onClick={() => { setModalCategory('Food'); setFoodType('vegetarian'); }} 
            className="group relative flex flex-col items-center p-4 rounded-[24px] bg-white border border-gray-100/80 hover:border-emerald-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1 active:translate-y-0 transition-all duration-500 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-[30px] opacity-0 group-hover:opacity-60 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex justify-center items-center group-hover:scale-110 transition-transform duration-500 ease-out mb-3 shadow-sm border border-white relative z-10">
              <Leaf size={20} strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-semibold text-gray-800 mb-1 relative z-10">Log Diet</span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md relative z-10">Config</span>
          </button>

          {/* Energy Action */}
          <button 
            onClick={() => { setModalCategory('Energy'); setEnergyType('ac'); }} 
            className="group relative flex flex-col items-center p-4 rounded-[24px] bg-white border border-gray-100/80 hover:border-emerald-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1 active:translate-y-0 transition-all duration-500 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-[30px] opacity-0 group-hover:opacity-60 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-amber-50 to-amber-100 text-amber-500 flex justify-center items-center group-hover:scale-110 transition-transform duration-500 ease-out mb-3 shadow-sm border border-white relative z-10">
              <Zap size={20} strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-semibold text-gray-800 mb-1 relative z-10">Log Power</span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md relative z-10">Config</span>
          </button>
        </div>
      </div>

      {/* AI Coach Live Insight - Ultra Premium Dark Card */}
      <div className="mb-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-[32px] group hover:shadow-[0_16px_50px_rgba(16,185,129,0.15)] transition-shadow duration-500">
        
        {/* Abstract Glow Effects */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none"></div>
        
        {/* Card Header */}
        <div className="flex justify-between items-center mb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Premium AI Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-emerald-400 to-emerald-600 flex justify-center items-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/10">
                <Sparkles size={20} className="animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-[15px] font-bold text-white tracking-tight block">Climeo AI Coach</span>
              <span className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase block font-medium">Active Analysis</span>
            </div>
          </div>
        </div>

        {/* Conversation Bubble */}
        <div className={`relative bg-white/10 backdrop-blur-md border border-white/10 p-4.5 rounded-[20px] mb-5 shadow-sm z-10 transition-all duration-300 ${tipFade ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}>
          <p className="text-[13px] text-gray-200 leading-relaxed font-medium">
            {renderHighlightedText(currentTip)}
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/ai-coach')} 
          className="w-full flex justify-between items-center text-[13px] font-bold text-[#0F172A] bg-white hover:bg-gray-50 py-3.5 px-5 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer relative z-10"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare size={16} />
            <span>Chat with AI Coach</span>
          </div>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Try Carbon Twin - Sleek Modern Link */}
      <div className="mb-8 group">
        <button 
          className="w-full bg-white p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50/80 transition-colors border border-gray-100/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[24px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
          onClick={() => navigate('/simulator')}
          aria-label="Open Carbon Twin Simulator"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-indigo-50 to-indigo-100/60 flex justify-center items-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out border border-indigo-50">
              <Activity size={22} strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-[15px] block tracking-tight">Carbon Twin Simulator</span>
              <span className="text-[12px] text-gray-500 font-medium block">Predict your future impacts</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex justify-center items-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </button>
      </div>

      {/* Achievements / Badges Shelf - Premium Redesign */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">Achievements</h3>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Your unlocked milestones</p>
          </div>
          <button onClick={() => navigate('/profile')} className="text-[12px] font-bold text-[#10B981] hover:text-emerald-700 transition-colors">View All</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x px-1">
          {achievements.filter(badge => badge.unlocked).length > 0 ? (
            achievements.filter(badge => badge.unlocked).map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center shrink-0 snap-start w-[72px] group">
                {/* Unlocked State */}
                <button 
                  onClick={() => handleBadgeClick(badge)} 
                  className={`relative w-[56px] h-[56px] rounded-[18px] bg-gradient-to-br ${badge.gradient} flex justify-center items-center text-white hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-2 border-[1.5px] border-white/20 [&>svg]:w-[22px] [&>svg]:h-[22px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
                  aria-label={`View milestone: ${badge.name}`}
                >
                  {badge.icon}
                  {/* Premium checkmark */}
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-sm flex justify-center items-center text-emerald-500 border border-emerald-50">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </button>
                <span className="text-[11px] font-semibold text-center w-full tracking-tight text-gray-900 truncate px-0.5">
                  {badge.name}
                </span>
                <span className="text-[9px] text-gray-400 font-medium text-center mt-0.5 truncate w-full px-0.5">
                  {badge.desc}
                </span>
              </div>
            ))
          ) : (
            <div className="text-[12px] text-gray-400 font-medium py-3 px-1">
              No milestones unlocked yet. Start tracking to earn badges!
            </div>
          )}
        </div>
      </div>

      {/* Premium Glassmorphic Modal */}
      {modalCategory && (
        <div className="fixed inset-0 backdrop-blur-md z-[150] flex items-end justify-center animate-fade-in" onClick={() => setModalCategory(null)}>
          <div 
            className="bg-white/80 backdrop-blur-2xl border border-white/45 rounded-t-[36px] w-full max-w-[406px] p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide relative z-[160]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-5"></div>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[17px] font-bold text-gray-900">Configure {modalCategory} Log</h3>
              <button 
                onClick={() => setModalCategory(null)} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal fields based on category */}
            <div className="space-y-6 mb-6">
              
              {/* Transport */}
              {modalCategory === 'Transport' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Transit Type</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { type: 'cycle', label: 'Cycle', icon: Bike, percent: '-100%', color: 'text-teal-600 bg-teal-50 border-teal-100' },
                        { type: 'walk', label: 'Walk', icon: Footprints, percent: '-100%', color: 'text-purple-600 bg-purple-50 border-purple-100' },
                        { type: 'bus', label: 'Bus', icon: Train, percent: '-68%', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                        { type: 'train', label: 'Train', icon: Train, percent: '-84%', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { type: 'ev', label: 'EV Car', icon: Sparkles, percent: '-80%', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { type: 'suv', label: 'SUV Drive', icon: Car, percent: 'Base', color: 'text-rose-600 bg-rose-50 border-rose-100' }
                      ].map(opt => {
                        const isSel = transitType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            onClick={() => setTransitType(opt.type as 'cycle' | 'walk' | 'bus' | 'train' | 'ev' | 'suv')}
                            className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 cursor-pointer focus:outline-none ${
                              isSel 
                                ? `${opt.color} border-2 font-bold shadow-lg scale-105 -translate-y-0.5` 
                                : 'border-gray-200/60 bg-white/40 text-gray-500 hover:bg-white/80'
                            }`}
                          >
                            <opt.icon size={18} className="mb-1" />
                            <span className="text-[10px] font-bold block">{opt.label}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full mt-1.5 ${
                              isSel 
                                ? 'bg-white/85' 
                                : opt.type === 'suv' 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {opt.percent}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                      <label htmlFor="modal-transit-distance" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distance Traveled</label>
                      <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">{transitDistance} km</span>
                    </div>
                    <input 
                      id="modal-transit-distance"
                      type="range" min="1" max="50" step="1" value={transitDistance}
                      onChange={(e) => setTransitDistance(Number(e.target.value))}
                      style={getSliderStyle(transitDistance, 1, 50, '#10B981')}
                      className="w-full h-2 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#10B981]"
                    />
                  </div>
                </>
              )}

              {/* Food */}
              {modalCategory === 'Food' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Meal Selection</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { type: 'vegan', label: 'Vegan Meal', desc: '1.0 kg CO₂', percent: '-90%', icon: Leaf, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { type: 'vegetarian', label: 'Vegetarian', desc: '1.5 kg CO₂', percent: '-85%', icon: Utensils, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                        { type: 'chicken', label: 'Chicken', desc: '3.5 kg CO₂', percent: '-65%', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { type: 'beef', label: 'Beef Meal', desc: '10.0 kg CO₂', percent: 'Base', icon: Utensils, color: 'text-rose-600 bg-rose-50 border-rose-100' }
                      ].map(opt => {
                        const isSel = foodType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            onClick={() => setFoodType(opt.type as 'vegan' | 'vegetarian' | 'chicken' | 'beef')}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer focus:outline-none text-left ${
                              isSel 
                                ? `${opt.color} border-2 font-bold shadow-lg scale-[1.03] -translate-y-0.5` 
                                : 'border-gray-200/60 bg-white/40 text-gray-600 hover:bg-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <opt.icon size={18} className="shrink-0" />
                              <div>
                                <span className="text-[11px] font-bold block leading-snug">{opt.label}</span>
                                <span className="text-[9px] opacity-75 font-semibold block leading-none mt-0.5">{opt.desc}</span>
                              </div>
                            </div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isSel 
                                ? 'bg-white/85' 
                                : opt.type === 'beef' 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {opt.percent}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Number of meals</label>
                      <span className="text-[12px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">{foodQuantity} meal{foodQuantity > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                      <button 
                        onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="text-[15px] font-bold text-gray-900">{foodQuantity}</span>
                      <button 
                        onClick={() => setFoodQuantity(Math.min(5, foodQuantity + 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Energy */}
              {modalCategory === 'Energy' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Savings Strategy</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { type: 'ac', label: 'AC Shutdown', desc: 'Saves 1.2kg/hr', percent: '-100%', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                        { type: 'solar', label: 'Solar Offset', desc: 'Saves 0.82kg/kWh', percent: '-100%', icon: Sun, color: 'text-amber-600 bg-amber-50 border-amber-100' }
                      ].map(opt => {
                        const isSel = energyType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            onClick={() => setEnergyType(opt.type as 'ac' | 'solar')}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer focus:outline-none text-left ${
                              isSel 
                                ? `${opt.color} border-2 font-bold shadow-lg scale-[1.03] -translate-y-0.5` 
                                : 'border-gray-200/60 bg-white/40 text-gray-600 hover:bg-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <opt.icon size={18} className="shrink-0" />
                              <div>
                                <span className="text-[11px] font-bold block leading-snug">{opt.label}</span>
                                <span className="text-[9px] opacity-75 font-semibold block leading-none mt-0.5">{opt.desc}</span>
                              </div>
                            </div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isSel 
                                ? 'bg-white/85' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {opt.percent}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                      <label htmlFor="modal-energy-value" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {energyType === 'ac' ? 'AC Hours Off' : 'Solar kWh Offset'}
                      </label>
                      <span className="text-[12px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                        {energyValue} {energyType === 'ac' ? 'hours' : 'kWh'}
                      </span>
                    </div>
                    <input 
                      id="modal-energy-value"
                      type="range" min="1" max={energyType === 'ac' ? 12 : 30} step="1" value={energyValue}
                      onChange={(e) => setEnergyValue(Number(e.target.value))}
                      style={getSliderStyle(energyValue, 1, energyType === 'ac' ? 12 : 30, '#0284C7')}
                      className="w-full h-2 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-sky-600"
                    />
                  </div>
                </>
              )}

            </div>

            {/* Real-time Animated Calculator Panel */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-2xl mb-6 border border-white/10 relative overflow-hidden">
              {/* Dynamic light glows */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Real-time Calculation</span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {modalCategory === 'Transport' ? 'vs Gas SUV (0.25 kg/km)' : modalCategory === 'Food' ? 'vs Beef Meal (10.0 kg/meal)' : 'vs Standard Grid'}
                </span>
              </div>
              
              {/* Animated Progress Bars */}
              <div className="space-y-3.5 mb-5">
                {/* Baseline SUV / Food Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">🚨 {modalCategory === 'Transport' ? 'Gas SUV Baseline' : modalCategory === 'Food' ? 'Beef Meal Baseline' : 'Standard Grid Baseline'}</span>
                    <span className="text-rose-400 font-extrabold">{modalImpact.baseline.toFixed(2)} kg</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300 ease-out"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                {/* Your Choice Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-300">🌱 Your Choice Emissions</span>
                    <span className={modalImpact.emitted > 0 ? "text-amber-400 font-extrabold" : "text-emerald-400 font-extrabold"}>
                      {modalImpact.emitted.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${
                        modalImpact.emitted === 0 
                          ? 'from-emerald-400 to-teal-400' 
                          : modalImpact.emitted >= modalImpact.baseline 
                            ? 'from-rose-500 to-rose-400' 
                            : 'from-amber-400 to-amber-300'
                      } transition-all duration-300 ease-out`}
                      style={{ 
                        width: `${modalImpact.baseline > 0 ? (modalImpact.emitted / modalImpact.baseline) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Carbon Saved Summary Panel */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Carbon Saved</span>
                  <span className="text-2xl font-black text-emerald-400 tracking-tight flex items-baseline gap-0.5 mt-0.5">
                    {modalImpact.saved.toFixed(2)}
                    <span className="text-[12px] font-bold text-emerald-500">kg CO₂</span>
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">SUV Avoidance</span>
                  <span className="text-[12px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20 inline-block mt-1 animate-pulse">
                    -{modalImpact.suvKmSaved} km drive
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Activity Title:</span>
                <span className="text-[11px] font-bold text-gray-200 normal-case italic truncate max-w-[220px]">{modalImpact.title}</span>
              </div>
            </div>

            {/* Log Button */}
            <button 
              onClick={() => handleQuickLog(modalCategory, modalImpact.title, modalImpact.saved, modalImpact.emitted)} 
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-[0.99] text-sm flex justify-center items-center gap-2 cursor-pointer focus:outline-none"
            >
              <Check size={16} strokeWidth={2.5} />
              Confirm & Log Activity
            </button>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] ${toastType === 'error' ? 'bg-rose-600/95' : 'bg-[#124C2E]/95'} backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none`}>
          {toastType === 'success' && (
            <div className="w-5 h-5 rounded-full bg-white text-[#124C2E] flex justify-center items-center shrink-0">
              <Check size={11} className="stroke-[3]" />
            </div>
          )}
          <span className="text-[11px] font-bold whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
