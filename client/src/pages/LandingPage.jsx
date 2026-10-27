import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Clock,
  Zap,
  Leaf,
  ShieldCheck,
  QrCode,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';
import api from '../services/api';

const LandingPage = () => {
  const [locations, setLocations] = useState([]);
  const [activeSlotDemo, setActiveSlotDemo] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedLocations = async () => {
      try {
        const res = await api.get('/parking?limit=3');
        if (res.data.success) {
          setLocations(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching parking locations:', err);
      }
    };
    fetchFeaturedLocations();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Next-Gen Smart Urban Mobility Platform</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
                  Park<span className="text-brand-600">Easy</span>
                </h1>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  “Find. Reserve. Park. Smarter.”
                </h2>
              </div>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Smart parking management that helps you find available spaces, reserve upcoming slots, and make every parking experience easier. Designed with predictive arrival modeling and green EV incentives.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/search"
                  className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all hover:gap-3"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Find Parking</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Service highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <h4 className="text-2xl font-black text-slate-900">40+</h4>
                  <p className="text-xs text-slate-500 font-medium">Smart Connected Bays</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-brand-600">3 Core</h4>
                  <p className="text-xs text-slate-500 font-medium">Flagship Innovations</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-emerald-600">Test</h4>
                  <p className="text-xs text-slate-500 font-medium">Gateway & Secure QR</p>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic: Live Interactive Parking Lot Simulator */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live parking operations</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">Central Hub • Floor G</span>
                </div>

                {/* Mock Visual Slots */}
                <div className="grid grid-cols-3 gap-3 py-6">
                  {[
                    { id: 1, num: 'A-01', status: 'Available', type: 'Regular', color: 'bg-emerald-50 border-emerald-400 text-emerald-800' },
                    { id: 2, num: 'A-02', status: 'Occupied', type: 'Regular', color: 'bg-red-50 border-red-300 text-red-700' },
                    { id: 3, num: 'EV-01', status: 'Available', type: 'EV', color: 'bg-blue-50 border-blue-400 text-blue-800' },
                    { id: 4, num: 'A-03', status: 'Reserved', type: 'Regular', color: 'bg-amber-50 border-amber-300 text-amber-800' },
                    { id: 5, num: 'A-04', status: 'Handover', type: 'Upcoming', color: 'bg-purple-50 border-purple-400 text-purple-800' },
                    { id: 6, num: 'EV-02', status: 'Occupied', type: 'EV', color: 'bg-blue-50/50 border-blue-200 text-slate-500' },
                  ].map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlotDemo(s.id)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${s.color} ${
                        activeSlotDemo === s.id ? 'ring-2 ring-brand-500 shadow-md' : ''
                      }`}
                    >
                      <span className="text-xs font-mono font-black">{s.num}</span>
                      <span className="text-[10px] font-semibold capitalize mt-1">{s.status}</span>
                      {s.type === 'EV' && <Zap className="w-3 h-3 text-blue-600 mt-1" />}
                    </div>
                  ))}
                </div>

                {/* Interactive Status card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center font-semibold text-slate-800">
                    <span>Availability status:</span>
                    <span className="text-emerald-600 font-bold">Live application state</span>
                  </div>
                  <p className="text-slate-500 leading-normal">
                    Users can tap available bays to reserve instantly, while occupied bays with imminent departure unlock the <strong>Space Handover</strong> workflow.
                  </p>
                  <Link
                    to="/search"
                    className="block text-center py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    Explore Real-Time Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Proposed Innovations Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-extrabold text-brand-600 tracking-wider uppercase bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            ParkEasy capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for smarter city parking
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
            These three flagship features represent the tools that make finding, reserving and managing parking simpler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Live Availability */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Live Availability</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Know which parking spaces are available before arriving with live sensor updates and socket synchronizations.
              </p>
            </div>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>View Live Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Space Handover */}
          <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Innovation #1
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Space Handover</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Request a parking space that is expected to become available soon through a four-stage occupancy-to-availability lifecycle.
              </p>
            </div>
            <Link
              to="/handover"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              <span>Explore Handover Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Smart Arrival */}
          <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Innovation #2
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Arrival</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Get suitable arrival-time and alternative parking recommendations calculated using predictive turnaround algorithms.
              </p>
            </div>
            <Link
              to="/smart-arrival"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <span>Test Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: EcoPark */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Innovation #3
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">EcoPark</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Support EV-friendly parking with configurable incentives, charging bay locator, carbon offset tracking, and eco-reward points.
              </p>
            </div>
            <Link
              to="/ecopark"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>View Green Perks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Parking Locations Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Prime Locations</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Nearby Smart Facilities</h2>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View all locations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={loc.images?.[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'}
                    alt={loc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                    ₹{loc.hourlyRate}/hr
                  </div>
                  {loc.evSlots > 0 && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>EV Charger Available</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                      {loc.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{loc.address}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-semibold text-emerald-600">
                      {loc.availableSlots || 0} Slots Available
                    </span>
                    <span className="text-slate-500 font-medium">
                      ⭐ {loc.rating || 4.8} ({loc.reviewsCount || 100}+ reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/parking/${loc._id}`}
                  className="w-full block text-center py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs transition-colors"
                >
                  View Details & Slots
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              Smart parking, ready when you are
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Experience the Future of Smart Urban Parking
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              One platform for drivers, parking operators and secure facility management.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                to="/search"
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-900 font-bold text-sm transition-all"
              >
                Launch Parking Search
              </Link>
              <Link
                to="/how-it-works"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                View Workflow Blueprint
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
