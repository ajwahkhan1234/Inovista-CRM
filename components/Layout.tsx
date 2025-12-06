import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LayoutDashboard, Briefcase, Users, LogOut, Menu, X, Settings, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../App';
import { LOGO_URL } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isTeam = user?.role === 'TEAM';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Briefcase },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  if (isAdmin || isTeam) {
    navItems.push({ name: 'Clients', path: '/clients', icon: Users });
  }

  if (isAdmin) {
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-24 flex flex-col justify-center px-6 border-b border-slate-100">
            <div className="flex items-center justify-start">
               <img src={LOGO_URL} alt="INOVISTA" className="h-10 w-auto object-contain" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium ml-1 mt-1 tracking-wide">Where Ideas Meet Innovation</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-sky-50 text-sky-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center w-full p-2 rounded-lg bg-slate-50 mb-3">
              <img 
                src={user?.avatar || 'https://via.placeholder.com/40'} 
                alt="Avatar" 
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">
                    {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'TEAM' ? 'Developer' : 'Client Portal'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div className="ml-3">
                 <img src={LOGO_URL} alt="INOVISTA" className="h-8 w-auto object-contain" />
            </div>
          </div>
          <img 
            src={user?.avatar} 
            alt="Profile" 
            className="w-8 h-8 rounded-full bg-slate-200"
          />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;