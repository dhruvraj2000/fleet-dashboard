import { io } from 'socket.io-client';
import { useFleetStore } from '../store/useFleetStore';
import { useTripStore } from '../store/useTripStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);

// Helper to categorize event types into UI severity
const getEventSeverity = (eventType) => {
  const severityMap = {
    // Errors
    'ENGINE_ERROR': 'ERROR',
    'ENGINE_OVERHEAT': 'ERROR',
    'FUEL_LEAK': 'ERROR',
    'SENSORS_FAILURE': 'ERROR',
    'GPS_LOSS': 'ERROR',
    'WEIGHT_OVERLOAD': 'ERROR',
    'CARGO_TEMP_ALERT': 'ERROR',
    
    // Warnings
    'ROUTE_DEVIATION': 'WARNING',
    'OFF_ROUTE_ALERT': 'WARNING',
    'OVERSPEED': 'WARNING',
    'BRAKE_HARD': 'WARNING',
    'ACCELERATION_HARD': 'WARNING',
    'BATTERY_LOW': 'WARNING',
    'TIRE_PRESSURE_LOW': 'WARNING',
    'DRIVER_FATIGUE': 'WARNING',
    'SCHEDULE_DELAY': 'WARNING',
    
    // Info
    'LOCATION_UPDATE': 'INFO',
    'SPEED_CHANGE': 'INFO',
    'FUEL_UPDATE': 'INFO',
    'START_TRIP': 'INFO',
    'TRIP_COMPLETED': 'INFO',
    'TRIP_CANCELLED': 'INFO',
    'GPS_RESTORED': 'INFO',
    'DOOR_OPEN': 'INFO',
    'DOOR_CLOSED': 'INFO',
    'SCHEDULE_AHEAD': 'INFO',
    'IDLE_TIMEOUT': 'INFO',
  };
  return severityMap[eventType] || 'INFO';
};

export const SocketService = {
  init() {
    socket.on('simulationStatus', (status) => {
      useFleetStore.getState().setSimulationStatus(status);
    });

    socket.on('init', (trips) => {
      Object.entries(trips).forEach(([tripId, data]) => {
        useTripStore.getState().updateTrip(tripId, data);
      });
      
      // Update initial metrics
      const allTrips = Object.values(trips);
      const metrics = {
        totalTrips: allTrips.length,
        activeTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        avgFleetSpeed: 0,
        progressDistribution: { '0-25%': 5, '26-50%': 0, '51-75%': 0, '76-100%': 0 }
      };
      useFleetStore.getState().updateFleetMetrics(metrics);
    });

    socket.on('simulationEvent', (event) => {
      const { tripId, eventType, payload, timestamp } = event;
      const tripStore = useTripStore.getState();
      const fleetStore = useFleetStore.getState();

      const currentTrip = tripStore.trips[tripId] || {};
      let updatedTrip = { ...currentTrip };

      // 1. Update Trip State & Analytics
      if (eventType === 'START_TRIP') {
        updatedTrip = {
          ...updatedTrip,
          status: 'MOVING',
          profileName: payload.profileName,
          vehicleId: payload.vehicleId,
          coords: [payload.startCoord],
          currentPos: payload.startCoord,
          events: [{ type: 'START_TRIP', timestamp, ...payload }],
          totalEventsExpected: payload.eventCount || 1000, 
          errorCount: 0
        };
      } else if (eventType === 'LOCATION_UPDATE') {
        updatedTrip.coords = [...(updatedTrip.coords || []), { lat: payload.lat, lng: payload.lng }];
        updatedTrip.currentPos = { lat: payload.lat, lng: payload.lng };
        updatedTrip.speed = payload.speed;
      } else if (eventType === 'FUEL_UPDATE') {
        updatedTrip.fuel = payload.fuelLevel;
      } else if (getEventSeverity(eventType) === 'ERROR') {
        updatedTrip.status = 'ERROR';
        updatedTrip.errorCount = (updatedTrip.errorCount || 0) + 1;
        updatedTrip.lastError = payload.error || payload.detail || 'System Error';
      } else if (getEventSeverity(eventType) === 'WARNING') {
        updatedTrip.status = 'WARNING';
        updatedTrip.lastWarning = payload.deviation || payload.value || 'System Warning';
      } else if (eventType === 'TRIP_COMPLETED') {
        updatedTrip.status = 'COMPLETED';
      } else if (eventType === 'TRIP_CANCELLED') {
        updatedTrip.status = 'CANCELLED';
      }

      // Append event to history (don't duplicate START_TRIP)
      if (eventType !== 'START_TRIP') {
        updatedTrip.events = [...(updatedTrip.events || []), { 
          type: eventType, 
          severity: getEventSeverity(eventType),
          timestamp, 
          ...payload 
        }];
      }
      
      useTripStore.getState().updateTrip(tripId, updatedTrip);

      // 2. Update Fleet Metrics
      const updatedTrips = useTripStore.getState().trips;
      const allTrips = Object.values(updatedTrips);
      
      // Calculate Progress Distribution
      const distribution = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
      
      allTrips.forEach(trip => {
        const total = trip.totalEventsExpected || 1000;
        const current = trip.events?.length || 0;
        const progress = current / total;
        
        if (progress <= 0.25) distribution['0-25%']++;
        else if (progress <= 0.50) distribution['26-50%']++;
        else if (progress <= 0.75) distribution['51-75%']++;
        else distribution['76-100%']++;
      });

      const metrics = {
        totalTrips: allTrips.length,
        activeTrips: allTrips.filter(t => t.status === 'MOVING' || t.status === 'WARNING' || t.status === 'ERROR').length,
        completedTrips: allTrips.filter(t => t.status === 'COMPLETED').length,
        cancelledTrips: allTrips.filter(t => t.status === 'CANCELLED').length,
        avgFleetSpeed: allTrips.reduce((acc, t) => acc + (t.speed || 0), 0) / (allTrips.length || 1),
        progressDistribution: distribution
      };
      useFleetStore.getState().updateFleetMetrics(metrics);
    });
  },

  startSimulation: () => socket.emit('startSimulation'),
  pauseSimulation: () => socket.emit('pauseSimulation'),
  resetSimulation: () => {
    useTripStore.getState().resetTrips();
    socket.emit('resetSimulation');
  },
  setSimulationSpeed: (speed) => socket.emit('setSimulationSpeed', speed),
};
