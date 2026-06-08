const TRIP_PROFILES = {
  LONG_HAUL: {
    name: 'Cross-Country Long Haul',
    eventCount: 10000,
    startCoord: { lat: 28.6139, lng: 77.2090 }, // Delhi
    destCoord: { lat: 19.0760, lng: 72.8777 },  // Mumbai
    baseSpeed: 80,
    characteristics: 'Consistent high speed, long distance'
  },
  URBAN_DELIVERY: {
    name: 'Urban Dense Delivery',
    eventCount: 500,
    startCoord: { lat: 12.9716, lng: 77.5946 }, // Bangalore
    destCoord: { lat: 12.9300, lng: 77.6100 },  // Local Bangalore
    baseSpeed: 20,
    characteristics: 'Frequent stops, low speed, high density'
  },
  MOUNTAIN_ROUTE: {
    name: 'Mountain Route',
    eventCount: 100,
    startCoord: { lat: 32.2434, lng: 77.2295 }, // Shimla
    destCoord: { lat: 32.5000, lng: 77.5000 },  // Manali
    baseSpeed: 30,
    characteristics: 'Ends in TRIP_CANCELLED'
  },
  SOUTHERN_ISSUES: {
    name: 'Southern Technical Issues',
    eventCount: 1000,
    startCoord: { lat: 13.0827, lng: 80.2707 }, // Chennai
    destCoord: { lat: 11.0168, lng: 76.9558 },  // Kochi
    baseSpeed: 60,
    characteristics: 'Includes ENGINE_ERROR and ROUTE_DEVIATION'
  },
  REGIONAL_LOGISTICS: {
    name: 'Regional Logistics',
    eventCount: 2000,
    startCoord: { lat: 22.5726, lng: 88.3639 }, // Kolkata
    destCoord: { lat: 23.0225, lng: 85.3097 },  // Dhanbad
    baseSpeed: 50,
    characteristics: 'Standard logistics profile'
  }
};

const EVENT_TYPES = {
  // Core Events
  START_TRIP: 'START_TRIP',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  SPEED_CHANGE: 'SPEED_CHANGE',
  FUEL_UPDATE: 'FUEL_UPDATE',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  TRIP_CANCELLED: 'TRIP_CANCELLED',

  // Technical/Error Events
  ENGINE_ERROR: 'ENGINE_ERROR',
  ENGINE_OVERHEAT: 'ENGINE_OVERHEAT',
  BATTERY_LOW: 'BATTERY_LOW',
  TIRE_PRESSURE_LOW: 'TIRE_PRESSURE_LOW',
  FUEL_LEAK: 'FUEL_LEAK',
  GPS_LOSS: 'GPS_LOSS',
  GPS_RESTORED: 'GPS_RESTORED',

  // Driver Behavior Events
  BRAKE_HARD: 'BRAKE_HARD',
  ACCELERATION_HARD: 'ACCELERATION_HARD',
  SUDDEN_STOP: 'SUDDEN_STOP',
  OVERSPEED: 'OVERSPEED',
  DRIVER_FATIGUE: 'DRIVER_FATIGUE',

  // Operational Events
  ROUTE_DEVIATION: 'ROUTE_DEVIATION',
  OFF_ROUTE_ALERT: 'OFF_ROUTE_ALERT',
  SCHEDULE_DELAY: 'SCHEDULE_DELAY',
  SCHEDULE_AHEAD: 'SCHEDULE_AHEAD',
  IDLE_TIMEOUT: 'IDLE_TIMEOUT',

  // Cargo/Vehicle Events
  DOOR_OPEN: 'DOOR_OPEN',
  DOOR_CLOSED: 'DOOR_CLOSED',
  WEIGHT_OVERLOAD: 'WEIGHT_OVERLOAD',
  CARGO_TEMP_ALERT: 'CARGO_TEMP_ALERT',
  SENSORS_FAILURE: 'SENSORS_FAILURE'
};

class DataGenerator {
  /**
   * Generates a full event stream for a specific trip profile.
   */
  static generateTrip(profileKey) {
    const profile = TRIP_PROFILES[profileKey];
    if (!profile) throw new Error(`Unknown trip profile: ${profileKey}`);

    const events = [];
    const tripId = `TRIP_${profileKey}`;
    let currentLat = profile.startCoord.lat;
    let currentLng = profile.startCoord.lng;
    let currentSpeed = profile.baseSpeed;
    let currentFuel = 100;
    let distanceTraveled = 0;
    const startTime = Date.now();

    // 1. START_TRIP
    events.push({
      timestamp: startTime,
      tripId,
      eventType: EVENT_TYPES.START_TRIP,
      payload: {
        vehicleId: `V-${profileKey}`,
        startCoord: profile.startCoord,
        destCoord: profile.destCoord,
        profileName: profile.name,
        eventCount: profile.eventCount
      }
    });

    const totalLatDiff = profile.destCoord.lat - profile.startCoord.lat;
    const totalLngDiff = profile.destCoord.lng - profile.startCoord.lng;
    const latStep = totalLatDiff / profile.eventCount;
    const lngStep = totalLngDiff / profile.eventCount;

    for (let i = 1; i < profile.eventCount; i++) {
      currentLat += latStep + (Math.random() - 0.5) * 0.001;
      currentLng += lngStep + (Math.random() - 0.5) * 0.001;
      currentSpeed = profile.baseSpeed + (Math.random() - 0.5) * 20;
      currentFuel -= Math.random() * 0.05;

      let eventType = EVENT_TYPES.LOCATION_UPDATE;
      let payload = { lat: currentLat, lng: currentLng, speed: currentSpeed };

      // Random Event Injection based on probabilities
      const rand = Math.random();

      if (profileKey === 'SOUTHERN_ISSUES' && i === Math.floor(profile.eventCount * 0.3)) {
        eventType = EVENT_TYPES.ENGINE_ERROR;
        payload = { error: 'Overheating detected', severity: 'CRITICAL' };
      } else if (profileKey === 'SOUTHERN_ISSUES' && i === Math.floor(profile.eventCount * 0.6)) {
        eventType = EVENT_TYPES.ROUTE_DEVIATION;
        payload = { deviation: 'Off-track by 2km', recoverySuggested: true };
      } else if (rand < 0.01) {
        // Rare Critical Errors
        const errors = [EVENT_TYPES.ENGINE_OVERHEAT, EVENT_TYPES.FUEL_LEAK, EVENT_TYPES.SENSORS_FAILURE];
        eventType = errors[Math.floor(Math.random() * errors.length)];
        payload = { severity: 'CRITICAL', detail: 'Unexpected system failure' };
      } else if (rand < 0.05) {
        // Driver Behavior
        const behaviors = [EVENT_TYPES.BRAKE_HARD, EVENT_TYPES.ACCELERATION_HARD, EVENT_TYPES.OVERSPEED];
        eventType = behaviors[Math.floor(Math.random() * behaviors.length)];
        payload = { value: currentSpeed, threshold: profile.baseSpeed * 1.2 };
      } else if (rand < 0.08) {
        // Operational Alerts
        const ops = [EVENT_TYPES.IDLE_TIMEOUT, EVENT_TYPES.DOOR_OPEN, EVENT_TYPES.GPS_LOSS];
        eventType = ops[Math.floor(Math.random() * ops.length)];
        payload = { duration: Math.floor(Math.random() * 300), status: 'ALERT' };
      } else if (i % 50 === 0) {
        eventType = EVENT_TYPES.SPEED_CHANGE;
        payload = { newSpeed: currentSpeed };
      } else if (i % 100 === 0) {
        eventType = EVENT_TYPES.FUEL_UPDATE;
        payload = { fuelLevel: currentFuel };
      }

      events.push({
        timestamp: startTime + (i * 1000),
        tripId,
        eventType,
        payload
      });
    }

    const finalEventType = (profileKey === 'MOUNTAIN_ROUTE' && Math.random() > 0.5) 
      ? EVENT_TYPES.TRIP_CANCELLED 
      : EVENT_TYPES.TRIP_COMPLETED;

    events.push({
      timestamp: startTime + (profile.eventCount * 1000),
      tripId,
      eventType: finalEventType,
      payload: { 
        finalCoord: { lat: currentLat, lng: currentLng },
        totalDistance: distanceTraveled 
      }
    });

    return events;
  }

  static getAllProfiles() {
    return Object.keys(TRIP_PROFILES);
  }
}

module.exports = DataGenerator;
