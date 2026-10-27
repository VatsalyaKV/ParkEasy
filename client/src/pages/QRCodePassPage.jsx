import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ShieldCheck, ChevronLeft, Clock, Car, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const QRCodePassPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleSimulateScan = async (action) => {
    setScanning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await api.post('/bookings/verify-gate-pass', {
        qrToken: booking.qrToken,
        action,
      });
      alert(res.data.message);
      fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setScanning(false);
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
      <div className="text-center py-12">
        <p className="text-slate-600">Booking pass not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-16">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Pass Container */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl space-y-6">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-6 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400">Official ParkEasy Gate Pass</span>
          <h2 className="text-xl font-bold">{booking.location?.name}</h2>
          <p className="text-xs text-slate-400">Slot #{booking.slot?.slotNumber} • {booking.slot?.floor}</p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-mono text-xs text-brand-300">
              Live Time: {currentTime}
            </span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 text-center space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 inline-block">
            <QRCodeSVG
              value={booking.qrCodeData || booking.bookingReference}
              size={220}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
            <span className="block mt-2 font-mono font-bold text-xs text-slate-700">
              {booking.bookingReference}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Vehicle</span>
              <p className="font-extrabold text-slate-900 font-mono">{booking.vehicle?.licensePlate}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Pass Status</span>
              <p className={`font-bold capitalize ${
                booking.bookingStatus === 'active' ? 'text-emerald-600' : 'text-brand-600'
              }`}>
                ● {booking.bookingStatus}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Start Time</span>
              <p className="font-semibold text-slate-700">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">End Time</span>
              <p className="font-semibold text-slate-700">
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Gate Scanner Simulator Button */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">Gate QR Scanner</p>
            {booking.bookingStatus === 'confirmed' && (
              <button
                type="button"
                disabled={scanning}
                onClick={() => handleSimulateScan('check-in')}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4 text-brand-400" />}
                <span>Simulate Boom Barrier Check-in</span>
              </button>
            )}

            {booking.bookingStatus === 'active' && (
              <button
                type="button"
                disabled={scanning}
                onClick={() => handleSimulateScan('check-out')}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4 text-amber-200" />}
                <span>Simulate Exit Gate Check-out</span>
              </button>
            )}

            {booking.bookingStatus === 'completed' && (
              <div className="p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700">
                ✓ Check-out Verified. Session Completed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePassPage;
