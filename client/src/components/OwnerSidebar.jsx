import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Grid,
  DollarSign,
  CalendarCheck,
  Users,
  TrendingUp,
  LogOut,
  Building,
} from 'lucide-react';

const OwnerSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Parking Locations', path: '/owner/locations', icon: MapPin },
    { name: 'Manage Slots', path: '/owner/slots', icon: Grid },
    { name: 'Pricing & EV Tiers', path: '/owner/pricing', icon: DollarSign },
    { name: 'Reservations', path: '/owner/reservations', icon: CalendarCheck },
    { name: 'Parked Customers', path: '/owner/users', icon: Users },
    { name: 'Revenue Analytics', path: '/owner/revenue', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Owner Profile Badge */}
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">{user?.name}</h4>
            <span className="text-[11px] text-amber-400 font-medium">Facility Owner</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Owner Management
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
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border-l-4 border-amber-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

      <div className="p-4 border-t border-slate-800">
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

export default OwnerSidebar;
