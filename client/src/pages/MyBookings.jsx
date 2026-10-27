import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Clock,
  QrCode,
  XCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Car,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import QRPassModal from '../components/QRPassModal';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'active', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let endpoint = '/bookings';
      if (activeTab !== 'all') {
        endpoint += `?status=${activeTab}`;
      }
      const res = await api.get(endpoint);
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you wish to cancel this reservation? The slot will be released and payment refunded.')) {
      return;
    }

    try {
      const res = await api.put(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        alert('Booking cancelled successfully.');
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bookingReference.toLowerCase().includes(q) ||
      b.location?.name.toLowerCase().includes(q) ||
      b.vehicle?.licensePlate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Parking Reservations</h1>
          <p className="text-xs text-slate-500">Track active sessions, gate passes, and booking history</p>
        </div>

        <Link
          to="/search"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow flex items-center gap-1.5 self-start transition-colors"
        >
          <span>Reserve New Bay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference or plate..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No bookings found</h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'all'
              ? 'You have not made any parking reservations yet.'
              : `No bookings found with status '${activeTab}'.`}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 pt-2"
          >
            <span>Search available parking</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isCanCancel = b.bookingStatus === 'confirmed';
            const isActive = b.bookingStatus === 'active';

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {b.bookingReference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        b.bookingStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : b.bookingStatus === 'confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : b.bookingStatus === 'completed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      ● {b.bookingStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{b.location?.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.location?.address}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-600">
                    <span>
                      Bay: <strong className="text-brand-600 font-mono">#{b.slot?.slotNumber}</strong> ({b.slot?.floor})
                    </span>
                    <span>•</span>
                    <span>
                      Vehicle: <strong className="font-mono">{b.vehicle?.licensePlate}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Time: {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Actions & Amount */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-lg font-black text-slate-900">₹{b.finalAmount}</span>
                    <span className="text-[10px] text-slate-400 block">Paid via {b.paymentMethod}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View QR Code */}
                    <button
                      onClick={() => setSelectedQRBooking(b)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="Show Gate QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-brand-400" />
                      <span>QR Pass</span>
                    </button>

                    {/* Handover shortcut if active */}
                    {isActive && (
                      <Link
                        to="/handover"
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                      >
                        Handover
                      </Link>
                    )}

                    {/* Cancel Booking */}
                    {isCanCancel && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      to={`/booking-details/${b._id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Pass Modal */}
      {selectedQRBooking && (
        <QRPassModal
          isOpen={!!selectedQRBooking}
          onClose={() => setSelectedQRBooking(null)}
          booking={selectedQRBooking}
          onStatusUpdated={() => fetchBookings()}
        />
      )}
    </div>
  );
};

export default MyBookings;
