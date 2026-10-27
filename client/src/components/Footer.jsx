import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MapPin, Mail, Phone, ExternalLink, Leaf, Zap, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1 & 2: Project Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md">
                P
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">Park<span className="text-brand-400">Easy</span></span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              <strong>ParkEasy – Smart Parking Management and Reservation System</strong> is a full-stack smart mobility platform designed to alleviate urban parking congestion through automated reservations, predictive arrival modeling, and clean mobility incentives.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>B.Tech Computer Science Academic Project</span>
            </div>
          </div>

          {/* Col 3: Flagship Innovations */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Core Innovations</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/handover" className="hover:text-white transition-colors flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Space Handover</span>
                </Link>
              </li>
              <li>
                <Link to="/smart-arrival" className="hover:text-white transition-colors flex items-center gap-2 text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Smart Arrival</span>
                </Link>
              </li>
              <li>
                <Link to="/ecopark" className="hover:text-white transition-colors flex items-center gap-2 text-slate-400">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>EcoPark & EV Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors text-slate-400">
                  Live Slot Availability
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Portals */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Portals & Roles</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/user/dashboard" className="hover:text-white transition-colors">
                  Driver Dashboard
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-white transition-colors">
                  Parking Owner Hub
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">
                  Admin System Control
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Workflow
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Tech Stack & Verification */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Technology Stack</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• React 18 + Vite + Tailwind CSS</li>
              <li>• Node.js + Express REST APIs</li>
              <li>• MongoDB + Mongoose ODM</li>
              <li>• Socket.IO Real-Time Sync</li>
              <li>• OpenStreetMap + Leaflet GIS</li>
              <li>• Digital QR Gate Verification</li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ParkEasy System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-300">Architecture</Link>
            <Link to="/features" className="hover:text-slate-300">Feature Matrix</Link>
            <Link to="/contact" className="hover:text-slate-300">Support & Feedback</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
