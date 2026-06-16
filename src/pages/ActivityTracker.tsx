import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Footprints, 
  Bike, 
  Train, 
  Utensils, 
  Leaf, 
  Zap, 
  Sun, 
  ShoppingBag, 
  Trash2, 
  Check, 
  Plus,
  Car,
  Sparkles,
  Shirt,
  Smartphone,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { calculateActivityImpact } from '../lib/activityEngine';

type Category = 'Transport' | 'Food' | 'Energy' | 'Shopping';

export default function ActivityTracker() {
  const navigate = useNavigate();
  const { addActivity, profile } = useAppContext();
  const [activeTab, setActiveTab] = useState<Category>('Transport');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // --- State for Custom Inputs ---
  
  // Transport State
  const [transportMode, setTransportMode] = useState<'walking' | 'cycling' | 'bus' | 'train' | 'ev' | 'car'>('cycling');
  const [transportDistance, setTransportDistance] = useState<number>(5);

  // Food State
  const [foodMeal, setFoodMeal] = useState<'vegan' | 'vegetarian' | 'chicken' | 'beef'>('vegetarian');
  const [foodQuantity, setFoodQuantity] = useState<number>(1);

  // Energy State
  const [energyAction, setEnergyAction] = useState<'ac' | 'solar'>('ac');
  const [energyValue, setEnergyValue] = useState<number>(4); // hours or kWh

  // Shopping State
  const [shoppingAction, setShoppingAction] = useState<'thrift' | 'new' | 'plastic'>('thrift');
  const [shoppingItem, setShoppingItem] = useState<'clothing' | 'electronics'>('clothing');
  const [shoppingQuantity, setShoppingQuantity] = useState<number>(1);

  // --- Dynamic Live Calculations ---
  const impactSummary = useMemo(() => {
    return calculateActivityImpact({
      activeTab,
      transportMode,
      transportDistance,
      foodMeal,
      foodQuantity,
      energyAction,
      energyValue,
      shoppingAction,
      shoppingItem,
      shoppingQuantity
    });
  }, [
    activeTab, 
    transportMode, transportDistance, 
    foodMeal, foodQuantity, 
    energyAction, energyValue, 
    shoppingAction, shoppingItem, shoppingQuantity
  ]);

  if (!profile) return null;

  const handleLog = async () => {
    if (isLogging) return;
    setIsLogging(true);
    try {
      await addActivity({ 
        category: activeTab, 
        title: impactSummary.title, 
        co2Saved: impactSummary.co2Saved,
        co2Generated: impactSummary.co2Generated
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsLogging(false);
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Logging activity failed:", err);
      setToastMessage(errorMsg || 'Failed to log activity.');
      setShowToast(true);
      setIsLogging(false);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const getSliderStyle = (val: number, min: number, max: number, color: string) => {
    const ratio = (val - min) / (max - min);
    const calcPosition = `calc(${ratio} * (100% - 20px) + 10px)`;
    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} ${calcPosition}, #E5E7EB ${calcPosition}, #E5E7EB 100%)`
    };
  };

  return (
    <div className="flex flex-col h-full pb-24 overflow-y-auto scrollbar-hide relative">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10 shrink-0">
        <button onClick={() => navigate(-1)} aria-label="Go back to dashboard" className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Custom Carbon Logger</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide relative z-10 shrink-0">
        {(['Transport', 'Food', 'Energy', 'Shopping'] as Category[]).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-[13px] font-bold transition-all duration-300 focus:outline-none cursor-pointer ${
                isActive 
                  ? 'bg-[#10B981] text-white shadow-[0_4px_15px_rgba(16,185,129,0.25)] scale-105' 
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="w-full px-6 pt-2 space-y-6 pb-28 relative z-10">
        
        {/* Dynamic Input Panel */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
          
          {/* TRANSPORT TAB */}
          {activeTab === 'Transport' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Transit Mode</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { mode: 'walking', label: 'Walk', icon: Footprints, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                    { mode: 'cycling', label: 'Cycle', icon: Bike, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                    { mode: 'bus', label: 'Bus', icon: Train, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                    { mode: 'train', label: 'Train', icon: Train, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { mode: 'ev', label: 'EV Car', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { mode: 'car', label: 'Gas Car', icon: Car, color: 'text-rose-600 bg-rose-50 border-rose-100' }
                  ].map(opt => {
                    const isSel = transportMode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        onClick={() => setTransportMode(opt.mode as 'walking' | 'cycling' | 'bus' | 'train' | 'ev' | 'car')}
                        className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer focus:outline-none ${
                          isSel 
                            ? `${opt.color} border-2 font-bold shadow-sm scale-[1.03]` 
                            : 'border-gray-150 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon size={18} className="mb-1.5" />
                        <span className="text-[11px] font-semibold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 px-1">
                  <label htmlFor="track-transport-distance" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distance traveled</label>
                  <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{transportDistance} km</span>
                </div>
                <input 
                  id="track-transport-distance"
                  type="range" min="1" max="100" step="1" value={transportDistance}
                  onChange={(e) => setTransportDistance(Number(e.target.value))}
                  style={getSliderStyle(transportDistance, 1, 100, '#10B981')}
                  className="w-full h-2.5 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#10B981]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide px-1">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </>
          )}

          {/* FOOD TAB */}
          {activeTab === 'Food' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Diet / Meal choice</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'vegan', label: 'Vegan Meal', desc: '1.0 kg CO₂', icon: Leaf, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { type: 'vegetarian', label: 'Vegetarian', desc: '1.5 kg CO₂', icon: Utensils, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                    { type: 'chicken', label: 'Chicken Meal', desc: '3.5 kg CO₂', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { type: 'beef', label: 'Beef Meal', desc: '10.0 kg CO₂', icon: Utensils, color: 'text-rose-600 bg-rose-50 border-rose-100' }
                  ].map(opt => {
                    const isSel = foodMeal === opt.type;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => setFoodMeal(opt.type as 'vegan' | 'vegetarian' | 'chicken' | 'beef')}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none ${
                          isSel 
                            ? `${opt.color} border-2 font-bold shadow-sm scale-[1.02]` 
                            : 'border-gray-150 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon size={18} className="shrink-0" />
                        <div>
                          <span className="text-[12px] font-bold block">{opt.label}</span>
                          <span className="text-[10px] opacity-75 font-semibold block">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Number of meals</label>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))}
                    aria-label="Decrease food quantity"
                    className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className="text-[18px] font-bold text-gray-900">{foodQuantity} meal{foodQuantity > 1 ? 's' : ''}</span>
                  <button 
                    onClick={() => setFoodQuantity(Math.min(10, foodQuantity + 1))}
                    aria-label="Increase food quantity"
                    className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ENERGY TAB */}
          {activeTab === 'Energy' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Energy Saving Action</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { action: 'ac', label: 'Turn Off AC', desc: 'Saves 1.2kg/hr', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                    { action: 'solar', label: 'Used Solar Power', desc: 'Saves 0.8kg/kWh', icon: Sun, color: 'text-amber-600 bg-amber-50 border-amber-100' }
                  ].map(opt => {
                    const isSel = energyAction === opt.action;
                    return (
                      <button
                        key={opt.action}
                        onClick={() => setEnergyAction(opt.action as 'ac' | 'solar')}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none ${
                          isSel 
                            ? `${opt.color} border-2 font-bold shadow-sm scale-[1.02]` 
                            : 'border-gray-150 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon size={18} className="shrink-0" />
                        <div>
                          <span className="text-[12px] font-bold block">{opt.label}</span>
                          <span className="text-[10px] opacity-75 font-semibold block">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 px-1">
                  <label htmlFor="track-energy-value" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {energyAction === 'ac' ? 'Duration (Hours)' : 'Power Amount (kWh)'}
                  </label>
                  <span className="text-[13px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                    {energyValue} {energyAction === 'ac' ? 'hours' : 'kWh'}
                  </span>
                </div>
                <input 
                  id="track-energy-value"
                  type="range" min="1" max={energyAction === 'ac' ? 24 : 50} step="1" value={energyValue}
                  onChange={(e) => setEnergyValue(Number(e.target.value))}
                  style={getSliderStyle(energyValue, 1, energyAction === 'ac' ? 24 : 50, '#0284C7')}
                  className="w-full h-2.5 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-sky-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide px-1">
                  <span>1 {energyAction === 'ac' ? 'hr' : 'kWh'}</span>
                  <span>{energyAction === 'ac' ? '24 hrs' : '50 kWh'}</span>
                </div>
              </div>
            </>
          )}

          {/* SHOPPING TAB */}
          {activeTab === 'Shopping' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Shopping Choice</label>
                <div className="flex flex-col gap-2">
                  {[
                    { action: 'thrift', label: 'Bought Second-Hand (Thrift)', desc: 'Replaces carbon of buying a new item', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                    { action: 'new', label: 'Bought Brand New', desc: 'Emits direct manufacturing carbon footprint', icon: ShoppingBag, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    { action: 'plastic', label: 'Refused Plastic Bag', desc: 'Saves 0.1kg per single-use bag avoided', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                  ].map(opt => {
                    const isSel = shoppingAction === opt.action;
                    return (
                      <button
                        key={opt.action}
                        onClick={() => setShoppingAction(opt.action as 'thrift' | 'new' | 'plastic')}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none ${
                          isSel 
                            ? `${opt.color} border-2 font-bold shadow-sm scale-[1.01]` 
                            : 'border-gray-150 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon size={18} className="shrink-0" />
                        <div>
                          <span className="text-[12px] font-bold block">{opt.label}</span>
                          <span className="text-[10px] opacity-75 font-semibold block">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-item class choice (only for Thrift/New) */}
              {shoppingAction !== 'plastic' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Item Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { item: 'clothing', label: 'Clothing / Fashion', desc: '15kg CO₂ base', icon: Shirt },
                      { item: 'electronics', label: 'Electronics / Device', desc: '50kg CO₂ base', icon: Smartphone }
                    ].map(opt => {
                      const isSel = shoppingItem === opt.item;
                      return (
                        <button
                          key={opt.item}
                          onClick={() => setShoppingItem(opt.item as 'clothing' | 'electronics')}
                          className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer focus:outline-none ${
                            isSel 
                              ? 'border-[#10B981] bg-emerald-50/20 text-[#10B981] border-2 font-bold shadow-sm scale-[1.02]' 
                              : 'border-gray-150 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <opt.icon size={18} className="mb-1" />
                          <span className="text-[11px] font-bold">{opt.label}</span>
                          <span className="text-[9px] opacity-80 mt-0.5">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Quantity</label>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => setShoppingQuantity(Math.max(1, shoppingQuantity - 1))}
                    aria-label="Decrease shopping quantity"
                    className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className="text-[18px] font-bold text-gray-900">{shoppingQuantity} item{shoppingQuantity > 1 ? 's' : ''}</span>
                  <button 
                    onClick={() => setShoppingQuantity(Math.min(10, shoppingQuantity + 1))}
                    aria-label="Increase shopping quantity"
                    className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex justify-center items-center text-gray-600 active:scale-90 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-tr from-gray-900 to-gray-800 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden border border-gray-800">
          {/* Abstract glows */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#10B981]/20 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none"></div>

          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#10B981] mb-4">Carbon Footprint Preview</h4>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Footprint Emitted</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block text-gray-100">{impactSummary.co2Generated} <span className="text-xs font-semibold text-gray-400">kg</span></span>
             </div>
             <div className="border-l border-white/10 pl-5">
                <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">Emissions Saved</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block text-[#10B981]">{impactSummary.co2Saved} <span className="text-xs font-semibold text-emerald-500">kg</span></span>
             </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 text-left">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Activity Title</span>
             <p className="text-[13px] font-semibold text-gray-200 mt-0.5 italic">{impactSummary.title || 'Drafting activity...'}</p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleLog} 
          disabled={isLogging}
          className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-[24px] shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-base flex justify-center items-center gap-2 cursor-pointer focus:outline-none"
        >
          {isLogging ? 'Logging to Climeo...' : (
            <>
              <Check size={18} strokeWidth={2.5} />
              Log Activity
            </>
          )}
        </button>

      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col justify-center items-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#10B981] to-teal-400 rounded-full flex justify-center items-center text-white shadow-lg mb-4 animate-bounce">
            <Check size={38} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Activity Logged!</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Footprint parameters successfully synched.</p>
        </div>
      )}

      {/* Error Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-[90%] text-center">
          <span className="text-[11px] font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
