import { ArrowLeft, Users, Trophy, Globe, ArrowUpRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  score: number;
  avatar: string;
  avatar_url?: string | null;
  color: string;
}

export default function Community() {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, eco_score, avatar_url')
          .order('eco_score', { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((p, index) => {
            const fullName = p.full_name || 'Eco Warrior';
            const names = fullName.split(' ');
            const initials = names.map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

            // Set styling color based on rank position
            let color = 'from-emerald-400 to-emerald-500 text-white';
            if (index === 0) color = 'from-amber-400 to-amber-500 text-white'; // Gold
            else if (index === 1) color = 'from-slate-300 to-slate-400 text-gray-800'; // Silver
            else if (index === 2) color = 'from-amber-600 to-amber-700 text-white'; // Bronze

            return {
              id: p.id,
              rank: index + 1,
              name: p.id === profile?.id ? `${fullName} (You)` : fullName,
              score: p.eco_score || 0,
              avatar: initials || 'EW',
              avatar_url: p.avatar_url,
              color
            };
          });

          setLeaderboard(mapped);
        }
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [profile]);

  return (
    <div className="flex flex-col h-full bg-transparent pb-28 overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10">
        <button onClick={() => navigate(-1)} aria-label="Go back to dashboard" className="bg-white/50 p-2.5 rounded-full backdrop-blur-md shadow-sm border border-white hover:bg-white/80 active:scale-95 transition-all focus:outline-none cursor-pointer">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900 tracking-wide">Community</h2>
        <button aria-label="View community groups" className="bg-white/50 p-2.5 rounded-full backdrop-blur-md shadow-sm border border-white hover:bg-white/80 active:scale-95 transition-all focus:outline-none cursor-pointer">
          <Users size={18} className="text-eco-green" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-6">
        
        {/* Total Impact Card - Premium Glass */}
        <div className="glass-card p-6 text-center bg-gradient-to-br from-white/80 via-white/50 to-white/30 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(69,140,90,0.06)] relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
           <div className="w-12 h-12 bg-emerald-50 rounded-full flex justify-center items-center text-eco-green mx-auto mb-3 border border-emerald-100/50 shadow-inner">
             <Globe size={22} className="animate-spin" style={{ animationDuration: '40s' }} />
           </div>
           <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Global Community Impact</p>
           <p className="text-3xl font-black text-gray-900 tracking-tight">12,450 <span className="text-sm font-semibold text-gray-500">tons CO₂</span></p>
           <p className="text-[12px] text-gray-500 mt-2 font-medium">saved together this year.</p>
        </div>

        {/* Groups */}
        <div>
          <h3 className="text-[14px] font-bold text-gray-800 mb-3 tracking-tight px-1">Your Groups</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
            <div className="glass-card min-w-[170px] p-4 bg-white/70 backdrop-blur-sm border border-white/50 border-l-[4px] border-l-eco-green shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
               <p className="font-bold text-gray-900 text-[14px] tracking-tight">Tech Innovators</p>
               <div className="flex justify-between items-center mt-3">
                 <span className="text-[10px] font-bold text-eco-green bg-eco-green/10 px-2 py-0.5 rounded-full">142 Members</span>
                 <ArrowUpRight size={14} className="text-gray-400" />
               </div>
            </div>
            <div className="glass-card min-w-[170px] p-4 bg-white/70 backdrop-blur-sm border border-white/50 border-l-[4px] border-l-purple-500 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
               <p className="font-bold text-gray-900 text-[14px] tracking-tight">Local Cyclists</p>
               <div className="flex justify-between items-center mt-3">
                 <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">38 Members</span>
                 <ArrowUpRight size={14} className="text-gray-400" />
               </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h3 className="text-[14px] font-bold text-gray-800 mb-3 flex items-center gap-2 px-1 tracking-tight">
            <Trophy size={16} className="text-amber-500 animate-bounce" style={{ animationDuration: '3s' }}/> Live Leaderboard
          </h3>
          
          {loading ? (
            <div className="glass-card p-8 flex flex-col justify-center items-center gap-3 bg-white/60 border border-white/50 shadow-sm">
              <Loader size={24} className="animate-spin text-eco-green" />
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Syncing Leaderboard...</span>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="glass-card overflow-hidden bg-white/60 backdrop-blur-md border border-white/50 shadow-md">
              {leaderboard.map((user) => {
                const isUser = user.id === profile?.id;
                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3.5 p-4 border-b border-gray-100/50 last:border-0 transition-colors ${
                      isUser ? 'bg-eco-green/10 border-l-[3px] border-l-eco-green' : 'hover:bg-white/45'
                    }`}
                  >
                    {/* Rank Badge */}
                    <span className={`text-[12px] font-black w-5 text-center shrink-0 ${
                      user.rank === 1 ? 'text-amber-500 text-[14px]' : 
                      user.rank === 2 ? 'text-gray-400' : 
                      user.rank === 3 ? 'text-amber-700' : 'text-gray-400'
                    }`}>
                      #{user.rank}
                    </span>

                    {/* Avatar visual */}
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-[10px] object-cover bg-white shadow-sm shrink-0 border border-white"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-[10px] bg-gradient-to-tr ${user.color} flex justify-center items-center text-[12px] font-bold shadow-sm shrink-0`}>
                        {user.avatar}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0 pl-1">
                      <span className={`text-[13px] font-bold block truncate ${isUser ? 'text-eco-green' : 'text-gray-800'}`}>
                        {user.name}
                      </span>
                    </div>

                    {/* Score */}
                    <span className="text-[13px] font-black text-gray-900 shrink-0">
                      {user.score} <span className="text-[9px] font-bold text-gray-400 uppercase">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-8 text-center bg-white/60 border border-white/50 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">No users found on the leaderboard yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
