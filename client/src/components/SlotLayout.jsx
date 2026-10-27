import React, { useState } from 'react';
import { Zap, Accessibility, ShieldCheck, Clock, Check } from 'lucide-react';

const SlotLayout = ({ slots = [], selectedSlot, onSelectSlot }) => {
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');

  // Extract available floors from slots
  const floors = [...new Set(slots.map((s) => s.floor || 'Ground Floor'))];
  if (floors.length === 0) floors.push('Ground Floor');

  const filteredSlots = slots.filter((s) => (s.floor || 'Ground Floor') === selectedFloor);

  // Status style helper
  const getSlotStyle = (slot) => {
    const isSelected = selectedSlot?._id === slot._id;

    if (isSelected) {
      return 'bg-brand-600 text-white border-brand-700 shadow-md ring-2 ring-brand-500 ring-offset-2 scale-105';
    }

    switch (slot.status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100 cursor-pointer shadow-sm';
      case 'Occupied':
        return 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed opacity-80';
      case 'Reserved':
        return 'bg-amber-50 text-amber-800 border-amber-300 cursor-not-allowed opacity-85';
      case 'Handover_Pending':
      case 'Upcoming':
        return 'bg-purple-50 text-purple-800 border-purple-300 cursor-not-allowed opacity-90';
      case 'Maintenance':
        return 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status !== 'Available') {
      return; // Do not allow selecting occupied or reserved slots
    }
    if (onSelectSlot) {
      onSelectSlot(slot);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Floor switcher & summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Visual Parking Bay Layout</h3>
          <p className="text-xs text-slate-500">Live slot status synchronized via IoT & Socket.IO</p>
        </div>

        {/* Floor tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFloor === floor
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-red-500"></span>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-500"></span>
          <span>Handover Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-4 h-4 rounded bg-blue-100 text-blue-600 border border-blue-300">
            <Zap className="w-2.5 h-2.5" />
          </div>
          <span>EV Fast Charger</span>
        </div>
      </div>

      {/* Visual Road / Parking Grid */}
      <div className="bg-slate-900/5 p-6 rounded-2xl border-2 border-dashed border-slate-300">
        <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          — DRIVEWAY / ENTRY LANE —
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredSlots.map((slot) => {
            const isAvailable = slot.status === 'Available';
            const isSelected = selectedSlot?._id === slot._id;
            const isEV = slot.type === 'EV';

            return (
              <button
                key={slot._id}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleSlotClick(slot)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-150 h-24 ${getSlotStyle(
                  slot
                )}`}
              >
                {/* EV badge indicator */}
                {isEV && (
                  <div
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                    title={slot.evChargerType || 'EV Charging Point'}
                  >
                    <Zap className="w-3 h-3" />
                  </div>
                )}

                {/* Accessible Icon */}
                {slot.type === 'Accessible' && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-200 text-slate-700">
                    <Accessibility className="w-3 h-3" />
                  </div>
                )}

                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 left-1.5 p-0.5 rounded-full bg-white text-brand-700">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* Slot Number */}
                <span className="text-base font-extrabold tracking-tight">{slot.slotNumber}</span>

                {/* Status Subtext */}
                <span
                  className={`text-[10px] font-semibold mt-1 uppercase tracking-wider ${
                    isSelected ? 'text-brand-100' : ''
                  }`}
                >
                  {slot.status}
                </span>

                {/* Departure countdown if Upcoming */}
                {['Upcoming', 'Handover_Pending'].includes(slot.status) && slot.expectedFreeTime && (
                  <span className="text-[9px] text-purple-600 font-medium flex items-center gap-0.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Free ~{new Date(slot.expectedFreeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          — EXIT LANE —
        </div>
      </div>
    </div>
  );
};

export default SlotLayout;
