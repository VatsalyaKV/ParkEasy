import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Grid,
  Calendar,
  CreditCard,
  QrCode,
  Clock,
  LogOut,
  Building,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const HowItWorksPage = () => {
  const [activeTab, setActiveTab] = useState('driver');

  const driverSteps = [
    {
      num: '01',
      title: 'Find & Filter Parking',
      desc: 'Search by destination, neighborhood, or GPS location. Filter by EV charging availability, budget, or covered parking.',
      icon: Search,
    },
    {
      num: '02',
      title: 'Visual Slot Selection',
      desc: 'Explore the live interactive parking lot map across floors (Ground / Basement). Select an available green bay or EV charger.',
      icon: Grid,
    },
    {
      num: '03',
      title: 'Reserve & Mock Payment',
      desc: 'Choose your vehicle, select parking duration, and simulate instant payment via UPI, Card, or redeem accumulated Eco Points.',
      icon: CreditCard,
    },
    {
      num: '04',
      title: 'Contactless Gate QR Entry',
      desc: 'Receive an instant digital gate pass with a secure QR code. Scan at the boom barrier to open the entry gate and begin parking.',
      icon: QrCode,
    },
    {
      num: '05',
      title: 'Parking Space Handover',
      desc: 'Ready to leave? Broadcast your departure 15 minutes prior. A waiting driver is matched, and you earn bonus Eco Points!',
      icon: Clock,
    },
  ];

  const ownerSteps = [
    {
      num: '01',
      title: 'Register Facility',
      desc: 'List your parking garage with GPS coordinates, street address, operating hours, and photo gallery.',
      icon: Building,
    },
    {
      num: '02',
      title: 'Configure Slot Grid & EV Bays',
      desc: 'Use the bulk generator to map out bays across multiple floors, assigning dedicated EV chargers and accessible spaces.',
      icon: Grid,
    },
    {
      num: '03',
      title: 'Set Rates & Green Incentives',
      desc: 'Define standard hourly pricing, peak-hour multipliers, and custom EcoPark discounts for EV drivers.',
      icon: DollarSign,
    },
    {
      num: '04',
      title: 'Monitor Live Operations & Earnings',
      desc: 'Track real-time occupancy rates, automate gate check-ins, view customer rosters, and analyze daily revenue charts.',
      icon: TrendingUp,
    },
  ];

  const steps = activeTab === 'driver' ? driverSteps : ownerSteps;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          User Guide
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          How ParkEasy Operates
        </h1>
        <p className="text-base text-slate-600">
          A step-by-step overview of the reservation lifecycle and parking facility operations.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-300">
          <button
            onClick={() => setActiveTab('driver')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'driver'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Journey
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'owner'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parking Owner Journey
          </button>
        </div>
      </div>

      {/* Steps Pipeline */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 font-mono font-black text-xl flex items-center justify-center shrink-0 border border-brand-200">
                {step.num}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>

              <div className="hidden sm:block">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-brand-500 rounded-3xl p-8 text-center text-slate-900 space-y-4">
        <h3 className="text-2xl font-black">Ready to Test the System?</h3>
        <p className="text-sm font-medium text-slate-800 max-w-xl mx-auto">
          Jump right into searching parking or check out the Parking Space Handover portal.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/search"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Find a Parking Bay
          </Link>
          <Link
            to="/handover"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border border-slate-200 transition-colors"
          >
            View Handover Queue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
