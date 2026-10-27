import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  CarFront,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

const Navbar = () => {
  const {
    user,
    logout,
    isAuthenticated,
    isOwner,
    isAdmin,
  } = useAuth();

  const { isDark, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const dashboardPath = isAdmin
    ? '/admin/dashboard'
    : isOwner
      ? '/owner/dashboard'
      : '/user/dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Find Parking', path: '/search' },
    { label: 'How it works', path: '/how-it-works' },
    { label: 'EcoPark', path: '/ecopark' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header className="pe-navbar">
      <div className="pe-navbar-inner">

        {/* Brand */}
        <Link to="/" className="pe-brand">
          <div className="pe-brand-mark">
            <CarFront size={20} strokeWidth={2.5} />
          </div>

          <div>
            <div className="pe-brand-name">
              Park<span>Easy</span>
            </div>
            <div className="pe-brand-tagline">
              SMART PARKING PLATFORM
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`pe-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">

          <button
            onClick={toggleTheme}
            className="hidden sm:grid place-items-center w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title="Toggle theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="hidden sm:grid place-items-center w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <Bell size={17} />
              </Link>

              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="hidden md:flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16c3a8] to-[#087a6e] text-white grid place-items-center font-black text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>

                <div className="text-left">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white max-w-[100px] truncate">
                    {user?.name || 'Driver'}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">
                    {user?.role || 'Driver'}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  className="text-slate-400"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-5 top-[68px] z-[200] w-52 overflow-hidden rounded-2xl bg-white dark:bg-[#0d1b1e] border border-slate-200 dark:border-slate-700 shadow-2xl">
                  <Link
                    to={dashboardPath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <CarFront size={16} />
                    My vehicles
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}

              <Link
                to={dashboardPath}
                className="hidden sm:inline-flex pe-btn pe-btn-primary"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex pe-btn pe-btn-secondary"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="pe-btn pe-btn-primary"
              >
                Get started
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071416] px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
            >
              {item.label === 'Find Parking' ? (
                <Search size={17} />
              ) : (
                <CarFront size={17} />
              )}
              {item.label}
            </Link>
          ))}

          {isAuthenticated && (
            <Link
              to={dashboardPath}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#0d8e7c] bg-[#e7faf6]"
            >
              <LayoutDashboard size={17} />
              Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;