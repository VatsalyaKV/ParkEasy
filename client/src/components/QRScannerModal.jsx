import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const extractQrToken = (value = '') => {
  const match = value.match(/parkeasy:\/\/gate\/([a-f0-9]{24,128})/i);
  return match ? match[1] : value.trim();
};

const QRScannerModal = ({ isOpen, onClose, onVerified }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [action, setAction] = useState('check-in');
  const [status, setStatus] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scannerSupported, setScannerSupported] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    setScannerSupported('BarcodeDetector' in window);
    setStatus('');

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !scannerSupported || !videoRef.current) return undefined;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        timerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              await verifyToken(extractQrToken(codes[0].rawValue));
            }
          } catch {
            // Camera frames can fail transiently while autofocus is changing.
          }
        }, 500);
      } catch (error) {
        setStatus(error.name === 'NotAllowedError'
          ? 'Camera permission was denied. Use the secure token field below.'
          : 'Camera scanning is unavailable on this device. Use the secure token field below.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen, scannerSupported, action]);

  const verifyToken = async (token) => {
    if (!token) return;
    setStatus('Verifying secure QR pass…');
    try {
      const res = await api.post('/bookings/verify-gate-pass', {
        qrToken: token,
        action,
      });
      setStatus(res.data.message);
      onVerified?.(res.data.booking);
      window.setTimeout(onClose, 700);
    } catch (error) {
      setStatus(error.response?.data?.message || 'QR verification failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 text-white p-5 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-brand-300">Gate Control</span>
            <h3 className="text-xl font-black mt-1">Scan Parking QR</h3>
            <p className="text-xs text-slate-400 mt-1">Verify the secure ParkEasy gate token.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['check-in', 'check-out'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAction(value)}
                className={`py-2.5 rounded-xl text-xs font-bold border capitalize ${
                  action === value ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {value.replace('-', ' ')}
              </button>
            ))}
          </div>

          {scannerSupported ? (
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-8 border-2 border-white/80 rounded-2xl pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-center text-[11px] font-semibold text-white bg-black/50 rounded-lg px-3 py-2">
                Point the camera at the booking QR
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Native QR camera scanning is not supported here.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Secure token fallback</label>
            <div className="flex gap-2">
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste QR token"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => verifyToken(extractQrToken(manualToken))}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Verify
              </button>
            </div>
          </div>

          {status && (
            <div className="flex gap-2 items-start p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {status.includes('Verifying') ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
