import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let query = `/admin/bookings?status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleStatusOverride = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      setBookings(bookings.map((b) => (b._id === bookingId ? { ...b, bookingStatus: newStatus } : b)));
    } catch (err) {
      alert('Failed to override status');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Master Reservation Ledger</h1>
          <p className="text-xs text-slate-400">Complete audit trail of all platform parking sessions</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, user or location..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Ref</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Facility & Slot</th>
                  <th className="py-3.5 px-4">Plate</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Status Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{b.bookingReference}</td>
                    <td className="py-3.5 px-4 text-slate-300">{b.user?.name || 'Driver'}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300 block">{b.location?.name}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">#{b.slot?.slotNumber} ({b.slot?.floor})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{b.vehicle?.licensePlate || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{b.finalAmount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : b.bookingStatus === 'confirmed'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : b.bookingStatus === 'completed'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={b.bookingStatus}
                        onChange={(e) => handleStatusOverride(b._id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
