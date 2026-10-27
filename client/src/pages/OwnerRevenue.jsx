import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Zap, Download, Calendar, BarChart3, PieChart, Loader2 } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';

const OwnerRevenue = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const res = await api.get('/owner/revenue');
        if (res.data.success) {
          setRevenueData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  const handleExportCSV = () => {
    if (!revenueData) return;
    const headers = 'Facility Name,Revenue (INR)\n';
    const rows = revenueData.revenueByLocation
      .map((r) => `"${r.name}",${r.revenue}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ParkEasy_Owner_Revenue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const d = revenueData || {};

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue & Financial Analytics</h1>
          <p className="text-xs text-slate-500">Facility earnings, average ticket sizes, and EV incentive breakdown</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors self-start"
        >
          <Download className="w-4 h-4 text-brand-400" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Gross Revenue"
          value={`₹${d.totalRevenue || 0}`}
          subtext={`${d.bookingsCount || 0} completed transactions`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="EV Green Revenue"
          value={`₹${d.evRevenue || 0}`}
          subtext="Revenue from clean electric vehicles"
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Standard Revenue"
          value={`₹${d.regularRevenue || 0}`}
          subtext="Standard ICE vehicle parking"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Average Ticket Size"
          value={`₹${d.averageTicketSize || 0}`}
          subtext="Per-reservation average earnings"
          icon={BarChart3}
          color="brand"
        />
      </div>

      {/* Revenue per Location Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">Revenue per Parking Facility</h3>

        <div className="space-y-4">
          {(d.revenueByLocation || []).map((loc, idx) => {
            const percentage = d.totalRevenue > 0 ? Math.round((loc.revenue / d.totalRevenue) * 100) : 0;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">{loc.name}</span>
                  <span className="text-slate-900">₹{loc.revenue} ({percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OwnerRevenue;
