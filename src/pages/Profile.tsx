import { ArrowLeft, Settings, History, Edit3, Trophy, Check, Lock, Target, Zap, Award, Loader, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, setProfile, activities, achievements } = useAppContext();
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Error logging out: ${errorMsg}`);
    }
  };
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(prev => {
        if (!prev) return null;
        const updatedProfile = { ...prev, avatar_url: publicUrl };
        localStorage.setItem('climeo_profile', JSON.stringify(updatedProfile));
        return updatedProfile;
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] pb-28 overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10 bg-transparent">
        <button onClick={() => navigate(-1)} aria-label="Go back to dashboard" className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">Profile</h2>
        <button onClick={() => navigate('/settings')} aria-label="Settings" className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer">
          <Settings size={18} className="text-gray-700" />
        </button>
      </div>

      <div className="px-6 py-2 space-y-6">
        
        {/* User Info Card - Premium Mesh/Glass */}
        <div className="rounded-[32px] p-6 relative overflow-hidden flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 bg-gradient-to-br from-white to-[#F8FAF9]">
          {/* Background blur blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8F8EA] rounded-full blur-[60px] opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E0F2FE] rounded-full blur-[50px] opacity-40 translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-row items-center gap-5 w-full">
            <div className="relative inline-block shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                type="button"
                className="w-24 h-24 rounded-[32px] shadow-lg cursor-pointer bg-white overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 border border-gray-100"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile image"
              >
                <img 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}&backgroundColor=b6e3f4`} 
                  alt={profile.name} 
                  className={`w-full h-full object-cover bg-white ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                aria-label="Upload profile image button overlay"
                className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-gray-100 text-[#3B8B5D] hover:bg-gray-50 hover:scale-105 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {isUploading ? <Loader size={16} className="animate-spin text-gray-400" /> : <Edit3 size={16} />}
              </button>
            </div>
            <div className="text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8EA] rounded-2xl text-[12px] font-semibold text-[#10B981] mt-1.5">
                <Award size={14} /> Sustainability Advocate
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Sleek capsules */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-white rounded-[24px] p-4 text-center shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center items-center">
             <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex justify-center items-center mb-2">
               <Zap size={16} />
             </div>
             <p className="text-lg font-bold text-gray-900 leading-none mb-1">{profile.ecoScore}</p>
             <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Score</p>
           </div>
           <div className="bg-white rounded-[24px] p-4 text-center shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center items-center">
             <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex justify-center items-center mb-2">
               <Target size={16} /> 
             </div>
             <p className="text-lg font-bold text-gray-900 leading-none mb-1">{profile.totalCO2Saved} <span className="text-xs">kg</span></p>
             <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Saved</p>
           </div>
           <div className="bg-white rounded-[24px] p-4 text-center shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center items-center">
             <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex justify-center items-center mb-2">
               <Trophy size={16} />
             </div>
             <p className="text-lg font-bold text-gray-900 leading-none mb-1">{profile.streak}🔥</p>
             <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Streak</p>
           </div>
        </div>

        {/* Active Goals */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight flex items-center gap-2">
               <Target size={18} className="text-[#3B8B5D]"/> Active Goals
            </h3>
          </div>
          <div className="bg-white rounded-[24px] p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-1.5">
            {profile.goals.map((goal, idx) => (
               <div key={idx} className="p-3.5 bg-gray-50/50 rounded-[18px] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#10B981] flex justify-center items-center shrink-0">
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-medium text-gray-800">{goal}</span>
               </div>
            ))}
          </div>
        </div>

        {/* Achievements Gallery */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight flex items-center gap-2">
               <Trophy size={18} className="text-[#F59E0B]"/> Achievements Gallery
            </h3>
          </div>
          <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 justify-items-center">
              {achievements.slice(0, 12).map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center group cursor-pointer transition-transform hover:-translate-y-1">
                  {badge.unlocked ? (
                    <div className={`relative w-[54px] h-[54px] rounded-[18px] bg-gradient-to-br ${badge.gradient} flex justify-center items-center text-white mb-2 shadow-sm border border-white/40 [&>svg]:w-[22px] [&>svg]:h-[22px]`}>
                      {badge.icon}
                      <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm flex justify-center items-center text-emerald-500 border border-emerald-50">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-[54px] h-[54px] rounded-[18px] bg-gray-50 flex justify-center items-center text-gray-300 border border-gray-200/60 mb-2 opacity-70 [&>svg]:w-[22px] [&>svg]:h-[22px]">
                      {badge.icon}
                      <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-gray-100 border border-white shadow-sm flex justify-center items-center text-gray-400">
                        <Lock size={10} strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold text-center w-full tracking-tight ${badge.unlocked ? 'text-gray-900' : 'text-gray-400'} truncate px-0.5`}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <button className="text-[13px] font-bold text-gray-500 hover:text-gray-800 transition-colors focus:outline-none cursor-pointer">
                View all 50 achievements
              </button>
            </div>
          </div>
        </div>

        {/* Activity History */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight flex items-center gap-2">
               <History size={18} className="text-gray-400"/> Recent Activity
            </h3>
          </div>
          {activities.length > 0 ? (
            <div className="bg-white rounded-[28px] p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col gap-1.5">
              {activities.slice(0, 5).map(act => (
                 <div key={act.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors rounded-[20px] flex justify-between items-center group cursor-pointer">
                    <div>
                       <p className="font-semibold text-gray-900 text-[14px]">{act.title}</p>
                       <p className="text-[11px] text-gray-400 font-medium mt-0.5">{new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E8F8EA] rounded-full text-[12px] font-bold text-[#10B981]">
                      +{act.co2Saved} kg
                    </span>
                 </div>
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-[28px] p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-50 mx-auto flex justify-center items-center text-gray-400 mb-3">
                  <History size={20} />
                </div>
                <p className="text-[14px] text-gray-500 font-medium">No activities logged yet.</p>
                <button 
                  onClick={() => navigate('/add-activity')} 
                  className="mt-3 text-[13px] font-bold text-[#10B981] hover:text-[#059669] transition-colors focus:outline-none cursor-pointer"
                >
                  Log your first activity
                </button>
             </div>
          )}
        </div>

        {/* Log Out Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white hover:bg-rose-50 text-rose-600 font-bold py-3.5 px-6 rounded-[24px] border border-rose-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer mt-4 focus:outline-none"
        >
          <LogOut size={18} />
          Log Out
        </button>

      </div>
    </div>
  );
}
