import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Clock3,
  Zap,
  Leaf,
  Bell,
  UserRound,
  LogOut,
  MapPinned,
} from 'lucide-react';

const UserSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const groups = [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Overview',
          path: '/user/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Find parking',
          path: '/search',
          icon: Search,
        },
        {
          label: 'My bookings',
          path: '/my-bookings',
          icon: CalendarCheck,
        },
      ],
    },
    {
      title: 'Smart mobility',
      items: [
        {
          label: 'Space handover',
          path: '/handover',
          icon: Clock3,
        },
        {
          label: 'Smart arrival',
          path: '/smart-arrival',
          icon: Zap,
        },
        {
          label: 'EcoPark & EV',
          path: '/ecopark',
          icon: Leaf,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Notifications',
          path: '/notifications',
          icon: Bell,
        },
        {
          label: 'Vehicles & profile',
          path: '/profile',
          icon: UserRound,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col">

      {/* Profile */}
      <div className="pe-sidebar-profile">
        <div className="flex items-center gap-3">
          <div className="pe-sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-extrabold truncate">
              {user?.name || 'Driver'}
            </div>

            <div className="text-[10px] text-slate-500 truncate">
              Personal parking account
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-[#77dcca]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20c6a9] pe-pulse" />
          ParkEasy account active
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">

        {groups.map((group) => (
          <div key={group.title}>

            <div className="pe-sidebar-label">
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `pe-sidebar-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}

      </nav>

      {/* Location shortcut */}
      <NavLink
        to="/search"
        className="mx-1 mb-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
      >
        <div className="flex items-center gap-2 text-[#77dcca]">
          <MapPinned size={17} />
          <span className="text-xs font-bold">
            Parking near me
          </span>
        </div>

        <p className="mt-1 text-[10px] text-slate-500">
          Discover available spaces around you
        </p>
      </NavLink>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
      >
        <LogOut size={17} />
        Sign out
      </button>

    </div>
  );
};

export default UserSidebar;