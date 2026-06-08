import React, { memo } from 'react';
import { useTripStore } from '../store/useTripStore';

const TripItem = memo(({ trip, tripId, isSelected, setSelectedTrip }) => {
  // Calculate progress based on event count vs expected
  const progress = trip.totalEventsExpected 
    ? Math.min(100, ((trip.events?.length || 0) / trip.totalEventsExpected) * 100) 
    : (trip.events?.length || 0 > 0 ? Math.min(100, (trip.events.length / 1000) * 100) : 0);

  return (
    <div 
      className={`trip-card ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedTrip(tripId)}
    >
      <div className="trip-header">
        <span className="trip-name">{trip.profileName || tripId}</span>
        <span className={`status-badge ${trip.status?.toLowerCase()}`}>
          {trip.status || 'IDLE'}
        </span>
      </div>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="trip-footer">
        <span>Speed: {trip.speed?.toFixed(1) || 0} km/h</span>
        <span>Fuel: {trip.fuel?.toFixed(1) || 100}%</span>
      </div>
    </div>
  );
});

TripItem.displayName = 'TripItem';

const TripListPanel = () => {
  const { trips, selectedTripId, setSelectedTrip } = useTripStore();

  return (
    <div className="panel list-panel">
      <h2>Vehicle Trips</h2>
      <div className="trip-list">
        {Object.entries(trips).map(([tripId, trip]) => (
          <TripItem 
            key={tripId} 
            tripId={tripId} 
            trip={trip} 
            isSelected={selectedTripId === tripId} 
            setSelectedTrip={setSelectedTrip} 
          />
        ))}
      </div>
    </div>
  );
};

export default TripListPanel;
