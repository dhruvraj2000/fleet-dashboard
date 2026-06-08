import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSystemStore } from '../store/useSystemStore';
import { useWebSocket } from '../hooks/useWebSocket';

// Custom Marker for Vehicles
const vehicleIcon = new L.DivIcon({
  className: 'vehicle-marker',
  html: `<div style="background-color: #38bdf8; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #38bdf8;"></div>`,
  iconSize: [12, 12],
});

const GeofenceMap = () => {
  const { geofences, vehicles, setGeofences } = useSystemStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState([]);

  useWebSocket();

  // Component to handle map click events for drawing polygons
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (!isDrawing) return;
        setCurrentCoords(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      },
    });
    return null;
  };

  const saveGeofence = async () => {
    if (currentCoords.length < 3) {
      alert('Please select at least 3 points to create a polygon.');
      return;
    }

    const name = prompt('Enter Geofence Name:');
    if (!name) return;

    const category = prompt('Enter Category (delivery_zone, restricted_zone, toll_zone):', 'delivery_zone');

    try {
      const response = await fetch('http://localhost:8080/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          coordinates: currentCoords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh geofences list
        const res = await fetch('http://localhost:8080/geofences');
        const list = await res.json();
        setGeofences(list.geofences);
        setCurrentCoords([]);
        setIsDrawing(false);
      }
    } catch (err) {
      console.error('Error saving geofence:', err);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <div style={{ 
        position: 'absolute', top: 20, right: 20, zIndex: 1000, 
        background: 'white', padding: '1rem', borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', gap: '10px' 
      }}>
        <button 
          onClick={() => setIsDrawing(!isDrawing)}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: isDrawing ? '#ef4444' : '#38bdf8', 
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          {isDrawing ? 'Cancel Drawing' : 'Draw Geofence'}
        </button>
        {isDrawing && (
          <button 
            onClick={saveGeofence}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Save Polygon
          </button>
        )}
      </div>

      <MapContainer center={[37.7749, -122.4194]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        <MapEvents />

        {/* Render Existing Geofences */}
        {geofences.map(g => (
          <Polygon 
            key={g.id} 
            positions={g.coordinates} 
            color={g.category === 'restricted_zone' ? 'red' : 'blue'}
            fillOpacity={0.3}
          >
            <Popup><strong>{g.name}</strong><br/>{g.category}</Popup>
          </Polygon>
        ))}

        {/* Render Drawing Guide */}
        {isDrawing && currentCoords.length > 0 && (
          <Polyline positions={currentCoords} color="yellow" dashArray="5, 10" />
        )}

        {/* Render Vehicles */}
        {vehicles.map(v => (
          v.current_location && (
            <Marker 
              key={v.id} 
              position={[v.current_location.latitude, v.current_location.longitude]} 
              icon={vehicleIcon}
            >
              <Popup>{v.vehicle_number}<br/>{v.driver_name}</Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

// Helper for Polyline (needed for drawing guide)
import { Polyline } from 'react-leaflet';

export default GeofenceMap;
