import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit2, Zap, Accessibility, ShieldCheck, CheckCircle2, Wrench, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const ManageSlots = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk add modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState(8);
  const [bulkFloor, setBulkFloor] = useState('Ground Floor');
  const [bulkPrefix, setBulkPrefix] = useState('G-');
  const [bulkEvCount, setBulkEvCount] = useState(2);

  const { socket } = useSocket();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/dashboard');
      if (res.data.success && res.data.data.locations) {
        setLocations(res.data.data.locations);
        if (res.data.data.locations.length > 0) {
          setSelectedLocationId(res.data.data.locations[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedLocationId) return;
    try {
      const res = await api.get(`/parking/${selectedLocationId}/slots`);
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [selectedLocationId]);

  const handleToggleStatus = async (slot, newStatus) => {
    try {
      await api.put(`/slots/${slot._id}`, { status: newStatus });
      setSlots(slots.map((s) => (s._id === slot._id ? { ...s, status: newStatus } : s)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update slot');
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/slots/bulk', {
        locationId: selectedLocationId,
        floor: bulkFloor,
        count: bulkCount,
        prefix: bulkPrefix,
        evCount: bulkEvCount,
      });
      if (res.data.success) {
        alert(`Successfully generated ${res.data.data.length} bays!`);
        setShowBulkModal(false);
        fetchSlots();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk generation failed');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Parking Slots</h1>
          <p className="text-xs text-slate-500">Configure bay status, floor assignment, and EV charging types</p>
        </div>

        <button
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Bulk Generate Bays</span>
        </button>
      </div>

      {/* Location Selector Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Active Facility:</label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
          >
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name} ({loc.totalSlots} Bays)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="text-emerald-600">
            {slots.filter((s) => s.status === 'Available').length} Available
          </span>
          <span>•</span>
          <span className="text-red-600">
            {slots.filter((s) => s.status === 'Occupied').length} Occupied
          </span>
          <span>•</span>
          <span className="text-blue-600">
            {slots.filter((s) => s.type === 'EV').length} EV Chargers
          </span>
        </div>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Bays Configured</h3>
          <p className="text-xs text-slate-500">Click "Bulk Generate Bays" above to configure layout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot) => {
            const isEV = slot.type === 'EV';
            const isAvailable = slot.status === 'Available';

            return (
              <div
                key={slot._id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-lg text-slate-900">
                      {slot.slotNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        slot.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : slot.status === 'Occupied'
                          ? 'bg-red-100 text-red-800'
                          : slot.status === 'Reserved'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Floor: <strong>{slot.floor}</strong></p>
                    <p>Type: <strong>{slot.type}</strong></p>
                    {isEV && (
                      <p className="text-blue-600 font-bold flex items-center gap-1 text-[11px]">
                        <Zap className="w-3 h-3" /> {slot.evChargerType || 'CCS2 50kW'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Status Override Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Override:</span>
                  <div className="flex gap-1">
                    {slot.status !== 'Available' && (
                      <button
                        onClick={() => handleToggleStatus(slot, 'Available')}
                        className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded hover:bg-emerald-100"
                        title="Force Available"
                      >
                        Free
                      </button>
                    )}
                    {slot.status !== 'Occupied' && (
                      <button
                        onClick={() => handleToggleStatus(slot, 'Occupied')}
                        className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded hover:bg-red-100"
                        title="Mark Occupied"
                      >
                        Occupy
                      </button>
                    )}
                    {slot.status !== 'Maintenance' && (
                      <button
                        onClick={() => handleToggleStatus(slot, 'Maintenance')}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded hover:bg-slate-200"
                        title="Mark Maintenance"
                      >
                        Maint
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <h3 className="text-base font-bold text-slate-900">Bulk Generate Parking Bays</h3>
            <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Floor</label>
                <select
                  value={bulkFloor}
                  onChange={(e) => setBulkFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="Basement 1">Basement 1</option>
                  <option value="Basement 2">Basement 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Bays</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slot Prefix</label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="e.g. G- or B1-"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">EV Fast Charging Bays Count</label>
                <input
                  type="number"
                  min="0"
                  max={bulkCount}
                  value={bulkEvCount}
                  onChange={(e) => setBulkEvCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Generate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSlots;
