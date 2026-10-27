import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Clock,
  Car,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Users,
  Timer,
  Send,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const HandoverPage = () => {
  const { user } = useAuth();
  const { socket, latestSlotUpdate } = useSocket();

  const [handovers, setHandovers] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [departureMinutes, setDepartureMinutes] = useState(15);
  const [handoverNote, setHandoverNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHandoverData = async () => {
    try {
      setLoading(true);
      const [handoversRes, statsRes] = await Promise.all([
        api.get('/handover'),
        api.get('/users/dashboard-stats'),
      ]);

      if (handoversRes.data.success) setHandovers(handoversRes.data.data);
      if (statsRes.data.success && statsRes.data.data.activeBooking) {
        setActiveBooking(statsRes.data.data.activeBooking);
      }
    } catch (err) {
      console.error('Error fetching handover data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoverData();

    if (socket) {
      socket.on('handoverAnnounced', fetchHandoverData);
      socket.on('handoverStatusUpdated', fetchHandoverData);
      socket.on('handoverCompleted', fetchHandoverData);
    }

    return () => {
      if (socket) {
        socket.off('handoverAnnounced', fetchHandoverData);
        socket.off('handoverStatusUpdated', fetchHandoverData);
        socket.off('handoverCompleted', fetchHandoverData);
      }
    };
  }, [socket]);

  // Current Parked Driver announces/updates departure time
  const handleAnnounceDeparture = async () => {
    if (!activeBooking) return;
    setActionLoading(true);
    try {
      const res = await api.post('/handover/announce-departure', {
        bookingId: activeBooking._id,
        expectedDepartureMinutes: departureMinutes,
        notes: handoverNote || 'Leaving parking bay shortly.',
      });
      if (res.data.success) {
        alert(res.data.message);
        fetchHandoverData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update departure');
    } finally {
      setActionLoading(false);
    }
  };

  // Current Parked Driver confirms vacating the bay
  const handleConfirmDeparture = async (handoverId) => {
    if (!window.confirm("Confirm that you have vacated the parking bay? The slot will immediately transfer to the waiting driver.")) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/handover/${handoverId}/confirm-departure`);
      if (res.data.success) {
        alert(res.data.message);
        setActiveBooking(null);
        fetchHandoverData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming departure');
    } finally {
      setActionLoading(false);
    }
  };

  // Waiting Driver requests the upcoming slot
  const handleRequestHandover = async (handoverId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/handover/${handoverId}/request`, {});
      if (res.data.success) {
        alert(res.data.message);
        fetchHandoverData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request slot');
    } finally {
      setActionLoading(false);
    }
  };

  const myHandover = handovers.find((h) => h.currentUserId?._id === user?.id || h.currentUserId === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-tr from-amber-600 via-orange-600 to-slate-900 rounded-3xl p-8 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Proposed Smart City Innovation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Parking Space Handover
        </h1>
        <p className="text-sm text-amber-100 max-w-2xl leading-relaxed">
          A peer-to-peer turnaround coordination protocol designed to eliminate circling for spaces. Departed drivers announce their expected departure, allowing waiting motorists to queue directly for incoming vacancies.
        </p>

        {/* 4-Stage Status Visual Lifecycle */}
        <div className="bg-slate-900/40 backdrop-blur rounded-2xl p-4 border border-white/10 mt-6">
          <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block mb-3">
            Handover State Pipeline
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 font-semibold">
              1. Occupied
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/30 border border-amber-400/50 text-amber-100 font-bold">
              2. Expected to be Free
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/30 border border-purple-400/50 text-purple-100 font-bold">
              3. Handover Requested
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 font-bold">
              4. Available / Transferred
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Current Parked Driver Panel & Waiting Driver Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Current Parking User View */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">Current Driver Panel</h3>
            </div>

            {activeBooking ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                    <span>You are currently parked at:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900">Active</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">{activeBooking.location?.name}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Slot: <strong className="text-brand-600 font-mono">#{activeBooking.slot?.slotNumber}</strong></span>
                    <span>Plate: <strong className="font-mono">{activeBooking.vehicle?.licensePlate}</strong></span>
                  </div>
                </div>

                {/* Departure Announcement Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Announce Expected Departure Time:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDepartureMinutes(mins)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          departureMinutes === mins
                            ? 'bg-amber-500 text-white border-amber-600 shadow'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        In {mins} Mins
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Optional Note for Waiting Driver</label>
                    <input
                      type="text"
                      value={handoverNote}
                      onChange={(e) => setHandoverNote(e.target.value)}
                      placeholder="e.g. Finishing coffee, pulling out at 6:15 PM"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleAnnounceDeparture}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Broadcast Departure Time</span>
                  </button>
                </div>

                {/* Confirm Vacating Slot Button */}
                {myHandover && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-400 font-bold uppercase text-[10px]">Active Handover Request</span>
                      <span className="bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px]">
                        {myHandover.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {myHandover.waitingUserId
                        ? `Driver ${myHandover.waitingUserId.name} is waiting for your bay!`
                        : 'Your slot is advertised as expected to be free.'}
                    </p>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleConfirmDeparture(myHandover._id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Departure ("I'm Vacating Now")</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Car className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-xs text-slate-700">No Active Check-in Found</h4>
                <p className="text-[11px] text-slate-500">
                  When you check in at a parking facility, this panel allows you to announce your departure time to fellow motorists and earn Karma points.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Waiting User View & Live Available Handovers */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900">Waiting Driver Marketplace</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{handovers.length} Upcoming Vacancies</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Reserve bays where the current driver has scheduled their departure within the next 15–30 minutes.
            </p>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : handovers.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Timer className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No Active Departure Announcements</h4>
                <p className="text-xs text-slate-500">
                  When currently parked drivers announce imminent departures, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {handovers.map((h) => {
                  const isMyHandover = h.currentUserId?._id === user?.id || h.currentUserId === user?.id;
                  const isAlreadyRequested = h.status === 'Handover_Requested' || h.status === 'Handover_Confirmed';
                  const departureTimeStr = new Date(h.expectedDepartureTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={h._id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Facility</span>
                          <h4 className="font-bold text-sm text-slate-900">{h.location?.name}</h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            h.status === 'Expected_Soon'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {h.status === 'Expected_Soon' ? '● Expected to be Free Soon' : '● Handover Requested'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Bay Number</span>
                          <span className="font-black text-brand-600 font-mono text-sm">
                            #{h.slot?.slotNumber} ({h.slot?.floor})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Departure</span>
                          <span className="font-bold text-slate-800 text-sm">~{departureTimeStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupant</span>
                          <span className="font-medium text-slate-700 truncate block">
                            {isMyHandover ? 'You (Current Driver)' : h.currentUserId?.name || 'Driver'}
                          </span>
                        </div>
                      </div>

                      {h.notes && (
                        <p className="text-xs text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                          “{h.notes}”
                        </p>
                      )}

                      {!isMyHandover && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            disabled={actionLoading || isAlreadyRequested}
                            onClick={() => handleRequestHandover(h._id)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <span>{isAlreadyRequested ? 'Requested by a Driver' : 'Request Slot Handover'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverPage;
