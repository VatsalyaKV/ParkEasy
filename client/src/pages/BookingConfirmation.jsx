import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  QrCode,
  Calendar,
  Clock,
  Car,
  MapPin,
  Printer,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import QRPassModal from '../components/QRPassModal';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching confirmed booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12 space-y-3">
        <h3 className="text-xl font-bold text-slate-800">Booking Record Not Found</h3>
        <button onClick={() => navigate('/my-bookings')} className="text-brand-600 font-bold text-sm">
          Go to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Success Badge Banner */}
      <div className={`bg-white rounded-3xl p-8 border shadow-sm text-center space-y-4 ${
        booking.paymentStatus === 'completed' ? 'border-slate-200' : 'border-amber-200'
      }`}>
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            booking.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {booking.paymentStatus === 'completed' ? 'Payment Verified' : 'Payment Pending'}
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {booking.paymentStatus === 'completed' ? 'Booking Confirmed!' : 'Complete Your Payment'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your parking bay has been reserved. Show your digital gate pass on arrival.
          </p>
        </div>

        <div className="inline-block bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700">
          Booking Reference: <span className="text-brand-600">{booking.bookingReference}</span>
        </div>
      </div>

      {/* Reservation Receipt Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
          Digital Parking Pass Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Parking Location</span>
            <h4 className="text-base font-bold text-slate-900">{booking.location?.name}</h4>
            <p className="text-slate-500">{booking.location?.address}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Assigned Slot</span>
            <h4 className="text-2xl font-black text-brand-600 font-mono">
              #{booking.slot?.slotNumber} <span className="text-xs font-normal text-slate-500">({booking.slot?.floor})</span>
            </h4>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Registered Vehicle</span>
            <p className="text-sm font-bold text-slate-900 font-mono">{booking.vehicle?.licensePlate}</p>
            <p className="text-slate-500">{booking.vehicle?.make} {booking.vehicle?.model}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Time Window</span>
            <p className="text-sm font-bold text-slate-900">
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-500">{new Date(booking.startTime).toLocaleDateString()} ({booking.durationHours} hrs)</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 block">{booking.paymentStatus === 'completed' ? `Amount Paid (via ${booking.paymentMethod})` : 'Amount Due'}:</span>
            <span className="text-lg font-black text-slate-900">₹{booking.finalAmount}</span>
          </div>
          <div className="text-right">
            <span className="text-emerald-600 font-bold block">+ {booking.ecoPointsEarned || 20} Eco Points</span>
            <span className="text-slate-400 text-[10px]">{booking.paymentStatus === 'completed' ? 'Added to your wallet' : 'Earned after payment'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {booking.paymentStatus === 'completed' && (
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Open Gate QR Pass & Scanner</span>
          </button>
          )}

          <Link
            to="/my-bookings"
            className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>View All My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* QR Modal */}
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

export default BookingConfirmation;
