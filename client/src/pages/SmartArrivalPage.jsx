import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const SmartArrivalPage = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [preferredTime, setPreferredTime] = useState(new Date().toISOString().slice(0, 16));
  const [durationHours, setDurationHours] = useState(2);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/parking');
        if (res.data.success) {
          setLocations(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedLocationId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading locations:', err);
      } finally {
        setInitialFetchLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const handleCalculateRecommendation = async (e) => {
    e?.preventDefault();
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      const res = await api.post('/smart-arrival', {
        locationId: selectedLocationId,
        preferredArrivalTime: preferredTime,
        durationHours,
      });

      if (res.data.success) {
        setRecommendation(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not compute Smart Arrival');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocationId && !initialFetchLoading) {
      handleCalculateRecommendation();
    }
  }, [selectedLocationId]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-tr from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span>Proposed Smart City Innovation #2</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Smart Arrival Engine
        </h1>
        <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
          Predictive arrival modeling that analyzes real-time slot occupancy, scheduled checkout windows, and active peer handovers. Recommends ideal arrival intervals and lower-congestion alternative parking nearby.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Provide Destination Parameters
        </h3>

        <form onSubmit={handleCalculateRecommendation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Location */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Desired Parking Hub</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Arrival Time */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Arrival Time</label>
            <input
              type="datetime-local"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Intended Stay Duration</label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 Hour</option>
              <option value={2}>2 Hours (Standard)</option>
              <option value={4}>4 Hours</option>
              <option value={8}>8 Hours</option>
            </select>
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Turnaround Forecasts...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Compute Optimal Arrival & Alternatives</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Results Section */}
      {recommendation && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Recommendation Callout Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-200 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Rule-Based Predictive Forecast
              </span>
              <span className="text-xs font-medium text-slate-500">
                Congestion Index: <strong>{recommendation.congestionLevel}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Recommended Arrival Time
                </span>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                    {recommendation.recommendedArrival}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    (You requested: {recommendation.requestedTime})
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
                <span className="font-bold text-blue-900 block">Algorithmic Reasoning:</span>
                <p className="text-blue-800 leading-relaxed font-medium">
                  “{recommendation.reason}”
                </p>
              </div>
            </div>

            {/* Target Location Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="font-bold text-slate-900 truncate block">
                  {recommendation.targetLocation.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Currently Free</span>
                <span className="font-extrabold text-emerald-600">
                  {recommendation.targetLocation.availableNow} Bays
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Departures Expected</span>
                <span className="font-extrabold text-amber-600">
                  {recommendation.expectedDeparturesCount} Vehicles
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hourly Rate</span>
                <span className="font-extrabold text-slate-900">
                  ₹{recommendation.targetLocation.hourlyRate}/hr
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                to={`/parking/${recommendation.targetLocation._id}/slots`}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-colors flex items-center gap-1.5"
              >
                <span>Reserve Bay at {recommendation.targetLocation.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Alternative Parking Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-900">Alternative Nearby Parking Hubs</h3>
            </div>
            <p className="text-xs text-slate-500">
              In case of peak delays, consider these nearby alternative facilities within short walking distance:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendation.alternativeParking.map((alt) => (
                <div
                  key={alt._id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                        {alt.distanceText}
                      </span>
                      <span className="text-xs font-bold text-slate-700">₹{alt.hourlyRate}/hr</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{alt.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{alt.address}</p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="font-bold text-emerald-600">{alt.availableSlots} Slots Free</span>
                      <span className="text-slate-400 font-medium">~{alt.walkingTimeMinutes} min walk</span>
                    </div>
                  </div>

                  <Link
                    to={`/parking/${alt._id}`}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    View Alternative
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartArrivalPage;
