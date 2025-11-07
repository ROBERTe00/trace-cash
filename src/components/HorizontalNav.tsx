import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Target, 
  Settings,
  BarChart3,
  GraduationCap
} from 'lucide-react';

export function HorizontalNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Wallet },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/ai-educator', label: 'AI Educator', icon: GraduationCap },
    { path: '/investments', label: 'Investments', icon: TrendingUp },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <nav className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-400 bg-clip-text text-transparent">
              MyMoney.ai
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
