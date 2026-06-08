import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTripStore } from '../store/useTripStore';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker function to return a colored marker based on status
const createStatusMarker = (status) => {
  const colors = {
    MOVING: '#38bdf8',   // Sky 400
    ERROR: '#ef4444',    // Red 500
    WARNING: '#eab308',  // Yellow 500
    COMPLETED: '#22c55e',// Green 500
    CANCELLED: '#64748b',// Slate 500
  };

  const color = colors[status] || '#94a3b8';

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `<div style="
      background-color: ${color}; 
      width: 12px; 
      height: 12px; 
      border-radius: 50%; 
      border: 2px solid white; 
      box-shadow: 0 0 8px ${color};
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

// Component to handle map auto-centering when a trip is selected
function MapRecenter({ tripId }) {
  const map = useMap();
  const { trips } = useTripStore();
  const trip = trips[tripId];

  useEffect(() => {
    // Safety check: Only move the map if lat and lng are actually numbers
    if (trip && trip.currentPos && typeof trip.currentPos.lat === 'number' && typeof trip.currentPos.lng === 'number') {
      map.setView([trip.currentPos.lat, trip.currentPos.lng], 13, { animate: true });
    }
  }, [tripId, trip?.currentPos, map]);

  return null;
}

// Component for a single vehicle to handle smooth marker interpolation
const VehicleMarker = ({ trip, isSelected }) => {
  const [position, setPosition] = useState(trip.currentPos);

  useEffect(() => {
    // Safety check: If currentPos is missing or invalid, don't animate
    if (!trip.currentPos || typeof trip.currentPos.lat !== 'number' || typeof trip.currentPos.lng !== 'number') {
      return;
    }

    const startPos = position || trip.currentPos;
    const endPos = { ...trip.currentPos };
    const duration = 1000; // Match the base simulation interval
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = startPos.lat + (endPos.lat - startPos.lat) * progress;
      const currentLng = startPos.lng + (endPos.lng - startPos.lng) * progress;

      setPosition({ lat: currentLat, lng: currentLng });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [trip.currentPos]);

  // FINAL SAFETY GATE: If position is still undefined or invalid, return nothing (prevents the crash)
  if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number') {
    return null;
  }

  return (
    <Marker 
      position={[position.lat, position.lng]} 
      icon={createStatusMarker(trip.status)} 
    />
  );
};

const FleetMap = () => {
  const { trips, selectedTripId } = useTripStore();

  return (
    <MapContainer 
      center={[20.5937, 78.9629]} 
      zoom={5} 
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {Object.entries(trips).map(([tripId, trip]) => {
        if (!trip.currentPos) return null;

        return (
          <React.Fragment key={tripId}>
            <Polyline 
              positions={trip.coords} 
              color={selectedTripId === tripId ? '#38bdf8' : '#334155'} 
              weight={selectedTripId === tripId ? 4 : 2}
              opacity={selectedTripId === tripId ? 0.8 : 0.3}
              smoothFactor={1}
            />
            <VehicleMarker trip={trip} isSelected={selectedTripId === tripId} />
          </React.Fragment>
        );
      })}

      {selectedTripId && <MapRecenter tripId={selectedTripId} />}
    </MapContainer>
  );
};

export default FleetMap;
