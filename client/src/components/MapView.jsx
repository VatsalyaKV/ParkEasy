import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

// Fix standard Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (type, available) => {
  const bg = available > 0 ? (type === 'EV' ? '#3B82F6' : '#10B981') : '#EF4444';
  const label = type === 'EV' ? '⚡' : 'P';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${bg};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 13px;
        ">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MapView = ({ locations = [], selectedLocation, onSelectLocation, userLocation = null, height = '450px' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center Bengaluru coordinates
    const defaultCenter = [12.9716, 77.5946];
    const initialCenter = userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : locations.length > 0 && locations[0].latitude
        ? [locations[0].latitude, locations[0].longitude]
        : defaultCenter;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(initialCenter, 12);

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    // Add markers for locations
    locations.forEach((loc) => {
      if (loc.latitude && loc.longitude) {
        const isEVHub = (loc.evSlots || 0) > 0;
        const icon = createCustomIcon(isEVHub ? 'EV' : 'Regular', loc.availableSlots);
        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);

        const popupContent = `
          <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 180px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${loc.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${loc.address}</p>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
              <span style="color: #059669; font-weight: 600;">${loc.availableSlots || 0} Slots Free</span>
              <span style="font-weight: 700; color: #0f172a;">₹${loc.hourlyRate}/hr</span>
            </div>
            <div style="display:flex;gap:6px;">
              <a href="/parking/${loc._id}" style="
                display:block; flex:1; text-align:center; background-color:#0d9488;
                color:white; padding:6px 8px; border-radius:6px; font-size:12px;
                font-weight:600; text-decoration:none;
              ">View & Reserve</a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}"
                target="_blank" rel="noopener noreferrer" style="
                display:block; text-align:center; background-color:#0f172a;
                color:white; padding:6px 8px; border-radius:6px; font-size:12px;
                font-weight:600; text-decoration:none;
              ">Directions</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectLocation) {
            onSelectLocation(loc);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Show the driver's live position when permission is available.
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userLocation?.lat && userLocation?.lng) {
      const userIcon = L.divIcon({
        className: 'parkeasy-user-location',
        html: '<div style="width:18px;height:18px;border-radius:999px;background:#2563eb;border:4px solid white;box-shadow:0 0 0 8px rgba(37,99,235,.18),0 4px 10px rgba(15,23,42,.25)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<b>Your location</b><br/>ParkEasy is sorting facilities by distance from here.');
    }

    // If a location is selected, pan to it and open popup
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 14, { animate: true });
    }
  }, [locations, selectedLocation, userLocation]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-0">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
        <span>OpenStreetMap • ParkEasy live availability</span>
      </div>
    </div>
  );
};

export default MapView;
