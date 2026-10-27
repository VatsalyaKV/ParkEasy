import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Navigation, Zap, DollarSign, Star, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';
import MapView from '../components/MapView';

const SearchParking = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [evOnly, setEvOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let query = `/parking?maxPrice=${maxPrice}`;
      if (searchKeyword) query += `&keyword=${encodeURIComponent(searchKeyword)}`;
      if (evOnly) query += `&evOnly=true`;
      if (userLocation) {
        query += `&userLat=${userLocation.lat}&userLng=${userLocation.lng}`;
      }

      const res = await api.get(query);
      if (res.data.success) {
        setLocations(res.data.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [evOnly, maxPrice, userLocation]);

  const findNearbyParking = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by this browser.');
      return;
    }

    setLocationMessage('Requesting your location permission…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage('Showing parking sorted by distance from your location.');
      },
      () => {
        setLocationMessage('Location permission was not granted. Search still works normally.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLocations();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search Filter Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search destination, landmark or area (e.g. MG Road, Indiranagar, TechPark)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* EV Filter Toggle */}
          <div className="sm:col-span-3 flex items-center">
            <label className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border cursor-pointer text-xs font-semibold transition-colors ${
              evOnly
                ? 'bg-blue-50 border-blue-400 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <input
                type="checkbox"
                checked={evOnly}
                onChange={(e) => setEvOnly(e.target.checked)}
                className="hidden"
              />
              <Zap className="w-4 h-4 text-blue-600" />
              <span>EV Fast Charger Only</span>
            </label>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Hubs</span>
            </button>
          </div>
        </form>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Max Price: <strong>₹{maxPrice}/hr</strong></span>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 accent-brand-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={findNearbyParking}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold"
            >
              <Navigation className="w-3.5 h-3.5" />
              Find Parking Near Me
            </button>
            <span className="font-semibold text-slate-700">{locations.length} Facilities Found</span>
          </div>
          {locationMessage && (
            <p className="w-full text-[11px] text-slate-500">{locationMessage}</p>
          )}
        </div>
      </div>

      {/* Main Content Area: Split View with Map & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Map */}
        <div className="lg:col-span-6 space-y-3">
          <div className="sticky top-20">
            <MapView
              locations={locations}
              selectedLocation={selectedLocation}
              userLocation={userLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              height="550px"
            />
          </div>
        </div>

        {/* Right: Parking Cards List */}
        <div className="lg:col-span-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <p className="font-bold text-slate-800">No matching parking facilities found</p>
              <p className="text-xs text-slate-500">Try widening your price range or adjusting search keywords.</p>
            </div>
          ) : (
            locations.map((loc) => {
              const isSelected = selectedLocation?._id === loc._id;
              const hasEV = (loc.evSlots || 0) > 0;

              return (
                <div
                  key={loc._id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row gap-4 ${
                    isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={loc.images?.[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=80'}
                    alt={loc.name}
                    className="w-full sm:w-36 h-28 object-cover rounded-2xl shrink-0"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-slate-900 leading-snug">{loc.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{loc.address}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-slate-900 block">₹{loc.hourlyRate}</span>
                        <span className="text-[10px] text-slate-400 font-medium">per hour</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {loc.availableSlots || 0} Slots Available
                      </span>
                      {hasEV && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>EV Bay Free</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        loc.isOpen === false ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {loc.isOpen === false ? 'Closed' : 'Open'}
                      </span>
                      {loc.rating ? (
                        <span className="text-xs text-slate-500 font-medium ml-auto flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{loc.rating}{loc.reviewsCount ? ` (${loc.reviewsCount})` : ''}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 ml-auto">Destination listing</span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {loc.distance != null
                          ? `${loc.distance} km away${loc.walkingTimeMinutes ? ` • ~${loc.walkingTimeMinutes} min walk` : ''}`
                          : 'Distance unavailable'}
                      </span>
                      <div className="flex items-center gap-2">
                        {loc.latitude && loc.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                          >
                            Directions
                          </a>
                        )}
                        <Link
                          to={`/parking/${loc._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow flex items-center gap-1 transition-colors"
                        >
                          <span>Reserve Slot</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchParking;
