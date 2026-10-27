import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Briefcase,
  MapPin,
  CalendarCheck,
  CreditCard,
  BarChart3,
  LogOut,
  Sliders,
} from 'lucide-react';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'System Overview', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Manage Owners', path: '/admin/owners', icon: Briefcase },
    { name: 'Parking Locations', path: '/admin/locations', icon: MapPin },
    { name: 'Master Bookings', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'System Analytics', path: '/admin/analytics', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Admin Badge */}
        <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">{user?.name}</h4>
            <span className="text-[11px] text-indigo-400 font-semibold tracking-wide">SUPER ADMIN</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Administration
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-4 border-indigo-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
