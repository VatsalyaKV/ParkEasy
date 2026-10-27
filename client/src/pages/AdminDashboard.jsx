import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Building,
  Grid,
  CalendarCheck,
  DollarSign,
  Activity,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            System Overseer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            High-level platform oversight across all connected parking hubs, users, and transactions.
          </p>
        </div>

        {/* Quick System Health Pill */}
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Health</span>
            <h4 className="text-sm font-bold text-emerald-400">API Connected</h4>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (7 Required Core Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={s.totalUsers || 0}
          subtext="Registered motorists"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Parking Owners"
          value={s.totalOwners || 0}
          subtext="Commercial partners"
          icon={Briefcase}
          color="amber"
        />
        <StatCard
          title="Parking Locations"
          value={s.totalLocations || 0}
          subtext="Smart city hubs"
          icon={Building}
          color="brand"
        />
        <StatCard
          title="Total Slots"
          value={s.totalSlots || 0}
          subtext={`${s.evSlots || 0} EV charging bays`}
          icon={Grid}
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={s.totalBookings || 0}
          subtext="Processed reservations"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Active Reservations"
          value={s.activeReservations || 0}
          subtext="Vehicles currently parked"
          icon={Activity}
          color="rose"
        />
        <StatCard
          title="Platform Revenue"
          value={`₹${s.totalRevenue || 0}`}
          subtext="Total transaction volume"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Global Occupancy"
          value={`${s.occupancyRate || 0}%`}
          subtext={`${s.availableSlots || 0} vacant slots`}
          icon={Building}
          color="amber"
        />
      </div>

      {/* Recent Platform Bookings */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Live Platform Booking Feed</h3>
            <p className="text-xs text-slate-400">Global bookings occurring across all parking locations</p>
          </div>
          <Link to="/admin/bookings" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
            All Bookings
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(s.recentBookings || []).map((b) => (
                <tr key={b._id} className="hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{b.bookingReference}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">{b.user?.name || 'Driver'}</td>
                  <td className="py-3.5 px-4 text-slate-300">{b.location?.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">#{b.slot?.slotNumber}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.bookingStatus === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : b.bookingStatus === 'confirmed'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
