import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Clock,
  Calendar,
  Zap,
  Leaf,
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

const Reservation = () => {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('locationId');
  const slotId = searchParams.get('slotId');

  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [slot, setSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [durationHours, setDurationHours] = useState(2);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // New vehicle inline form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    make: '',
    model: '',
    type: 'Car',
    isEV: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locRes, slotsRes, vehiclesRes] = await Promise.all([
          api.get(`/parking/${locationId}`),
          api.get(`/parking/${locationId}/slots`),
          api.get('/vehicles'),
        ]);

        if (locRes.data.success) setLocation(locRes.data.data);
        if (slotsRes.data.success) {
          const foundSlot = slotsRes.data.data.find((s) => s._id === slotId);
          setSlot(foundSlot);
        }
        if (vehiclesRes.data.success) {
          setVehicles(vehiclesRes.data.data);
          const defaultVeh = vehiclesRes.data.data.find((v) => v.isDefault) || vehiclesRes.data.data[0];
          if (defaultVeh) setSelectedVehicleId(defaultVeh._id);
        }
      } catch (err) {
        console.error('Reservation load error:', err);
        setError('Failed to load reservation parameters');
      } finally {
        setLoading(false);
      }
    };

    if (locationId && slotId) {
      fetchData();
    } else {
      setError('Missing location or slot parameter');
      setLoading(false);
    }
  }, [locationId, slotId]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/vehicles', newVehicle);
      if (res.data.success) {
        setVehicles([res.data.data, ...vehicles]);
        setSelectedVehicleId(res.data.data._id);
        setShowAddVehicle(false);
        setNewVehicle({ licensePlate: '', make: '', model: '', type: 'Car', isEV: false });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add vehicle');
    }
  };

  // Pricing calculations
  const selectedVehicle = vehicles.find((v) => v._id === selectedVehicleId);
  const isEV = selectedVehicle?.isEV || slot?.type === 'EV';

  const hourlyRate = isEV && location?.evHourlyRate ? location.evHourlyRate : location?.hourlyRate || 40;
  const basePrice = hourlyRate * durationHours;
  const evDiscount = isEV ? (location?.evIncentiveDiscount || 20) : 0;
  const pointsDiscount = redeemPoints && (user?.ecoPoints || 0) >= 50 ? 20 : 0;
  const finalAmount = Math.max(10, basePrice - evDiscount - pointsDiscount);

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Please select or add a vehicle first');
      return;
    }

    try {
      // Create booking on server
      const res = await api.post('/bookings', {
        slotId,
        vehicleId: selectedVehicleId,
        startTime,
        durationHours,
        redeemPoints,
      });

      if (res.data.success) {
        const booking = res.data.data;
        setPendingBookingData({
          bookingId: booking._id,
          amount: finalAmount,
          evDiscount,
          pointsDiscount,
        });
        setIsPaymentModalOpen(true);
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      alert(err.response?.data?.message || 'Could not initiate booking');
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    refreshProfile();
    navigate(`/booking-confirmation/${pendingBookingData.bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !location || !slot) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">{error || 'Invalid Booking Request'}</h3>
        <button onClick={() => navigate('/search')} className="text-xs font-bold text-brand-600">
          Browse all parking hubs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Checkout</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Configure Parking Reservation</h1>
        <p className="text-xs text-slate-500">
          {location.name} • Bay #{slot.slotNumber} ({slot.floor})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vehicle Selection Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Select Vehicle</h3>
              <button
                type="button"
                onClick={() => setShowAddVehicle(!showAddVehicle)}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddVehicle ? 'Cancel' : 'Add New'}</span>
              </button>
            </div>

            {/* Quick Add Vehicle Inline Form */}
            {showAddVehicle && (
              <form onSubmit={handleAddVehicle} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Add Vehicle to Garage</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">License Plate</label>
                    <input
                      type="text"
                      required
                      placeholder="KA-01-AB-1234"
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-brand-500 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Make & Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Nexon EV"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value, make: e.target.value.split(' ')[0] || 'Car' })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newVehicle.isEV}
                      onChange={(e) => setNewVehicle({ ...newVehicle, isEV: e.target.checked, type: e.target.checked ? 'EV' : 'Car' })}
                      className="accent-brand-600"
                    />
                    <span>Electric Vehicle (EV) - Qualifies for EcoPark</span>
                  </label>
                  <button
                    type="submit"
                    className="ml-auto px-4 py-1.5 bg-brand-600 text-white rounded-lg font-bold text-xs"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            )}

            {vehicles.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No vehicles registered. Please click "+ Add New" above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <div
                    key={v._id}
                    onClick={() => setSelectedVehicleId(v._id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedVehicleId === v._id
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-900">{v.licensePlate}</span>
                      {v.isEV && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> EV
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{v.make} {v.model}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time Selection */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Date & Arrival Time</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Arrival</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours (Standard)</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours (Full Working Day)</option>
                  <option value={24}>24 Hours (Overnight)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Eco Points Redemption Toggle */}
          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">Redeem Eco Reward Points</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700">Balance: {user?.ecoPoints || 0} pts</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Use 100 Eco Points for an instant ₹20 discount on this smart parking session.
            </p>
            <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-bold text-emerald-800">
              <input
                type="checkbox"
                disabled={(user?.ecoPoints || 0) < 50}
                checked={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.checked)}
                className="accent-emerald-600 w-4 h-4 rounded"
              />
              <span>Apply 100 Eco Points discount (-₹20)</span>
            </label>
          </div>
        </div>

        {/* Right: Booking Summary & Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Reservation Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-900 text-right">{location.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Number:</span>
                <span className="font-bold text-slate-900 font-mono">#{slot.slotNumber} ({slot.floor})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Type:</span>
                <span className="font-bold text-slate-900">{slot.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-slate-900">{durationHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rate:</span>
                <span className="font-bold text-slate-900">₹{hourlyRate} / hr</span>
              </div>
            </div>

            {/* Price Ledger */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Base Parking Fee:</span>
                <span className="font-semibold">₹{basePrice}</span>
              </div>

              {evDiscount > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> EcoPark EV Incentive:
                  </span>
                  <span>- ₹{evDiscount}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Eco Points Discount:</span>
                  <span>- ₹{pointsDiscount}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900">
                <span className="font-bold text-sm">Total Payable:</span>
                <span className="text-2xl font-black">₹{finalAmount}</span>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-[11px] text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="accent-brand-600 mt-0.5"
              />
              <span>I agree to facility parking rules and cancellation terms. Contactless gate QR pass will be issued immediately upon payment.</span>
            </label>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!agreedTerms || !selectedVehicleId}
              onClick={handleProceedToPayment}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Payment (₹{finalAmount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Payment Modal */}
      {isPaymentModalOpen && pendingBookingData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingDetails={pendingBookingData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Reservation;
