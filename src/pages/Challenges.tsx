import { ArrowLeft, Target, Award, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Challenges() {
  const navigate = useNavigate();
  const { profile, challenges, completeChallenge } = useAppContext();
  
  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-[#E6F4EA]/30 pb-24 overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10">
        <button onClick={() => navigate(-1)} aria-label="Go back to dashboard" className="bg-white p-2 rounded-full shadow-sm border border-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Challenges</h2>
        <div className="w-10 flex justify-end">
           <div className="bg-[#3B8B5D] text-white text-xs font-bold px-2 py-1 rounded-full">{profile.ecoScore} pts</div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* Streak */}
        <div className="glass-card p-4 flex items-center justify-between bg-gradient-to-r from-[#84C98B] to-[#3B8B5D] text-white border-none">
          <div>
             <p className="text-sm font-semibold text-green-100">Current Streak</p>
             <p className="text-2xl font-bold flex items-center gap-2">{profile.streak} Days 🔥</p>
          </div>
          <Award size={40} className="text-green-200 opacity-50" />
        </div>

        {/* Daily Challenges */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Target size={18} className="text-[#3B8B5D]"/> Daily Goals</h3>
          <div className="space-y-3">
            {challenges.map(c => (
              <div key={c.id} className={`glass-card p-4 flex items-start gap-4 transition-all ${c.completed ? 'opacity-60 bg-gray-50' : 'hover:bg-white/90'}`}>
                <div className="mt-1">
                  {c.completed ? (
                    <CheckCircle size={24} className="text-[#3B8B5D]" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                     <p className={`font-bold ${c.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{c.title}</p>
                     <span className="text-xs font-bold text-[#3B8B5D] bg-[#E8F8EA] px-2 py-0.5 rounded-full">+{c.points} pts</span>
                   </div>
                   <p className="text-xs text-gray-500">{c.description}</p>
                   {!c.completed && (
                     <button 
                       onClick={() => completeChallenge(c.id)}
                       className="mt-3 text-xs font-semibold text-[#3B8B5D] hover:text-[#2A6B45]"
                     >
                       Mark as Complete
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock size={18} className="text-gray-400"/> Weekly Challenges</h3>
          <div className="glass-card p-4 flex items-center justify-between opacity-50">
             <div>
               <p className="font-bold text-gray-700">Zero Waste Week</p>
               <p className="text-xs text-gray-500 mt-1">Produce no non-recyclable waste.</p>
             </div>
             <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">50 pts</span>
          </div>
        </div>

      </div>
    </div>
  );
}
