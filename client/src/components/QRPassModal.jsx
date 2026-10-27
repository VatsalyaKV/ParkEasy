import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle, Car, MapPin, Calendar, Clock, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

const QRPassModal = ({ isOpen, onClose, booking, onStatusUpdated }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  if (!isOpen || !booking) return null;

  const handleSimulateGateScan = async (action) => {
    setIsScanning(true);
    setScanResult(null);

    try {
      // Simulate real-world camera scanner reading latency (1 sec)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await api.post('/bookings/verify-gate-pass', {
        qrToken: booking.qrToken,
        action,
      });

      setIsScanning(false);
      setScanResult(res.data);
      if (onStatusUpdated) {
        onStatusUpdated(res.data.booking);
      }
    } catch (err) {
      console.error('Gate scan simulation error:', err);
      setIsScanning(false);
      alert(err.response?.data?.message || 'Gate pass verification failed');
    }
  };

  const isAlreadyActive = booking.bookingStatus === 'active';
  const isCompleted = booking.bookingStatus === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-tr from-brand-600 to-teal-500 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase mb-1">
            Official Smart Gate Pass
          </span>
          <h3 className="text-xl font-black tracking-tight">{booking.location?.name}</h3>
          <p className="text-xs text-brand-100 mt-0.5">Slot #{booking.slot?.slotNumber} • {booking.slot?.floor}</p>
        </div>

        {/* QR Code Body */}
        <div className="p-6 text-center space-y-5">
          {/* QR Code Frame */}
          <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 inline-block relative group">
            <QRCodeSVG
              value={booking.qrCodeData || booking.qrToken || booking.bookingReference}
              size={180}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
            <div className="absolute inset-x-0 bottom-1 flex justify-center">
              <span className="bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                {booking.bookingReference}
              </span>
            </div>
          </div>

          {/* Quick Details Chips */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Plate</span>
              <span className="font-extrabold text-slate-800 font-mono">
                {booking.vehicle?.licensePlate || 'Vehicle not available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
              <span className={`font-bold capitalize ${
                booking.bookingStatus === 'active' ? 'text-emerald-600' : 'text-brand-600'
              }`}>
                ● {booking.bookingStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid From</span>
              <span className="font-semibold text-slate-700">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid Till</span>
              <span className="font-semibold text-slate-700">
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Gate Scan Feedback */}
          {scanResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 inline mr-1" />
              {scanResult.message}
            </div>
          )}

          {/* Interactive Gate Simulation Trigger */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium">
              Simulate IoT Gate Scanner at Entry / Exit barrier:
            </p>
            {!isAlreadyActive && !isCompleted && (
              <button
                type="button"
                disabled={isScanning}
                onClick={() => handleSimulateGateScan('check-in')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating at Entry Gate...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 text-brand-400" />
                    <span>Simulate Entry Check-in</span>
                  </>
                )}
              </button>
            )}

            {isAlreadyActive && (
              <button
                type="button"
                disabled={isScanning}
                onClick={() => handleSimulateGateScan('check-out')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating at Exit Gate...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 text-amber-200" />
                    <span>Simulate Exit Check-out</span>
                  </>
                )}
              </button>
            )}

            {isCompleted && (
              <div className="text-xs text-slate-500 font-semibold py-1">
                ✓ Parking Session Completed. Pass Expired.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPassModal;
