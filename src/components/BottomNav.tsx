import { Home, BarChart2, Leaf, MessageSquare, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <div className="absolute bottom-6 left-5 right-5 z-[100] bg-white/55 backdrop-blur-lg border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-[28px] transition-all duration-300">
      <div className="flex justify-between items-center px-5 h-[66px] relative">
        <NavItem to="/" icon={Home} label="Dashboard" currentPath={location.pathname} />
        <NavItem to="/impact" icon={BarChart2} label="Carbon Impact Metrics" currentPath={location.pathname} />
        <NavItem to="/add-activity" icon={Leaf} label="Log Daily Eco Action" currentPath={location.pathname} />
        <NavItem to="/ai-coach" icon={MessageSquare} label="Eco AI Coach Chat" currentPath={location.pathname} />
        <NavItem to="/profile" icon={User} label="User Profile" currentPath={location.pathname} />
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, currentPath }: { to: string, icon: React.ComponentType<{ size?: number; strokeWidth?: number }>, label: string, currentPath: string }) {
  const isActive = currentPath === to;
  return (
    <NavLink 
      to={to} 
      aria-label={label}
      className="relative p-2 flex flex-col items-center justify-center transition-all duration-200 rounded-xl"
    >
      <div className={`transition-all duration-200 ${isActive ? 'text-eco-green scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      {isActive && (
        <span className="absolute bottom-0 w-1.5 h-1.5 bg-eco-green rounded-full" />
      )}
    </NavLink>
  );
}


