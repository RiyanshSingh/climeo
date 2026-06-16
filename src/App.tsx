import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { useAppContext } from './context/AppContext';

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Impact = lazy(() => import('./pages/Impact'));
const AICoach = lazy(() => import('./pages/AICoach'));
const ActivityTracker = lazy(() => import('./pages/ActivityTracker'));
const Simulator = lazy(() => import('./pages/Simulator'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAppContext();

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [user, loading, location.pathname, navigate]);

  const hideNav = location.pathname === '/onboarding' || location.pathname === '/ai-coach';

  return (
    <div className="bg-gray-100 fixed inset-0 overflow-hidden flex justify-center items-center font-sans">
      {/* Mobile App Container */}
      <div className="w-full sm:w-[406px] h-full sm:h-[725px] bg-gradient-to-b from-eco-green-light via-eco-bg to-white relative overflow-hidden sm:rounded-[3rem] sm:border-[8px] sm:border-white sm:shadow-2xl flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 min-h-0 relative">
          <Suspense fallback={<div className="h-full flex items-center justify-center text-sm font-semibold text-emerald-700">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/ai-coach" element={<AICoach />} />
              <Route path="/add-activity" element={<ActivityTracker />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>

        {/* Bottom Navigation */}
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
