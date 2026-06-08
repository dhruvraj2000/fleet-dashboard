import React from 'react';
import { useTripStore } from '../store/useTripStore';

const TripDetailView = () => {
  const { selectedTripId, trips } = useTripStore();
  const trip = trips[selectedTripId];

  if (!selectedTripId || !trip) {
    return (
      <div className="panel detail-panel empty">
        <p>Select a vehicle to view detailed telemetry</p>
      </div>
    );
  }

  return (
    <div className="panel detail-panel">
      <h2>Trip Detail: {trip.profileName}</h2>
      <div className="detail-grid">
        <div className="detail-item">
          <span className="label">Vehicle ID</span>
          <span className="value">{trip.vehicleId}</span>
        </div>
        <div className="detail-item">
          <span className="label">Status</span>
          <span className={`value status-${trip.status?.toLowerCase()}`}>{trip.status}</span>
        </div>
        <div className="detail-item">
          <span className="label">Current Speed</span>
          <span className="value">{trip.speed?.toFixed(2)} km/h</span>
        </div>
        <div className="detail-item">
          <span className="label">Fuel Level</span>
          <span className="value">{trip.fuel?.toFixed(1)}%</span>
        </div>
      </div>
      
      {trip.lastError && (
        <div className="alert error">
          <strong>CRITICAL ERROR:</strong> {trip.lastError}
        </div>
      )}
      {trip.lastWarning && (
        <div className="alert warning">
          <strong>WARNING:</strong> {trip.lastWarning}
        </div>
      )}
    </div>
  );
};

export default TripDetailView;
