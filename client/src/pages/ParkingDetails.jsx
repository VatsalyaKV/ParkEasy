import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Car,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import api from '../services/api';

const ParkingDetails = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await api.get(`/parking/${id}`);
        if (res.data.success) {
          setLocation(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching parking details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="text-center py-12 space-y-3">
        <h3 className="text-xl font-bold text-slate-800">Parking Facility Not Found</h3>
        <button onClick={() => navigate('/search')} className="text-brand-600 font-bold text-sm">
          Return to Search
        </button>
      </div>
    );
  }

  const occupancyRate = location.totalSlots > 0
    ? Math.round(((location.totalSlots - location.availableSlots) / location.totalSlots) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to results</span>
      </button>

      {/* Main Header & Gallery */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-72 sm:h-96">
          <img
            src={location.images?.[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'}
            alt={location.name}
            className="w-full h-full object-cover"
          />
          <img
            src={location.images?.[1] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'}
            alt={location.name}
            className="w-full h-full object-cover hidden md:block"
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  location.isVerifiedDestination
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {location.isVerifiedDestination ? 'Verified Destination' : 'ParkEasy Facility'}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{location.rating ? `${location.rating}${location.reviewsCount ? ` (${location.reviewsCount} Reviews)` : ''}` : 'Destination listing'}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{location.name}</h1>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 pt-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{location.address}, {location.city}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right shrink-0">
              <span className="text-2xl font-black text-slate-900">₹{location.hourlyRate}</span>
              <span className="text-xs text-slate-500 block font-medium">/ hour base rate</span>
              {location.evHourlyRate && (
                <span className="text-[11px] text-blue-600 font-bold block mt-1">
                  ⚡ ₹{location.evHourlyRate}/hr for EVs
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{location.description}</p>
          <div className="flex flex-wrap gap-2">
            {location.latitude && location.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            )}
            {location.websiteUrl && (
              <a
                href={location.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200"
              >
                <ExternalLink className="w-4 h-4" />
                Official Website
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Availability and rates shown by ParkEasy are application data and may not represent live parking sensors at the destination.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Available Slots</span>
              <span className="text-base font-extrabold text-emerald-600">
                {location.availableSlots} / {location.totalSlots} Free
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">EV Charging Bays</span>
              <span className="text-base font-extrabold text-blue-600">
                {location.evSlots || 0} Active Ports
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Operating Hours</span>
              <span className="text-base font-extrabold text-slate-800">
                {location.operatingHours || '24/7 Open'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Occupancy Rate</span>
              <span className="text-base font-extrabold text-slate-800">
                {occupancyRate}% Full
              </span>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Facility Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {(location.amenities || ['EV Charging', 'CCTV 24/7', 'Covered Roof', 'Disabled Access']).map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Ready to park here?</h4>
              <p className="text-xs text-slate-500">Pick your specific parking bay on our interactive visual grid.</p>
            </div>
            <Link
              to={`/parking/${location._id}/slots`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Select Parking Slot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetails;
