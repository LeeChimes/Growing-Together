import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Book, 
  Calendar, 
  Users, 
  Image, 
  CheckSquare, 
  Leaf, 
  Settings,
  Shield
} from 'lucide-react';

const AuthContext = React.createContext();
const useAuth = () => useContext(AuthContext);

const Navigation = () => {
  const location = useLocation();
  const auth = useAuth();
  
  if (!auth) return null;
  
  const { user, isAdmin } = auth;

  if (!user || location.pathname === '/auth') return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/diary', icon: Book, label: 'Diary' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/gallery', icon: Image, label: 'Gallery' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/plants', icon: Leaf, label: 'Plants' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-200 shadow-lg z-50 md:top-0 md:bottom-auto md:border-b-2 md:border-t-0">
      <div className="flex justify-around items-center py-2 md:px-4 max-w-6xl mx-auto">
        {/* Logo on desktop */}
        <div className="hidden md:flex items-center space-x-2 mr-8">
          <img 
            src="/logos/growing-logo-128.png" 
            alt="Growing Together" 
            className="h-10 w-10"
            onError={(e) => {e.target.style.display = 'none'}}
          />
          <span className="font-bold text-green-700 text-lg">Growing Together</span>
        </div>

        {/* Navigation items */}
        <div className="flex justify-around items-center flex-1 md:flex-none md:space-x-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* More menu for desktop */}
        <div className="hidden md:block">
          <div className="flex space-x-1">
            {navItems.slice(5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile more button */}
        <div className="md:hidden">
          <Link
            to="/settings"
            className={`nav-item flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200 ${
              ['/tasks', '/plants', '/settings', '/admin'].includes(location.pathname)
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
            data-testid="nav-more"
          >
            <Settings size={20} />
            <span className="text-xs mt-1 font-medium">More</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;