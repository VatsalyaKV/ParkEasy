import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Loader2, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import SlotLayout from '../components/SlotLayout';
import { useSocket } from '../context/SocketContext';

const SlotSelection = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  const { joinLocationRoom, leaveLocationRoom, latestSlotUpdate } = useSocket();
  const navigate = useNavigate();

  const fetchLocationAndSlots = async () => {
    try {
      setLoading(true);
      const [locRes, slotsRes] = await Promise.all([
        api.get(`/parking/${id}`),
        api.get(`/parking/${id}/slots`),
      ]);

      if (locRes.data.success) setLocation(locRes.data.data);
      if (slotsRes.data.success) setSlots(slotsRes.data.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationAndSlots();
    joinLocationRoom(id);

    return () => {
      leaveLocationRoom(id);
    };
  }, [id]);

  // Handle live slot status broadcast via Socket.IO
  useEffect(() => {
    if (latestSlotUpdate && latestSlotUpdate.locationId === id) {
      setSlots((prevSlots) =>
        prevSlots.map((s) =>
          s._id === latestSlotUpdate.slotId
            ? { ...s, status: latestSlotUpdate.newStatus, expectedFreeTime: latestSlotUpdate.expectedFreeTime }
            : s
        )
      );

      // If user had currently selected slot that got occupied/reserved by someone else
      if (selectedSlot && selectedSlot._id === latestSlotUpdate.slotId && latestSlotUpdate.newStatus !== 'Available') {
        setSelectedSlot(null);
        alert(`Slot ${selectedSlot.slotNumber} was just reserved by another user.`);
      }
    }
  }, [latestSlotUpdate, id, selectedSlot]);

  const handleProceed = () => {
    if (!selectedSlot) return;
    navigate(`/reservation?locationId=${id}&slotId=${selectedSlot._id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to facility details</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live WebSocket Status Active</span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Select a Parking Slot</h1>
        <p className="text-xs text-slate-500">
          {location?.name} • Click an available (green) bay to reserve.
        </p>
      </div>

      {/* Visual Slot Layout Component */}
      <SlotLayout
        slots={slots}
        selectedSlot={selectedSlot}
        onSelectSlot={(slot) => setSelectedSlot(slot)}
      />

      {/* Floating or Bottom Selection Action Bar */}
      {selectedSlot ? (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-30 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">Selected Bay</span>
            <h4 className="text-lg font-black tracking-tight">
              Slot {selectedSlot.slotNumber} ({selectedSlot.floor})
            </h4>
            <p className="text-xs text-slate-400">
              Type: {selectedSlot.type} {selectedSlot.type === 'EV' ? '⚡ (EV Fast Charger)' : ''}
            </p>
          </div>

          <button
            onClick={handleProceed}
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-900 font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          Click any available green parking bay above to continue to the booking and vehicle setup screen.
        </div>
      )}
    </div>
  );
};

export default SlotSelection;
