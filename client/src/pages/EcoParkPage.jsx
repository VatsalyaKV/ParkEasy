import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  Zap,
  Award,
  Sparkles,
  TrendingDown,
  Gift,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const EcoParkPage = () => {
  const { user, refreshProfile } = useAuth();
  const [ecoSummary, setEcoSummary] = useState(null);
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  const fetchEcoData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        api.get('/ecopark'),
        api.get('/ecopark/rewards'),
      ]);

      if (summaryRes.data.success) setEcoSummary(summaryRes.data.data);
      if (historyRes.data.success) setRewardsHistory(historyRes.data.data);
    } catch (err) {
      console.error('Error fetching EcoPark data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEcoData();
  }, []);

  const handleRedeem = async (reward) => {
    if (!window.confirm(`Redeem '${reward.title}' for ${reward.pointsRequired} Eco Points?`)) return;

    setRedeemingId(reward.id);
    try {
      const res = await api.post('/ecopark/redeem', {
        rewardId: reward.id,
        pointsRequired: reward.pointsRequired,
        title: reward.title,
      });

      if (res.data.success) {
        alert(`${res.data.message}\nVoucher Code: ${res.data.voucherCode}`);
        refreshProfile();
        fetchEcoData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const hasEV = ecoSummary?.hasEV;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-tr from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Proposed Smart City Innovation #3</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          EcoPark: Clean Mobility & Incentives
        </h1>
        <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Rewarding sustainable urban transport. Verified electric vehicle drivers earn instant parking discounts, access high-speed CCS2 charging bays, and accumulate redeemable Eco Points.
        </p>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/20">
            <Zap className="w-4 h-4 text-blue-300" />
            <span>EV Status: <strong>{hasEV ? 'Verified Green Driver' : 'Standard Vehicle'}</strong></span>
          </div>
          <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/20">
            <TrendingDown className="w-4 h-4 text-emerald-300" />
            <span>Estimated/demo CO₂ indicator: <strong>{ecoSummary?.totalCarbonOffsetKg || 0} kg</strong></span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eco Points Balance</span>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tight">
            {ecoSummary?.ecoPoints || user?.ecoPoints || 0} pts
          </h3>
          <p className="text-xs text-slate-500">Available to redeem for vouchers or discounts</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Environmental Indicator</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            {ecoSummary?.totalCarbonOffsetKg || 0} kg CO₂
          </h3>
          <p className="text-xs text-slate-500">Based on electric vehicle parking sessions</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configurable EV Incentive</span>
          <h3 className="text-3xl font-black text-blue-600 tracking-tight">
            ₹20 – ₹30 Off
          </h3>
          <p className="text-xs text-slate-500">Per session discount set by parking owners</p>
        </div>
      </div>

      {/* EV-Friendly Facilities with High-Speed Charging */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">EV-Friendly Charging Hubs</h3>
            <p className="text-xs text-slate-500">Facilities equipped with dedicated CCS2 & Type 2 EV chargers</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full self-start">
            EcoPark Approved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(ecoSummary?.evLocations || []).map((loc) => (
            <div
              key={loc._id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{loc.name}</h4>
                  <span className="text-xs font-black text-blue-600 font-mono">
                    ₹{loc.evHourlyRate}/hr (EV Rate)
                  </span>
                </div>
                <p className="text-xs text-slate-500">{loc.address}, {loc.city}</p>

                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{loc.availableEvSlots} EV Bays Free</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    -₹{loc.evIncentiveDiscount} EV Discount
                  </span>
                </div>

                <div className="pt-1 text-[11px] text-slate-500">
                  Supported: <strong>{loc.chargerTypes?.join(', ') || 'CCS2 Fast DC (50 kW)'}</strong>
                </div>
              </div>

              <Link
                to={`/parking/${loc._id}/slots`}
                className="w-full text-center py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs transition-colors"
              >
                Reserve EV Charging Bay
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Catalog & Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Rewards Catalog */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Eco Points Rewards Store</h3>
          </div>
          <p className="text-xs text-slate-500">Redeem accumulated points for parking perks and charging vouchers:</p>

          <div className="space-y-3">
            {(ecoSummary?.availableRewards || []).map((reward) => {
              const canRedeem = (ecoSummary?.ecoPoints || 0) >= reward.pointsRequired;
              return (
                <div
                  key={reward.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-slate-900">{reward.title}</h4>
                    <p className="text-[11px] text-slate-500">{reward.description}</p>
                    <span className="text-[11px] font-black text-emerald-600 block pt-0.5">
                      {reward.pointsRequired} Points
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!canRedeem || redeemingId === reward.id}
                    onClick={() => handleRedeem(reward)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors disabled:opacity-40 shrink-0"
                  >
                    {redeemingId === reward.id ? 'Redeeming...' : 'Redeem Perk'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Reward Transactions</h3>
          {rewardsHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No reward transactions yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {rewardsHistory.map((r) => (
                <div key={r._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 text-[11px]">{r.reason}</p>
                    <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-black text-xs ${r.pointsEarned ? 'text-emerald-600' : 'text-red-600'}`}>
                    {r.pointsEarned ? `+${r.pointsEarned} pts` : `-${r.pointsSpent} pts`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcoParkPage;
