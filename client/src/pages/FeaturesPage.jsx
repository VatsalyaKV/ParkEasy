import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Zap,
  Clock,
  Leaf,
  Shield,
  QrCode,
  CreditCard,
  Radio,
  Sliders,
  Users,
  Compass,
  Building,
} from 'lucide-react';

const FeaturesPage = () => {
  const roleMatrices = [
    {
      role: 'Parking User / Driver',
      color: 'border-brand-500 bg-brand-50/20',
      badge: 'Driver Portal',
      features: [
        'Live Slot Availability & Map Search',
        'Visual Parking Bay Selection (Floors & Types)',
        'Guaranteed Advance Slot Reservation',
        'Simulated Secure Payment Processing',
        'Instant Digital QR Entry Gate Pass',
        'Parking Space Handover Request & Offer',
        'Smart Arrival Predictive Time Recommendations',
        'EcoPark EV Charging & Green Reward Points',
        'Vehicle Garage Management (Cars, SUVs, EVs)',
        'Real-Time Booking Cancellation & Notifications',
      ],
    },
    {
      role: 'Parking Facility Owner',
      color: 'border-amber-500 bg-amber-50/20',
      badge: 'Owner Portal',
      features: [
        'Add & Manage Multiple Parking Hubs',
        'Automated Visual Slot Generation & Floor Mapping',
        'Toggle Live Slot Status (Available, Maintenance)',
        'Configurable Hourly Rates & Peak Multipliers',
        'Customizable EcoPark EV Incentive Discounts',
        'Monitor Live Occupancy Rates & Today’s Earnings',
        'Customer Directory & Parking Frequency Logs',
        'Revenue & Utilization Analytics Charts',
      ],
    },
    {
      role: 'System Administrator',
      color: 'border-indigo-500 bg-indigo-50/20',
      badge: 'Admin Console',
      features: [
        'Platform-Wide KPI Dashboard (Users, Lots, Revenue)',
        'Manage & Moderate User Accounts (Activate/Suspend)',
        'Parking Facility Verification & Approvals',
        'Master Booking Oversight & Status Overrides',
        'System Health & WebSocket Connection Monitoring',
        'Platform Revenue Distribution Analytics',
        'EV Adoption & Handover Conversion Metrics',
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Complete Capabilities
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          System Features & Matrix
        </h1>
        <p className="text-base text-slate-600">
          Discover all end-to-end functionalities built for Drivers, Parking Lot Owners, and System Administrators.
        </p>
      </div>

      {/* Role Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roleMatrices.map((matrix) => (
          <div
            key={matrix.role}
            className={`bg-white rounded-3xl p-6 border-2 ${matrix.color} shadow-sm space-y-6 flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-white inline-block">
                {matrix.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-900">{matrix.role}</h3>
              <ul className="space-y-3">
                {matrix.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* 3 Innovations Detailed Technical Breakdown */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white space-y-8">
        <div className="max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Deep Dive</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Flagship Technical Innovations</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Designed as proposed enhancements for intelligent transportation engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">1. Parking Space Handover</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides dynamic peer turnaround:
              <br />
              <code className="text-amber-300 font-mono text-[11px] block mt-1">
                Occupied → Expected Soon → Handover Requested → Available
              </code>
              <br />
              Vacating drivers update departure time, waiting drivers queue, and vacating drivers earn bonus Eco/Karma points.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">2. Smart Arrival Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates optimal arrival times using rule-based heuristics that analyze scheduled checkouts, active handovers, and facility capacity, while simultaneously suggesting lower-congestion alternative parking within walking distance.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">3. EcoPark Clean Mobility</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Incentivizes electric vehicle adoption through owner-configurable discounts (e.g. ₹20-₹30 off), verified EV fast-charging bay locators, kg CO₂ offset counters, and redeemable green points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
