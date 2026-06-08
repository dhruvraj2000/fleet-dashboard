import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import GeofenceMap from './GeofenceMap';

const Dashboard = () => {
  const { alerts, vehicles, geofences, setVehicles, setGeofences } = useSystemStore();

  useEffect(() => {
    // Initial load
    const fetchData = async () => {
      const vRes = await fetch('http://localhost:8080/vehicles');
      const vData = await vRes.json();
      setVehicles(vData.vehicles);

      const gRes = await fetch('http://localhost:8080/geofences');
      const gData = await gRes.json();
      setGeofences(gData.geofences);
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar for Alerts & Stats */}
      <div style={{ 
        width: '350px', 
        background: '#1e293b', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '1px solid #334155',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Geofence Monitor</h1>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <div style={{ background: '#334155', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem' }}>
              Vehicles: {vehicles.length}
            </div>
            <div style={{ background: '#334155', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem' }}>
              Fences: {geofences.length}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Real-time Alerts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>No alerts yet...</p>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} style={{ 
                  padding: '10px', 
                  borderRadius: '6px', 
                  background: alert.event_type === 'entry' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderLeft: `4px solid ${alert.event_type === 'entry' ? '#38bdf8' : '#ef4444'}`,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {alert.event_type.toUpperCase()} - {alert.vehicle.vehicle_number}
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {alert.geofence.geofence_name} | {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GeofenceMap />
      </div>
    </div>
  );
};

export default Dashboard;
