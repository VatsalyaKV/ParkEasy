import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  Search,
  MapPin,
  Navigation,
  CalendarCheck,
  Clock3,
  Leaf,
  CarFront,
  ArrowUpRight,
  ArrowRight,
  LocateFixed,
  RefreshCw,
  AlertCircle,
  Zap,
  ShieldCheck,
  QrCode,
  CircleCheck,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QRPassModal from '../components/QRPassModal';

const UserDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    activeBooking: null,
    totalBookings: 0,
    hoursParked: 0,
    ecoPoints: 0,
  });

  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const [locationState, setLocationState] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedQRBooking, setSelectedQRBooking] = useState(null);

  const fetchDashboardData = useCallback(
    async (coords = userLocation) => {
      try {
        setLoading(true);
        setLoadError('');

        const locationQuery = coords
          ? `&userLat=${coords.lat}&userLng=${coords.lng}`
          : '';

        const [
          statsRes,
          locationsRes,
          bookingsRes,
        ] = await Promise.allSettled([
          api.get('/users/dashboard-stats'),
          api.get(`/parking?limit=5${locationQuery}`),
          api.get('/bookings?limit=4'),
        ]);

        if (
          statsRes.status === 'fulfilled' &&
          statsRes.value.data.success
        ) {
          setStats(statsRes.value.data.data);
        }

        if (
          locationsRes.status === 'fulfilled' &&
          locationsRes.value.data.success
        ) {
          setNearbyLocations(
            locationsRes.value.data.data || []
          );
        }

        if (
          bookingsRes.status === 'fulfilled' &&
          bookingsRes.value.data.success
        ) {
          setRecentBookings(
            bookingsRes.value.data.data || []
          );
        }

        if (
          statsRes.status === 'rejected' &&
          locationsRes.status === 'rejected' &&
          bookingsRes.status === 'rejected'
        ) {
          setLoadError(
            'Unable to load your parking workspace.'
          );
        }
      } catch (error) {
        console.error(error);
        setLoadError(
          'Unable to load your parking workspace.'
        );
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState('unsupported');
      fetchDashboardData(null);
      return;
    }

    setLocationState('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(coords);
        setLocationState('ready');
      },
      () => {
        setLocationState('denied');
        fetchDashboardData(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      }
    );
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchDashboardData(userLocation);
    }
  }, [userLocation, fetchDashboardData]);

  const active = stats.activeBooking;

  const ecoPoints =
    stats.ecoPoints ||
    user?.ecoPoints ||
    0;

  const firstName =
    user?.name?.split(' ')[0] ||
    'Driver';

  return (
    <div className="space-y-5 pe-animate">

      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] font-black text-[#0d8e7c]">
            <span className="w-2 h-2 rounded-full bg-[#14b89d] pe-pulse" />
            Driver workspace
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Good evening, {firstName}.
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Everything you need for your next parking trip.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData()}
          className="pe-btn pe-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* HERO */}
      {/* ------------------------------------------------ */}

      <section className="pe-hero">

        <div className="relative z-10 max-w-3xl">

          <div className="pe-hero-eyebrow">
            <Sparkles size={12} />
            Smart parking command center
          </div>

          <h2 className="pe-hero-title">
            Find a space.
            <br />
            <span>Arrive without the stress.</span>
          </h2>

          <p className="pe-hero-description">
            Search nearby parking, compare live availability,
            reserve your preferred bay and arrive with a secure
            digital parking pass.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">

            <Link
              to="/search"
              className="pe-btn pe-btn-primary"
            >
              <Search size={16} />
              Find parking
            </Link>

            <button
              onClick={locateUser}
              className="pe-btn"
              style={{
                background: 'rgba(255,255,255,.08)',
                color: 'white',
                borderColor: 'rgba(255,255,255,.12)',
              }}
            >
              <LocateFixed size={16} />

              {locationState === 'loading'
                ? 'Locating...'
                : locationState === 'ready'
                  ? 'Location active'
                  : 'Use my location'}
            </button>

          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-[10px] text-slate-400">

            <span className="flex items-center gap-1.5">
              <CircleCheck size={13} className="text-[#48d9c3]" />
              Live availability
            </span>

            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#48d9c3]" />
              Secure QR entry
            </span>

            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-[#48d9c3]" />
              EV-aware parking
            </span>

          </div>

        </div>

      </section>

      {/* ------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------ */}

      {loadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle size={18} />

          <span className="text-xs font-semibold flex-1">
            {loadError}
          </span>

          <button
            onClick={() => fetchDashboardData()}
            className="text-xs font-black underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* STATS */}
      {/* ------------------------------------------------ */}

      <section className="pe-stat-grid">

        <div className="pe-stat">
          <div className="pe-stat-icon">
            <CalendarCheck size={18} />
          </div>

          <div className="pe-stat-value">
            {active ? 'Active' : 'None'}
          </div>

          <div className="pe-stat-label">
            {active
              ? `Bay ${active.slot?.slotNumber || '—'}`
              : 'No active reservation'}
          </div>
        </div>

        <div className="pe-stat">
          <div className="pe-stat-icon">
            <CarFront size={18} />
          </div>

          <div className="pe-stat-value">
            {stats.totalBookings || 0}
          </div>

          <div className="pe-stat-label">
            Total bookings
          </div>
        </div>

        <div className="pe-stat">
          <div className="pe-stat-icon">
            <Clock3 size={18} />
          </div>

          <div className="pe-stat-value">
            {stats.hoursParked || 0}h
          </div>

          <div className="pe-stat-label">
            Parking time
          </div>
        </div>

        <div className="pe-stat">
          <div className="pe-stat-icon">
            <Leaf size={18} />
          </div>

          <div className="pe-stat-value">
            {ecoPoints}
          </div>

          <div className="pe-stat-label">
            EcoPark points
          </div>
        </div>

      </section>

      {/* ------------------------------------------------ */}
      {/* ACTIVE BOOKING */}
      {/* ------------------------------------------------ */}

      {active && (
        <section className="pe-surface p-5">

          <div className="flex flex-col md:flex-row md:items-center gap-5">

            <div className="w-14 h-14 rounded-2xl bg-[#e7faf6] text-[#0d8e7c] grid place-items-center shrink-0">
              <CarFront size={25} />
            </div>

            <div className="flex-1">

              <div className="text-[10px] uppercase tracking-wider font-black text-[#0d8e7c]">
                Active parking
              </div>

              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                {active.location?.name || 'Your parking location'}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Bay {active.slot?.slotNumber || '—'}
                {' • '}
                {active.vehicle?.licensePlate || 'Vehicle'}
              </p>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  setSelectedQRBooking(active)
                }
                className="pe-btn pe-btn-dark"
              >
                <QrCode size={15} />
                Gate pass
              </button>

              <Link
                to={`/booking-details/${active._id}`}
                className="pe-btn pe-btn-secondary"
              >
                Details
                <ArrowUpRight size={14} />
              </Link>

            </div>

          </div>

        </section>
      )}

      {/* ------------------------------------------------ */}
      {/* MAIN CONTENT */}
      {/* ------------------------------------------------ */}

      <section className="grid xl:grid-cols-[1.35fr_.65fr] gap-5">

        {/* Nearby */}
        <div className="pe-surface overflow-hidden">

          <div className="p-5 border-b border-slate-100 dark:border-slate-800">

            <div className="flex items-center justify-between">

              <div>
                <div className="flex items-center gap-2">

                  <h2 className="font-black text-slate-950 dark:text-white">
                    Parking near you
                  </h2>

                  {userLocation && (
                    <span className="pe-availability">
                      <span className="pe-availability-dot" />
                      Location active
                    </span>
                  )}

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {userLocation
                    ? 'Sorted using your current location'
                    : 'Use your location to see distance-aware results'}
                </p>
              </div>

              <Link
                to="/search"
                className="text-xs font-black text-[#0d8e7c] flex items-center gap-1"
              >
                View map
                <ArrowRight size={13} />
              </Link>

            </div>

          </div>

          <div className="p-4 grid gap-3">

            {loading ? (
              <div className="py-14 text-center text-xs text-slate-400">
                Finding parking around you...
              </div>
            ) : nearbyLocations.length === 0 ? (
              <div className="py-14 text-center">
                <MapPin
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  No parking locations found
                </p>

                <Link
                  to="/search"
                  className="mt-2 inline-block text-xs font-bold text-[#0d8e7c]"
                >
                  Explore parking
                </Link>
              </div>
            ) : (
              nearbyLocations.map((location) => (
                <Link
                  key={location._id}
                  to={`/parking/${location._id}`}
                  className="group flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >

                  <div className="w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100">

                    <img
                      src={
                        location.images?.[0] ||
                        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=500&q=80'
                      }
                      alt={location.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex justify-between gap-2">

                      <h3 className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                        {location.name}
                      </h3>

                      <span className="text-sm font-black text-slate-950 dark:text-white whitespace-nowrap">
                        ₹{location.hourlyRate || 40}
                        <span className="text-[9px] text-slate-400">
                          /hr
                        </span>
                      </span>

                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin size={12} />
                      <span className="truncate">
                        {location.address}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">

                      <span className="pe-availability">
                        <span className="pe-availability-dot" />
                        {location.availableSlots || 0} available
                      </span>

                      {location.distance != null && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {Number(location.distance).toFixed(1)} km
                        </span>
                      )}

                      {location.evSlots > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <Zap size={11} />
                          EV
                        </span>
                      )}

                    </div>

                  </div>

                </Link>
              ))
            )}

          </div>

        </div>

        {/* Quick actions */}
        <div className="space-y-4">

          <div className="pe-surface p-5">

            <div className="flex items-center justify-between">

              <div>
                <div className="text-[10px] uppercase tracking-wider font-black text-[#0d8e7c]">
                  Quick actions
                </div>

                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                  Make your next trip easier
                </h2>
              </div>

            </div>

            <div className="mt-5 grid gap-2">

              <Link
                to="/search"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#e7faf6] text-[#0d8e7c] hover:bg-[#d7f5ef] transition"
              >
                <Search size={17} />
                <span className="text-xs font-black flex-1">
                  Find parking
                </span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/my-bookings"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <CalendarCheck size={17} />
                <span className="text-xs font-black flex-1">
                  My bookings
                </span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/smart-arrival"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <Navigation size={17} />
                <span className="text-xs font-black flex-1">
                  Smart arrival
                </span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/ecopark"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <Leaf size={17} />
                <span className="text-xs font-black flex-1">
                  EcoPark rewards
                </span>
                <ArrowRight size={14} />
              </Link>

            </div>

          </div>

          {/* Recent activity */}
          <div className="pe-surface p-5">

            <div className="flex items-center justify-between">

              <h2 className="font-black text-slate-950 dark:text-white">
                Recent activity
              </h2>

              <Link
                to="/my-bookings"
                className="text-[10px] font-black text-[#0d8e7c]"
              >
                View all
              </Link>

            </div>

            <div className="mt-4 space-y-3">

              {recentBookings.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400">
                  Your recent parking activity will appear here.
                </div>
              ) : (
                recentBookings.slice(0, 4).map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center gap-3"
                  >

                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 grid place-items-center">
                      <CalendarCheck
                        size={15}
                        className="text-[#0d8e7c]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                        {booking.location?.name ||
                          'Parking reservation'}
                      </div>

                      <div className="text-[10px] text-slate-400">
                        {booking.bookingStatus || 'Reservation'}
                      </div>

                    </div>

                    <span className="text-[10px] font-black text-slate-400">
                      {booking.finalAmount != null
                        ? `₹${booking.finalAmount}`
                        : ''}
                    </span>

                  </div>
                ))
              )}

            </div>

          </div>

        </div>

      </section>

      {selectedQRBooking && (
        <QRPassModal
          booking={selectedQRBooking}
          onClose={() => setSelectedQRBooking(null)}
        />
      )}

    </div>
  );
};

export default UserDashboard;