import { useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw, TrendingDown, DollarSign, Car, Zap, Utensils, ShoppingBag, Shirt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateSimulatorSavings, BASELINE } from '../lib/simulatorEngine';

export default function Simulator() {
  const navigate = useNavigate();

  const [transport, setTransport] = useState(BASELINE.transport);
  const [meatDays, setMeatDays] = useState(BASELINE.meatDays);
  const [acHours, setAcHours] = useState(BASELINE.acHours);
  const [shopping, setShopping] = useState(BASELINE.shopping);
  const [fashion, setFashion] = useState(BASELINE.fashion);

  const predictions = useMemo(() => {
    const savings = calculateSimulatorSavings({ transport, meatDays, acHours, shopping, fashion });
    return {
      co2Yearly: savings.co2Yearly.toFixed(0),
      moneyWeekly: savings.moneyWeekly.toFixed(0),
    };
  }, [transport, meatDays, acHours, shopping, fashion]);

  const getSliderStyle = (val: number, min: number, max: number, color: string) => {
    const ratio = (val - min) / (max - min);
    const calcPosition = `calc(${ratio} * (100% - 20px) + 10px)`;
    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} ${calcPosition}, #E5E7EB ${calcPosition}, #E5E7EB 100%)`
    };
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#F4FDF4] to-[#E0F2FE] pb-24 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
      
      {/* Background Animated Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-80 h-80 bg-[#0EA5E9] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-20 w-80 h-80 bg-[#FCD34D] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10">
        <button 
          onClick={() => navigate(-1)} 
          aria-label="Go back" 
          className="bg-white/70 backdrop-blur-md p-2.5 rounded-full shadow-sm border border-white/60 hover:bg-white transition-all"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Carbon Twin</h2>
        <button 
          onClick={() => { setTransport(BASELINE.transport); setMeatDays(BASELINE.meatDays); setAcHours(BASELINE.acHours); setShopping(BASELINE.shopping); setFashion(BASELINE.fashion); }} 
          aria-label="Reset simulation" 
          className="bg-white/70 backdrop-blur-md p-2.5 rounded-full shadow-sm border border-white/60 hover:bg-white transition-all active:scale-95"
        >
          <RefreshCw size={18} className="text-[#10B981]" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-6 relative z-10">
        
        {/* Intro */}
        <div className="text-center mb-2">
          <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight leading-tight mb-2">Simulate Your Future</h3>
          <p className="text-gray-500 text-[15px] font-medium px-4">Adjust your habits below to instantly see your potential environmental and financial impact.</p>
        </div>

        {/* Premium Output Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-[28px] p-5 shadow-[0_8px_30px_rgb(16,185,129,0.25)] flex flex-col justify-between text-white border border-white/20 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                  <TrendingDown size={16} className="text-white" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-green-50">Yearly CO₂</span>
             </div>
             <p className="text-4xl font-extrabold tracking-tight relative z-10">{predictions.co2Yearly}<span className="text-base font-medium text-green-100 ml-1">kg</span></p>
             <p className="text-[11px] font-medium text-green-100 mt-1 relative z-10 uppercase tracking-wide">Saved per year</p>
           </div>

           <div className="bg-white/60 backdrop-blur-xl rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between border border-white relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#0EA5E9] opacity-5 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="bg-[#E0F2FE] p-1.5 rounded-full">
                  <DollarSign size={16} className="text-[#0EA5E9]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Savings</span>
             </div>
             <p className="text-4xl font-extrabold tracking-tight text-gray-900 relative z-10">${predictions.moneyWeekly}</p>
             <p className="text-[11px] font-medium text-gray-500 mt-1 relative z-10 uppercase tracking-wide">Saved per week</p>
           </div>
        </div>

        {/* Sliders Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
           
           {/* Transport */}
           <div className="relative group">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2.5">
                 <div className="bg-[#E8F8EA] p-2 rounded-xl">
                   <Car size={18} className="text-[#10B981]" />
                 </div>
                 <label htmlFor="sim-weekly-driving" className="text-[15px] font-bold text-gray-900">Weekly Driving</label>
               </div>
               <span className="text-[13px] font-bold text-[#10B981] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{transport} kg CO₂</span>
             </div>
             <input 
               id="sim-weekly-driving"
               type="range" min="0" max="40" step="5" value={transport} 
               onChange={(e) => setTransport(Number(e.target.value))} 
               style={getSliderStyle(transport, 0, 40, '#10B981')}
               className="w-full h-3 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#10B981]" 
             />
             <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
               <span>Cycle only</span>
               <span>Drive everywhere</span>
             </div>
           </div>

           {/* Food */}
           <div className="relative group">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2.5">
                 <div className="bg-[#FEF3C7] p-2 rounded-xl">
                   <Utensils size={18} className="text-[#F59E0B]" />
                 </div>
                 <label htmlFor="sim-meat-meals" className="text-[15px] font-bold text-gray-900">Meat Meals / Week</label>
               </div>
               <span className="text-[13px] font-bold text-[#F59E0B] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{meatDays} days</span>
             </div>
             <input 
               id="sim-meat-meals"
               type="range" min="0" max="7" step="1" value={meatDays} 
               onChange={(e) => setMeatDays(Number(e.target.value))} 
               style={getSliderStyle(meatDays, 0, 7, '#F59E0B')}
               className="w-full h-3 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#F59E0B]" 
             />
             <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
               <span>Vegan</span>
               <span>Daily</span>
             </div>
           </div>

           {/* Energy */}
           <div className="relative group">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2.5">
                 <div className="bg-[#E0F2FE] p-2 rounded-xl">
                   <Zap size={18} className="text-[#0EA5E9]" />
                 </div>
                 <label htmlFor="sim-ac-usage" className="text-[15px] font-bold text-gray-900">AC Usage / Day</label>
               </div>
               <span className="text-[13px] font-bold text-[#0EA5E9] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{acHours} hrs</span>
             </div>
             <input 
               id="sim-ac-usage"
               type="range" min="0" max="12" step="1" value={acHours} 
               onChange={(e) => setAcHours(Number(e.target.value))} 
               style={getSliderStyle(acHours, 0, 12, '#0EA5E9')}
               className="w-full h-3 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#0EA5E9]" 
             />
             <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
               <span>Off</span>
               <span>All day</span>
             </div>
           </div>

           {/* Online Shopping */}
           <div className="relative group">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2.5">
                 <div className="bg-[#FCE7F3] p-2 rounded-xl">
                   <ShoppingBag size={18} className="text-[#EC4899]" />
                 </div>
                 <label htmlFor="sim-online-deliveries" className="text-[15px] font-bold text-gray-900">Online Deliveries</label>
               </div>
               <span className="text-[13px] font-bold text-[#EC4899] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{shopping} / wk</span>
             </div>
             <input 
               id="sim-online-deliveries"
               type="range" min="0" max="10" step="1" value={shopping} 
               onChange={(e) => setShopping(Number(e.target.value))} 
               style={getSliderStyle(shopping, 0, 10, '#EC4899')}
               className="w-full h-3 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#EC4899]" 
             />
             <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
               <span>None</span>
               <span>Frequent</span>
             </div>
           </div>

           {/* Fast Fashion */}
           <div className="relative group">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2.5">
                 <div className="bg-[#EDE9FE] p-2 rounded-xl">
                   <Shirt size={18} className="text-[#8B5CF6]" />
                 </div>
                 <label htmlFor="sim-new-clothes" className="text-[15px] font-bold text-gray-900">New Clothes</label>
               </div>
               <span className="text-[13px] font-bold text-[#8B5CF6] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{fashion} items / mo</span>
             </div>
             <input 
               id="sim-new-clothes"
               type="range" min="0" max="10" step="1" value={fashion} 
               onChange={(e) => setFashion(Number(e.target.value))} 
               style={getSliderStyle(fashion, 0, 10, '#8B5CF6')}
               className="w-full h-3 appearance-none rounded-full cursor-pointer shadow-inner slider-thumb-premium text-[#8B5CF6]" 
             />
             <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
               <span>Thrift only</span>
               <span>Fast fashion</span>
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
