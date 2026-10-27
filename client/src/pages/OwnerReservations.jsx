import React, { useState, useEffect } from 'react';
import { Search, CalendarCheck, CheckCircle2, QrCode, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import QRScannerModal from '../components/QRScannerModal';

const OwnerReservations = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      let query = `/owner/reservations?status=${statusFilter}`;
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
    fetchReservations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleManualCheckIn = async (ref, action) => {
    try {
      const res = await api.post('/bookings/verify-gate-pass', {
        qrToken: bookings.find((b) => b.bookingReference === ref)?.qrToken,
        action,
      });
      alert(res.data.message);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facility Reservations Ledger</h1>
          <p className="text-xs text-slate-500">Live booking feed across all your managed parking properties</p>
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm"
        >
          Scan Gate QR
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, plate or driver..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No reservations found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Facility & Bay</th>
                  <th className="py-3.5 px-4">Vehicle Plate</th>
                  <th className="py-3.5 px-4">Time Window</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.bookingReference}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{b.user?.name || 'Driver'}</span>
                      <span className="text-[10px] text-slate-400">{b.user?.phone || b.user?.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{b.location?.name}</span>
                      <span className="text-[10px] text-brand-600 font-mono font-bold">Slot #{b.slot?.slotNumber} ({b.slot?.floor})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {b.vehicle?.licensePlate || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.bookingStatus === 'confirmed'
                            ? 'bg-amber-100 text-amber-800'
                            : b.bookingStatus === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{b.finalAmount}</td>
                    <td className="py-3.5 px-4 text-right">
                      {b.bookingStatus === 'confirmed' && (
                        <button
                          onClick={() => handleManualCheckIn(b.bookingReference, 'check-in')}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition-colors"
                        >
                          Gate Check-in
                        </button>
                      )}
                      {b.bookingStatus === 'active' && (
                        <button
                          onClick={() => handleManualCheckIn(b.bookingReference, 'check-out')}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors"
                        >
                          Gate Check-out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onVerified={() => fetchReservations()}
      />
    </div>
  );
};

export default OwnerReservations;
