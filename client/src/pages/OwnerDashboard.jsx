import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Grid,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  MapPin,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';

const OwnerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/owner/dashboard');
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching owner dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const d = dashboardData || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
            <span>Facility Management Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Owner Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-lg">
            Monitor real-time bay occupancy, adjust hourly rates, and oversee reservation turnovers.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/owner/locations"
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </Link>
          <Link
            to="/owner/slots"
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/20 text-white font-bold text-xs hover:bg-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <Grid className="w-4 h-4" />
            <span>Manage Slots</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Facilities"
          value={d.totalLocations || 0}
          subtext="Active parking hubs"
          icon={Building}
          color="amber"
        />
        <StatCard
          title="Slot Occupancy"
          value={`${d.occupancyRate || 0}%`}
          subtext={`${d.occupiedSlots || 0} occupied / ${d.totalSlots || 0} bays`}
          icon={Grid}
          color="brand"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${d.todayRevenue || 0}`}
          subtext={`${d.todayBookingsCount || 0} bookings completed today`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Upcoming Reservations"
          value={d.upcomingReservationsCount || 0}
          subtext="Awaiting gate arrival"
          icon={CalendarCheck}
          color="blue"
        />
      </div>

      {/* Live Charts Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Bookings Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Booking & Turnaround Trends</h3>
              <p className="text-xs text-slate-500">Daily reservation volumes across your facilities</p>
            </div>
            <Link to="/owner/revenue" className="text-xs font-bold text-amber-600 hover:text-amber-700">
              Detailed Revenue
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-3 h-48 items-end pt-4">
            {(d.dailyBookingsChart || []).map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-bold text-slate-700">₹{bar.revenue}</span>
                <div
                  style={{ height: `${Math.min(100, Math.max(25, bar.bookings * 6))}%` }}
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-xl transition-all hover:opacity-90 relative group"
                >
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap z-10">
                    {bar.bookings} bookings
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Utilization Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Bay Utilization Breakdown</h3>
          <p className="text-xs text-slate-500">Real-time status of all managed parking bays</p>

          <div className="space-y-3 pt-2">
            {(d.slotUtilization || []).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value} Bays</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${d.totalSlots > 0 ? (item.value / d.totalSlots) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Customer Reservations</h3>
            <p className="text-xs text-slate-500">Latest check-in and booking logs</p>
          </div>
          <Link to="/owner/reservations" className="text-xs font-bold text-amber-600 hover:text-amber-700">
            View All Bookings
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(d.recentReservations || []).map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.bookingReference}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.user?.name || 'Driver'}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600">#{r.slot?.slotNumber}</td>
                  <td className="py-3.5 px-4 font-mono">{r.vehicle?.licensePlate || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.bookingStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.bookingStatus === 'confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.bookingStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">₹{r.finalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
