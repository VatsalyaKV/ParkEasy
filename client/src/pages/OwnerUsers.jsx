import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Car, Calendar, DollarSign, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

const OwnerUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/owner/users');
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parked Customer Directory</h1>
          <p className="text-xs text-slate-500">Drivers who have parked at your facilities with visit history</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          {customers.length} Unique Drivers Registered
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Customer Records Yet</h3>
          <p className="text-xs text-slate-500">When motorists book your slots, their profiles will populate here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-base font-bold text-slate-900 truncate">{c.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Visits:</span>
                  <span className="font-bold text-slate-900">{c.totalBookings} Bookings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="font-bold text-emerald-600">₹{c.totalSpent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Vehicle:</span>
                  <span className="font-semibold text-slate-800 font-mono truncate max-w-[140px] text-right">
                    {c.lastVehicle}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Last visited:</span>
                <span>{new Date(c.lastVisit).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerUsers;
