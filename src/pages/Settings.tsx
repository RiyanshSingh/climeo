import { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, MapPin, Briefcase, Users, Hash, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAppContext();
  
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.name || '',
    age: '',
    city: '',
    occupation: '',
    household_size: '1'
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadDetails = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            age: data.age?.toString() || '',
            city: data.city || '',
            occupation: data.occupation || '',
            household_size: data.household_size?.toString() || '1'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDetails();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const updatePayload = {
      full_name: formData.full_name,
      age: formData.age ? parseInt(formData.age, 10) : null,
      city: formData.city,
      occupation: formData.occupation,
      household_size: formData.household_size ? parseInt(formData.household_size, 10) : 1
    };

    try {
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
      if (error) throw error;
      
      // Update local context
      if (profile) {
        setProfile({ ...profile, name: formData.full_name });
      }
      
      alert('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Error updating profile: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#E6F4EA]/30 pb-24 overflow-y-auto scrollbar-hide relative">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10">
        <button onClick={() => navigate(-1)} aria-label="Go back to profile page" className="bg-white p-2 rounded-full shadow-sm border border-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
        <div className="w-9" /> {/* spacer for alignment */}
      </div>

      <div className="px-6 py-4 space-y-5">
        
        <div className="glass-card p-5 space-y-4">
          
          {/* Full Name */}
          <div>
            <label htmlFor="settings-fullname" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm focus-within:border-eco-green-light transition-colors">
              <User size={18} className="text-gray-400" />
              <input 
                id="settings-fullname"
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your Name"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="settings-age" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Age</label>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm focus-within:border-eco-green-light transition-colors">
              <Hash size={18} className="text-gray-400" />
              <input 
                id="settings-age"
                type="number" 
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label htmlFor="settings-city" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">City</label>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm focus-within:border-eco-green-light transition-colors">
              <MapPin size={18} className="text-gray-400" />
              <input 
                id="settings-city"
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. San Francisco"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label htmlFor="settings-occupation" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Occupation</label>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm focus-within:border-eco-green-light transition-colors">
              <Briefcase size={18} className="text-gray-400" />
              <input 
                id="settings-occupation"
                type="text" 
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Household Size */}
          <div>
            <label htmlFor="settings-household-size" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Household Size</label>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm focus-within:border-eco-green-light transition-colors">
              <Users size={18} className="text-gray-400" />
              <input 
                id="settings-household-size"
                type="number" 
                name="household_size"
                value={formData.household_size}
                onChange={handleChange}
                min="1"
                placeholder="Number of people"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800"
              />
            </div>
          </div>
          
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-eco-green text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-eco-green-dark hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : (
            <>
              <Save size={20} />
              Save Details
            </>
          )}
        </button>

        {/* Log Out Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 px-6 rounded-2xl border border-rose-200/50 shadow-sm hover:shadow transition-all flex justify-center items-center gap-2 mt-4 cursor-pointer focus:outline-none"
        >
          <LogOut size={20} />
          Log Out
        </button>

      </div>
    </div>
  );
}
