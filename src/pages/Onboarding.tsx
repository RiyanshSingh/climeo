import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, Car, Utensils, Home, ArrowRight, Loader, ArrowLeft, Mail, Lock, 
  Eye, EyeOff, User, Sparkles, GraduationCap, Briefcase, Laptop, 
  Compass, ShoppingBag, Plane, Milestone, TrendingDown 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { getEcoRecommendations } from '../lib/groq';
import { calculateCarbonDNA } from '../lib/onboardingEngine';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAppContext();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    lifestyle: '',
    travelDistance: '',
    transportMode: '',
    dietType: '',
    energyUsage: '',
    shoppingFreq: '',
    flightsCount: ''
  });
  const [finishing, setFinishing] = useState(false);
  const [aiRecs, setAiRecs] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Auth States
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If user is already logged in and has profile, bypass step 0
  useEffect(() => {
    if (user && profile && step === 0) {
      navigate('/');
    }
  }, [user, profile, step, navigate]);

  // Handle transition for step 10 (generation loader) and fetch AI recommendations
  useEffect(() => {
    if (step === 10) {
      const fetchRecommendations = async () => {
        setLoadingRecs(true);
        const habitsText = `
- Occupation/Lifestyle: ${answers.lifestyle}
- Transport Mode: ${answers.transportMode}
- Weekly Travel Distance: ${answers.travelDistance}
- Diet Selection: ${answers.dietType}
- Daily AC usage: ${answers.energyUsage}
- Shopping Frequency: ${answers.shoppingFreq}
- Flights per Year: ${answers.flightsCount}
        `;
        
        try {
          const recs = await getEcoRecommendations(habitsText);
          if (recs && recs.length > 0) {
            setAiRecs(recs);
          }
        } catch (err) {
          console.error("Failed to fetch AI recommendations:", err);
        } finally {
          setLoadingRecs(false);
        }
      };

      fetchRecommendations();

      const timer = setTimeout(() => setStep(11), 2500);
      return () => clearTimeout(timer);
    }
  }, [step, answers]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFinishing(true);

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError("Passwords do not match");
      setFinishing(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        // Proceed to onboarding questions
        setStep(1);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Check if user has an existing profile in profiles table
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileData) {
          navigate('/');
        } else {
          // Profile missing, proceed to questions
          setStep(1);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setAuthError(errorMsg || "Authentication failed");
    } finally {
      setFinishing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setFinishing(true);
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setAuthError(errorMsg || "Google authentication failed");
    } finally {
      setFinishing(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    const { ecoScore } = calculateCarbonDNA(answers);
    
    try {
      if (user) {
        // Update user profile starting score and occupation (lifestyle) in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            eco_score: ecoScore,
            occupation: answers.lifestyle
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
        
        // Update local context profile
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ecoScore: ecoScore,
            occupation: answers.lifestyle
          };
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to complete onboarding:", err);
      alert(`Error completing onboarding: ${errorMsg}`);
    } finally {
      setFinishing(false);
    }
  };

  // Step 0: Welcome Screen
  if (step === 0) {
    return (
      <div className="flex flex-col h-full px-8 pt-12 pb-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E8F8EA] rounded-full blur-3xl -z-10"></div>
        <div className="text-center mt-2 z-10">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">Your Personal Green<br />Living Guide</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">Measure your footprint, reduce waste, and get smarter sustainable recommendations tailored to your lifestyle.</p>
        </div>
        
        <div className="flex-1 flex justify-center items-center mt-2 z-10">
          <div className="relative w-80 h-80 flex justify-center items-center">
            <div className="absolute w-72 h-72 bg-[#84C98B]/35 rounded-full blur-3xl opacity-40"></div>
            <img 
              src="/homepage.png" 
              alt="EcoPulse Welcome" 
              className="relative w-72 h-72 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:scale-105 active:scale-[0.98] transition-all duration-300"
            />
          </div>
        </div>

        <div className="space-y-4 mt-auto z-10">
          {/* Continue button goes to SignUp Screen (step 6) */}
          <button 
            onClick={() => { setAuthMode('signup'); setStep(6); setAuthError(null); }} 
            className="w-full bg-[#4E9B6B] hover:bg-[#3B8B5D] text-white font-medium py-4 rounded-full transition-colors shadow-md text-lg cursor-pointer focus:outline-none"
          >
            I'm new here
          </button>
          
          {/* I already have an account goes to SignIn Screen (step 7) */}
          <button 
            onClick={() => { setAuthMode('signin'); setStep(7); setAuthError(null); }} 
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-full transition-colors shadow-sm text-lg cursor-pointer border border-gray-150 focus:outline-none"
          >
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  // Step 6: Email Sign Up Screen
  if (step === 6) {
    return (
      <div className="flex flex-col h-full px-6 pt-12 pb-8 relative overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 z-10">
          <button 
            type="button" 
            onClick={() => { setStep(0); setAuthError(null); }} 
            aria-label="Go back to welcome screen"
            className="bg-white/50 backdrop-blur-md border border-white p-2.5 rounded-full shadow-sm hover:scale-105 hover:bg-white/80 active:scale-95 transition-all cursor-pointer focus:outline-none"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Create Account</h2>
          <div className="w-10"></div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E8F8EA] rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Error message */}
        {authError && (
          <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100/80 rounded-2xl p-4 mb-4 text-xs font-semibold text-rose-600 text-center shadow-sm z-10 animate-shake">
            {authError}
          </div>
        )}

        {/* Glassmorphic Form Card */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[28px] p-6 z-10">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="signup-fullname" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Full Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <User size={18} />
                </span>
                <input 
                  id="signup-fullname"
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Mail size={18} />
                </span>
                <input 
                  id="signup-email"
                  type="email" 
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={18} />
                </span>
                <input 
                  id="signup-password"
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-none cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={18} />
                </span>
                <input 
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-none cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={finishing}
              className="w-full bg-gradient-to-r from-[#4E9B6B] to-[#3B8B5D] hover:shadow-[0_4px_20px_rgba(59,139,93,0.3)] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm flex justify-center items-center gap-2 mt-6 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {finishing ? <Loader size={18} className="animate-spin" /> : 'Get Started'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-gray-200/60"></div>
            <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 border-t border-gray-200/60"></div>
          </div>

          {/* Google Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={finishing}
            className="w-full bg-white/80 hover:bg-white text-gray-700 font-bold py-3 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Dynamic Mode Switch Link */}
        <div className="text-center mt-6 z-10">
          <p className="text-xs text-gray-500 font-semibold">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setStep(7); setAuthError(null); }}
              className="text-[#3B8B5D] font-bold hover:underline focus:outline-none bg-transparent border-none cursor-pointer pl-1"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Step 7: Email Sign In Screen
  if (step === 7) {
    return (
      <div className="flex flex-col h-full px-6 pt-12 pb-8 relative overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 z-10">
          <button 
            type="button" 
            onClick={() => { setStep(0); setAuthError(null); }} 
            aria-label="Go back to welcome screen"
            className="bg-white/50 backdrop-blur-md border border-white p-2.5 rounded-full shadow-sm hover:scale-105 hover:bg-white/80 active:scale-95 transition-all cursor-pointer focus:outline-none"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Log In</h2>
          <div className="w-10"></div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E8F8EA] rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Error message */}
        {authError && (
          <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100/80 rounded-2xl p-4 mb-4 text-xs font-semibold text-rose-600 text-center shadow-sm z-10 animate-shake">
            {authError}
          </div>
        )}

        {/* Glassmorphic Form Card */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[28px] p-6 z-10">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Mail size={18} />
                </span>
                <input 
                  id="signin-email"
                  type="email" 
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signin-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block pl-1">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={18} />
                </span>
                <input 
                  id="signin-password"
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B8B5D]/20 focus:border-[#3B8B5D] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-none cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={finishing}
              className="w-full bg-gradient-to-r from-[#4E9B6B] to-[#3B8B5D] hover:shadow-[0_4px_20px_rgba(59,139,93,0.3)] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm flex justify-center items-center gap-2 mt-6 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {finishing ? <Loader size={18} className="animate-spin" /> : 'Log In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-gray-200/60"></div>
            <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 border-t border-gray-200/60"></div>
          </div>

          {/* Google Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={finishing}
            className="w-full bg-white/80 hover:bg-white text-gray-700 font-bold py-3 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Dynamic Mode Switch Link */}
        <div className="text-center mt-6 z-10">
          <p className="text-xs text-gray-500 font-semibold">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setStep(6); setAuthError(null); }}
              className="text-[#3B8B5D] font-bold hover:underline focus:outline-none bg-transparent border-none cursor-pointer pl-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Lifestyle Type (Screen 1)
  if (step === 1) {
    return (
      <QuestionStep 
        title="What describes your lifestyle?" 
        icon={<Sparkles size={28} className="text-emerald-600" />}
        options={[
          { label: 'Student', value: 'Student', icon: <GraduationCap size={18} className="text-emerald-600" /> },
          { label: 'Working Professional', value: 'Working Professional', icon: <Briefcase size={18} className="text-emerald-600" /> },
          { label: 'Remote Worker', value: 'Remote Worker', icon: <Laptop size={18} className="text-emerald-600" /> },
          { label: 'Business Traveler', value: 'Business Traveler', icon: <Compass size={18} className="text-emerald-600" /> }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, lifestyle: val}); setStep(2); }}
        onBack={() => setStep(0)}
        whyText="This helps Climeo personalize your carbon savings actions."
        currentStep={1}
        totalSteps={7}
      />
    );
  }

  // Step 2: Travel Distance (Screen 2a)
  if (step === 2) {
    return (
      <QuestionStep 
        title="How much do you travel every week?" 
        icon={<Milestone size={28} className="text-emerald-600" />}
        options={[
          { label: 'Less than 20 km', value: 'Less than 20 km' },
          { label: '20 - 50 km', value: '20 - 50 km' },
          { label: '50 - 100 km', value: '50 - 100 km' },
          { label: '100 - 250 km', value: '100 - 250 km' },
          { label: '250+ km', value: '250+ km' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, travelDistance: val}); setStep(3); }}
        onBack={() => setStep(1)}
        whyText="Transportation usually contributes 25-50% of personal emissions."
        currentStep={2}
        totalSteps={7}
      />
    );
  }

  // Step 3: Primary Mode of Transport (Screen 2b)
  if (step === 3) {
    return (
      <QuestionStep 
        title="What is your primary mode of transport?" 
        icon={<Car size={28} className="text-emerald-600" />}
        options={[
          { label: 'Walking / Cycling', value: 'Walking/Cycling' },
          { label: 'Public Transport', value: 'Public Transport' },
          { label: 'Bike / Scooter', value: 'Bike' },
          { label: 'Car / Cab', value: 'Car' },
          { label: 'Mix of Options', value: 'Mix' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, transportMode: val}); setStep(4); }}
        onBack={() => setStep(2)}
        whyText="Transportation usually contributes 25-50% of personal emissions."
        currentStep={3}
        totalSteps={7}
      />
    );
  }

  // Step 4: Diet Type (Screen 3)
  if (step === 4) {
    return (
      <QuestionStep 
        title="What describe your daily diet?" 
        icon={<Utensils size={28} className="text-emerald-600" />}
        options={[
          { label: 'Vegan', value: 'Vegan' },
          { label: 'Vegetarian', value: 'Vegetarian' },
          { label: 'Eggetarian', value: 'Eggetarian' },
          { label: 'Non-Veg (Occasional)', value: 'Non-Veg (Occasional)' },
          { label: 'Non-Veg (Frequent)', value: 'Non-Veg (Frequent)' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, dietType: val}); setStep(5); }}
        onBack={() => setStep(3)}
        whyText="Food is often the second largest contributor. Vegan < Vegetarian < Chicken < Beef. Huge difference."
        currentStep={4}
        totalSteps={7}
      />
    );
  }

  // Step 5: AC Usage (Screen 4)
  if (step === 5) {
    return (
      <QuestionStep 
        title="What is your average daily AC usage?" 
        icon={<Home size={28} className="text-emerald-600" />}
        options={[
          { label: 'No AC', value: 'No AC' },
          { label: '1 - 2 hours / day', value: '1-2 hrs/day' },
          { label: '3 - 6 hours / day', value: '3-6 hrs/day' },
          { label: '6 - 10 hours / day', value: '6-10 hrs/day' },
          { label: '10+ hours / day', value: '10+ hrs/day' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, energyUsage: val}); setStep(8); }}
        onBack={() => setStep(4)}
        whyText="In India AC usage alone can dominate household emissions."
        currentStep={5}
        totalSteps={7}
      />
    );
  }

  // Step 8: Shopping Frequency (Screen 5a)
  if (step === 8) {
    return (
      <QuestionStep 
        title="How often do you shop online/offline?" 
        icon={<ShoppingBag size={28} className="text-emerald-600" />}
        options={[
          { label: 'Rarely', value: 'Rarely' },
          { label: 'Monthly', value: 'Monthly' },
          { label: 'Few times a month', value: 'Few times/month' },
          { label: 'Weekly', value: 'Weekly' },
          { label: 'Multiple times a week', value: 'Multiple times/week' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, shoppingFreq: val}); setStep(9); }}
        onBack={() => setStep(5)}
        whyText="Fast fashion and e-commerce deliveries contribute significantly to carbon emissions."
        currentStep={6}
        totalSteps={7}
      />
    );
  }

  // Step 9: Flight Count (Screen 5b)
  if (step === 9) {
    return (
      <QuestionStep 
        title="How many flights did you take in the past year?" 
        icon={<Plane size={28} className="text-emerald-600" />}
        options={[
          { label: '0 flights', value: '0' },
          { label: '1 - 2 flights', value: '1-2' },
          { label: '3 - 5 flights', value: '3-5' },
          { label: '6 - 10 flights', value: '6-10' },
          { label: '10+ flights', value: '10+' }
        ]}
        onSelect={(val: string) => { setAnswers({...answers, flightsCount: val}); setStep(10); }}
        onBack={() => setStep(8)}
        whyText="One flight can generate more CO₂ than months of daily activities."
        currentStep={7}
        totalSteps={7}
      />
    );
  }

  // Step 10: Loading Screen
  if (step === 10) {
    return (
      <div className="flex flex-col h-full justify-center items-center px-8 relative overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#E8F8EA] rounded-full blur-3xl -z-10 animate-blob"></div>
        <div className="relative w-24 h-24 mb-8 flex justify-center items-center">
          <div className="absolute w-full h-full bg-[#E8F8EA] rounded-full animate-ping opacity-75"></div>
          <div className="w-16 h-16 bg-[#3B8B5D] rounded-full flex justify-center items-center text-white shadow-lg relative">
            <Leaf size={32} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 text-center leading-tight">Creating your<br/>Carbon DNA...</h2>
        <p className="text-gray-500 mt-3 text-center text-sm font-medium">Analyzing your habits to build your Green Profile.</p>
      </div>
    );
  }

  // Step 11 & Default Fallback: Carbon DNA Result Screen
  const dna = calculateCarbonDNA(answers);
  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-8 bg-gradient-to-b from-[#F2FBF4] via-white to-white overflow-y-auto scrollbar-hide">
      {/* Soft background glow */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-[#E8F8EA] rounded-full blur-3xl -z-10 opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-[#EEF8E2] rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>

      {/* Title */}
      <div className="text-center mb-6 mt-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2">
          <Sparkles size={11} className="text-emerald-700 animate-pulse" /> Analyzed Successfully
        </span>
        <h2 className="text-3xl font-black text-gray-900 leading-tight">Your Carbon DNA</h2>
        <p className="text-gray-500 text-xs font-semibold mt-1">Here is a snapshot of your initial footprint baseline.</p>
      </div>

      {/* Combined Score Card */}
      <div className="glass-card p-5 mb-6 bg-gradient-to-br from-[#E8F8EA] to-white shadow-sm border border-emerald-500/20 shrink-0">
        <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
          {/* Eco Score Column */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mb-2">Eco Score</span>
            <div className="relative flex items-center justify-center">
              <div className="w-18 h-18 rounded-full border-[6px] border-emerald-100 flex items-center justify-center bg-white/80 shadow-sm relative">
                <div className="absolute inset-0 rounded-full border-[6px] border-emerald-500 border-r-transparent border-t-transparent -rotate-45"></div>
                <span className="text-2xl font-black text-gray-900">{dna.ecoScore}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-600 mt-2">
              {dna.ecoScore >= 70 ? 'Excellent' : dna.ecoScore >= 40 ? 'Moderate' : 'High Risk'}
            </span>
          </div>

          {/* Estimated Footprint Column */}
          <div className="flex flex-col items-center justify-center text-center pl-4">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mb-2">Est. Footprint</span>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900 leading-none">{dna.annualFootprint}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">tons CO₂ / year</span>
            </div>
            <div className="mt-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
              ~{dna.monthlyFootprint}t / month
            </div>
          </div>
        </div>
      </div>

      {/* Carbon DNA Breakdown Card */}
      <div className="glass-card p-5 mb-6 shrink-0">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingDown size={16} className="text-emerald-600" /> Emissions Breakdown
        </h3>
        <div className="space-y-4">
          <DnaBar label="Transport" pct={dna.transportPct} colorClass="bg-emerald-500" icon="🚗" />
          <DnaBar label="Food" pct={dna.foodPct} colorClass="bg-amber-500" icon="🍔" />
          <DnaBar label="Energy" pct={dna.energyPct} colorClass="bg-sky-500" icon="⚡" />
          <DnaBar label="Shopping" pct={dna.shoppingPct} colorClass="bg-purple-500" icon="🛒" />
          <DnaBar label="Flights" pct={dna.flightsPct} colorClass="bg-indigo-500" icon="✈️" />
        </div>

        {/* Key Metric Highlights inside card */}
        <div className="mt-5 pt-4 border-t border-gray-100/80 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Main Source</span>
            <span className="text-xs font-bold text-gray-800 mt-0.5 block truncate">{dna.mainImpact}</span>
          </div>
          <div>
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Potential Save</span>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">{dna.reduction}% Reduction</span>
          </div>
        </div>
      </div>

      {/* Recommendations Card */}
      <div className="glass-card p-5 mb-6 shrink-0">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600" /> Recommended Actions
        </h3>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-4">
          {loadingRecs ? (
            <span className="text-emerald-600 animate-pulse">Generating personalized advice via Groq AI...</span>
          ) : aiRecs.length > 0 ? (
            <span className="text-emerald-700 flex items-center gap-1"><Sparkles size={11} className="text-emerald-500 animate-pulse" /> Custom Tailored by Groq AI</span>
          ) : (
            <>Based on your largest impact: <span className="text-emerald-700">{dna.mainImpact}</span></>
          )}
        </p>
        <div className="space-y-3">
          {(aiRecs.length > 0 ? aiRecs : dna.recommendations).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/20 border border-emerald-100/30">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs font-semibold text-gray-700 leading-normal">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Twin Baseline Info Banner */}
      <div className="mb-8 p-4 bg-emerald-950 text-white rounded-2xl flex items-start gap-3 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 translate-y-8 pointer-events-none"></div>
        <div className="p-2 bg-white/10 rounded-xl text-emerald-300 shrink-0">
          <Leaf size={16} className="animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">Carbon Twin Baseline Created</h4>
          <p className="text-[11px] text-emerald-100/90 leading-normal mt-1">
            We have set up your initial digital green twin using this profile. As you log everyday activities, your twin will evolve and reward you with Eco Score upgrades!
          </p>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleFinish}
        disabled={finishing}
        className="w-full bg-gradient-to-r from-[#4E9B6B] to-[#3B8B5D] hover:shadow-[0_4px_25px_rgba(59,139,93,0.3)] text-white font-bold py-4 rounded-full transition-all shadow-md text-base flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] shrink-0"
      >
        {finishing ? (
          <Loader size={20} className="animate-spin text-white" />
        ) : (
          <>
            Start My Journey <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}

interface QuestionStepProps {
  title: string;
  icon: React.ReactNode;
  options: { label: string; icon?: React.ReactNode; value: string }[];
  onSelect: (value: string) => void;
  onBack: () => void;
  whyText: string;
  currentStep: number;
  totalSteps: number;
}

function QuestionStep({
  title,
  icon,
  options,
  onSelect,
  onBack,
  whyText,
  currentStep,
  totalSteps,
}: QuestionStepProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="flex flex-col h-full px-6 pt-12 pb-8 relative overflow-y-auto scrollbar-hide bg-gradient-to-b from-[#F2FBF4] via-white to-white">
      {/* Background soft blob */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#E8F8EA] rounded-full blur-3xl -z-10 opacity-70 pointer-events-none"></div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-8 z-10">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back to previous question"
          className="bg-white/70 backdrop-blur-md border border-white/80 p-2.5 rounded-full shadow-sm hover:scale-105 hover:bg-white/95 active:scale-95 transition-all cursor-pointer focus:outline-none"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Question</span>
          <span className="text-sm font-bold text-gray-900">{currentStep} of {totalSteps}</span>
        </div>
      </div>

      {/* Modern thin progress bar */}
      <div className="w-full h-1.5 bg-gray-200/60 rounded-full mb-8 z-10 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Core Question Layout */}
      <div className="flex-1 flex flex-col z-10">
        {/* Category Icon */}
        <div className="w-14 h-14 bg-white/90 border border-white rounded-2xl flex justify-center items-center mb-5 shadow-sm hover:rotate-3 transition-transform">
          {icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-6">{title}</h2>

        {/* Options */}
        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="w-full text-left px-5 py-4 rounded-2xl border border-gray-200/80 bg-white/60 backdrop-blur-sm hover:border-emerald-500 hover:bg-[#F2FCF4] active:scale-[0.99] transition-all font-semibold text-gray-800 text-[15px] shadow-sm flex items-center gap-3 cursor-pointer group"
            >
              {opt.icon && (
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex justify-center items-center text-gray-600 group-hover:bg-emerald-100/50 group-hover:text-emerald-700 transition-colors">
                  {opt.icon}
                </div>
              )}
              <span className="flex-1">{opt.label}</span>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Why Callout Section */}
      <div className="mt-8 bg-emerald-50/50 backdrop-blur-sm border border-emerald-100/50 rounded-2xl p-4 text-xs text-emerald-800 leading-relaxed flex gap-3 items-start animate-fade-in shadow-sm">
        <div className="p-1.5 bg-emerald-100/80 text-emerald-800 rounded-lg shrink-0">
          <Leaf size={14} className="animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-700 block mb-1">Why?</span>
          <p className="font-medium text-[12px] text-emerald-900 leading-normal">{whyText}</p>
        </div>
      </div>
    </div>
  );
}

function DnaBar({ label, pct, colorClass, icon }: { label: string; pct: number; colorClass: string; icon: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        <span className="font-extrabold">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
