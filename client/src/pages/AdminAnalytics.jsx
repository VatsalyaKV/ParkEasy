import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, Leaf, CreditCard, Handshake, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data.success) setData(res.data.data);
      } catch (error) {
        console.error('Analytics load failed:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  }

  const paymentMethods = data?.paymentMethods || [];
  const handovers = data?.handoverStats || [];
  const peakHours = data?.peakHours || [];
  const maxBookings = Math.max(...peakHours.map((item) => item.bookings), 1);
  const successful = data?.successfulPayments || 0;
  const completedHandovers = handovers.find((item) => item.status === 'Completed')?.count || 0;
  const totalHandoverRecords = handovers.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform System Analytics</h1>
        <p className="text-xs text-slate-400">Live aggregates from ParkEasy MongoDB records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          ['Successful Payments', successful, CreditCard],
          ['Completed Handovers', completedHandovers, Handshake],
          ['EV Slot Share', `${data?.evSharePercent || 0}%`, Leaf],
        ].map(([label, value, Icon]) => (
          <div key={label} className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
            <Icon className="w-5 h-5 text-indigo-400 mb-4" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</p>
            <h3 className="text-3xl font-black text-white mt-1">{value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="font-bold text-white">Booking Activity by Arrival Hour</h3>
            <p className="text-xs text-slate-500">Calculated from actual booking start times</p>
          </div>
        </div>
        {peakHours.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-500">No booking records yet.</p>
        ) : (
          <div className="flex items-end gap-2 h-56 pt-5 overflow-x-auto">
            {peakHours.map((item) => (
              <div key={item.hour} className="min-w-10 h-full flex flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-bold text-slate-300">{item.bookings}</span>
                <div
                  className="w-7 rounded-t-lg bg-indigo-500"
                  style={{ height: `${Math.max(8, (item.bookings / maxBookings) * 75)}%` }}
                  title={`${item.bookings} bookings at ${item.hour}:00`}
                />
                <span className="text-[10px] text-slate-500">{item.hour}:00</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-white">Payment Channels</h3>
          <p className="text-xs text-slate-500 mt-1">Successful simulated test payments stored in MongoDB</p>
          <div className="mt-5 space-y-3">
            {paymentMethods.map((item) => (
              <div key={item.method} className="flex items-center justify-between p-3 rounded-xl bg-slate-900">
                <span className="text-xs font-semibold text-slate-300">{item.method}</span>
                <span className="text-xs font-bold text-indigo-300">{item.count} txns · ₹{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-white">Parking Space Handover</h3>
          <p className="text-xs text-slate-500 mt-1">Actual lifecycle records, not predefined success percentages</p>
          <div className="mt-5 space-y-3">
            {handovers.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-900">
                <span className="text-xs font-semibold text-slate-300">{item.status.replaceAll('_', ' ')}</span>
                <span className="text-xs font-black text-emerald-300">{item.count}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {totalHandoverRecords ? `${completedHandovers} of ${totalHandoverRecords} recorded handover requests are completed.` : 'No handover records yet.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
