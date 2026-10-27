import React, { useState, useEffect } from 'react';
import { DollarSign, Zap, ShieldCheck, TrendingUp, Clock, Save, Loader2 } from 'lucide-react';
import api from '../services/api';

const ManagePricing = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pricingData, setPricingData] = useState({
    hourlyRate: 40,
    evHourlyRate: 30,
    evIncentiveDiscount: 20,
    peakHourMultiplier: 1.25,
    weekendRate: 50,
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/dashboard');
      if (res.data.success && res.data.data.locations) {
        setLocations(res.data.data.locations);
        if (res.data.data.locations.length > 0) {
          const first = res.data.data.locations[0];
          setSelectedLocationId(first._id);
          setPricingData({
            hourlyRate: first.hourlyRate,
            evHourlyRate: first.evHourlyRate || 30,
            evIncentiveDiscount: first.evIncentiveDiscount || 20,
            peakHourMultiplier: 1.25,
            weekendRate: first.hourlyRate + 10,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleLocationChange = (locId) => {
    setSelectedLocationId(locId);
    const loc = locations.find((l) => l._id === locId);
    if (loc) {
      setPricingData({
        hourlyRate: loc.hourlyRate,
        evHourlyRate: loc.evHourlyRate || 30,
        evIncentiveDiscount: loc.evIncentiveDiscount || 20,
        peakHourMultiplier: 1.25,
        weekendRate: loc.hourlyRate + 10,
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/parking/${selectedLocationId}`, {
        hourlyRate: pricingData.hourlyRate,
        evHourlyRate: pricingData.evHourlyRate,
        evIncentiveDiscount: pricingData.evIncentiveDiscount,
      });
      alert('Pricing tiers updated successfully!');
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Dynamic Pricing & Green Incentives</h1>
        <p className="text-xs text-slate-500">Configure base rates, peak multipliers, and EcoPark EV concessions</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Selected Parking Facility:</label>
        <select
          value={selectedLocationId}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="w-full sm:w-80 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
        >
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name} (Base: ₹{loc.hourlyRate}/hr)
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Hourly Rate */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Standard Vehicle Hourly Rate</h3>
            </div>
            <p className="text-xs text-slate-500">Applies to standard petrol/diesel sedans, hatchbacks, and SUVs.</p>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="10"
                max="300"
                required
                value={pricingData.hourlyRate}
                onChange={(e) => setPricingData({ ...pricingData, hourlyRate: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* EV Charging Hourly Rate */}
          <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">EV Concessional Rate</h3>
            </div>
            <p className="text-xs text-slate-500">Discounted hourly rate applicable to electric vehicle motorists.</p>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="5"
                max="250"
                required
                value={pricingData.evHourlyRate}
                onChange={(e) => setPricingData({ ...pricingData, evHourlyRate: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* EcoPark Green Incentive Discount */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">EcoPark Flat Incentive (₹)</h3>
            </div>
            <p className="text-xs text-slate-500">Per-reservation green rebate deducted directly at booking checkout.</p>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={pricingData.evIncentiveDiscount}
                onChange={(e) => setPricingData({ ...pricingData, evIncentiveDiscount: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Peak Multiplier */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-900">Rush Hour Congestion Multiplier</h3>
            </div>
            <p className="text-xs text-slate-500">Applied dynamically during peak evening hours (5:00 PM – 8:00 PM).</p>
            <input
              type="number"
              step="0.05"
              min="1.0"
              max="2.0"
              value={pricingData.peakHourMultiplier}
              onChange={(e) => setPricingData({ ...pricingData, peakHourMultiplier: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Pricing Policies</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManagePricing;
