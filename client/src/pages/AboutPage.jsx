import React from 'react';
import { Link } from 'react-router-dom';
import { CarFront, Cpu, Database, MapPinned, Radio, ShieldCheck, Sparkles, ArrowRight, Zap } from 'lucide-react';

const AboutPage = () => (
  <div className="space-y-16 px-4 py-12 sm:px-6 lg:px-8">
    <section className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-slate-950 px-6 py-12 text-white sm:px-10 lg:px-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Smart urban mobility
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Parking should feel effortless.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            ParkEasy connects drivers with available parking, reservations, secure QR entry and EV-friendly services in one focused experience.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link to="/search" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-xs font-black text-white hover:bg-brand-400">Find parking <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/how-it-works" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white hover:bg-white/10">See how it works</Link>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Driver journey</span><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">LIVE</span></div>
            <div className="mt-6 space-y-3">
              {[
                ['01', 'Discover', 'See available bays near your destination'],
                ['02', 'Reserve', 'Select a slot, vehicle and arrival time'],
                ['03', 'Arrive', 'Use your secure QR gate pass'],
                ['04', 'Park', 'Complete the trip and earn eligible rewards'],
              ].map(([n, t, d]) => <div key={n} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/20 text-[10px] font-black text-brand-300">{n}</span><div><p className="text-xs font-black">{t}</p><p className="text-[10px] text-slate-400">{d}</p></div></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl">
      <div className="mb-7"><span className="text-[10px] font-black uppercase tracking-[.16em] text-brand-600">Why ParkEasy</span><h2 className="mt-2 text-3xl font-black text-slate-900">One experience from search to exit.</h2></div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [MapPinned, 'Location-aware discovery', 'Use your device location to rank ParkEasy facilities by distance and surface available bays.'],
          [ShieldCheck, 'Secure reservations', 'Authenticated accounts, booking ownership checks and QR gate passes keep the parking journey controlled.'],
          [Zap, 'Smarter mobility', 'EV-aware availability, space handover, smart arrival and EcoPark rewards reduce friction around every trip.'],
        ].map(([Icon, title, text]) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div><h3 className="mt-5 font-black text-slate-900">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{text}</p></div>)}
      </div>
    </section>

    <section className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Cpu className="h-5 w-5" /></div><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-brand-600">Platform architecture</span><h2 className="mt-1 text-2xl font-black text-slate-900">Built as a connected parking platform</h2></div></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [CarFront, 'Driver experience', 'React, responsive UI, vehicle garage and reservation flow'],
          [Radio, 'Live operations', 'Socket.IO powered parking state synchronization'],
          [Database, 'Data platform', 'MongoDB models for users, vehicles, locations, slots and bookings'],
          [ShieldCheck, 'Secure access', 'Cookie-based authentication and role-aware APIs'],
        ].map(([Icon, title, text]) => <div key={title} className="rounded-2xl bg-slate-50 p-5"><Icon className="h-5 w-5 text-brand-600" /><h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div>)}
      </div>
    </section>
  </div>
);

export default AboutPage;
