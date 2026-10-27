import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Car,
  CreditCard,
  ShieldCheck,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import QRPassModal from '../components/QRPassModal';

const BookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.data);
        setPayment(res.data.payment);
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking and release slot?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      alert('Booking cancelled.');
      fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600">Booking record not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to bookings</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono font-bold text-slate-500">Ref: {booking.bookingReference}</span>
            <h1 className="text-2xl font-bold text-slate-900">{booking.location?.name}</h1>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              booking.bookingStatus === 'active'
                ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                : booking.bookingStatus === 'confirmed'
                ? 'bg-amber-100 text-amber-800'
                : booking.bookingStatus === 'completed'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            ● {booking.bookingStatus}
          </span>
        </div>

        {/* 4 Block Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Parking Location</span>
            <p className="font-bold text-slate-800 text-sm">{booking.location?.name}</p>
            <p className="text-slate-500">{booking.location?.address}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Bay Reserved</span>
            <p className="text-xl font-black text-brand-600 font-mono">
              #{booking.slot?.slotNumber} ({booking.slot?.floor})
            </p>
            <p className="text-slate-500">Type: {booking.slot?.type}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Vehicle Assigned</span>
            <p className="text-sm font-bold text-slate-800 font-mono">{booking.vehicle?.licensePlate}</p>
            <p className="text-slate-500">{booking.vehicle?.make} {booking.vehicle?.model}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Time Interval</span>
            <p className="text-sm font-bold text-slate-800">
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-500">{new Date(booking.startTime).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Check-in / Check-out timestamps */}
        {(booking.checkInTime || booking.checkOutTime) && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
            {booking.checkInTime && (
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Gate Check-in Time</span>
                <p className="font-bold text-slate-800">{new Date(booking.checkInTime).toLocaleTimeString()}</p>
              </div>
            )}
            {booking.checkOutTime && (
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Gate Check-out Time</span>
                <p className="font-bold text-slate-800">{new Date(booking.checkOutTime).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <h4 className="font-bold text-slate-800">Payment Breakdown</h4>
          <div className="flex justify-between text-slate-600">
            <span>Base Rate ({booking.durationHours} hrs):</span>
            <span>₹{booking.basePrice}</span>
          </div>
          {booking.evDiscount > 0 && (
            <div className="flex justify-between text-blue-700">
              <span>EcoPark EV Discount:</span>
              <span>- ₹{booking.evDiscount}</span>
            </div>
          )}
          {booking.pointsDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Points Discount:</span>
              <span>- ₹{booking.pointsDiscount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Paid (via {booking.paymentMethod}):</span>
            <span className="text-base">₹{booking.finalAmount}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Show QR Gate Pass</span>
          </button>

          {booking.bookingStatus === 'confirmed' && (
            <button
              onClick={handleCancel}
              className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors"
            >
              Cancel Reservation
            </button>
          )}
        </div>
      </div>

      {isQRModalOpen && (
        <QRPassModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          booking={booking}
          onStatusUpdated={(updated) => setBooking(updated)}
        />
      )}
    </div>
  );
};

export default BookingDetails;
