import React, { memo } from 'react';
import { useTripStore } from '../store/useTripStore';

const EventEntry = memo(({ event }) => {
  const __time = new Date(event.timestamp).toLocaleTimeString();
  
  return (
    <div className={`event-entry ${event.severity?.toLowerCase() || 'info'}`}>
      <span className="event-time">{__time}</span>
      <span className="event-trip">{event.tripId || 'System'}</span>
      <span className="event-type">{event.type}</span>
      <span className="event-data">{JSON.stringify(event.payload)}</span>
    </div>
  );
});

EventEntry.displayName = 'EventEntry';

const LiveEventFeed = () => {
  const { trips } = useTripStore();
  
  // Aggregate and sort events. Use useMemo in a real app, but here we slice for performance.
  const allEvents = Object.values(trips)
    .flatMap(trip => trip.events || [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  return (
    <div className="panel feed-panel">
      <h2>Live Event Feed</h2>
      <div className="event-log">
        {allEvents.length === 0 ? (
          <p className="empty-msg" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1rem' }}>
            Waiting for events...
          </p>
        ) : (
          allEvents.map((event, idx) => (
            <EventEntry key={`${event.timestamp}-${idx}`} event={event} />
          ))
        )}
      </div>
    </div>
  );
};

export default LiveEventFeed;
