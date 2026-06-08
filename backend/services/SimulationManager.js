const DataGenerator = require('./DataGenerator');

class SimulationManager {
  constructor(io) {
    this.io = io;
    this.profiles = DataGenerator.getAllProfiles();
    this.tripQueues = {}; // tripId -> eventQueue[]
    this.tripIndices = {}; // tripId -> currentEventIndex
    this.simulationRunning = false;
    this.speedMultiplier = 1;
    this.timer = null;
    this.baseInterval = 1000; // 1 second base
    
    // Global Simulation Clock
    this.simStartTime = null;
    this.simCurrentTimeOffset = 0; 
  }

  /**
   * Initializes all trip queues using the DataGenerator.
   */
  initialize() {
    this.profiles.forEach(profileKey => {
      const events = DataGenerator.generateTrip(profileKey);
      const tripId = `TRIP_${profileKey}`;
      this.tripQueues[tripId] = events;
      this.tripIndices[tripId] = 0;
    });
    console.log('Simulation initialized with 5 trip profiles.');
  }

  /**
   * Returns current state of all trips to initialize late-joining clients.
   */
  getCurrentState() {
    const state = {};
    for (const tripId in this.tripQueues) {
      const queue = this.tripQueues[tripId];
      const index = Math.min(this.tripIndices[tripId], queue.length - 1);
      const currentEvent = queue[index];
      const firstEvent = queue[0];

      // Determine logical status
      let status = 'IDLE';
      if (this.tripIndices[tripId] > 0) {
        if (this.tripIndices[tripId] >= queue.length) {
          status = currentEvent.eventType.replace('TRIP_', '');
        } else {
          status = 'MOVING';
        }
      }

      state[tripId] = {
        profileName: firstEvent.payload.profileName,
        vehicleId: firstEvent.payload.vehicleId,
        status: status,
        coords: queue.slice(0, index + 1)
          .filter(e => e.eventType === 'LOCATION_UPDATE' || e.eventType === 'START_TRIP')
          .map(e => e.eventType === 'START_TRIP' ? e.payload.startCoord : { lat: e.payload.lat, lng: e.payload.lng }),
        currentPos: currentEvent.eventType === 'START_TRIP' ? currentEvent.payload.startCoord : { lat: currentEvent.payload.lat, lng: currentEvent.payload.lng },
        events: [], // Historical events can be large, we only send essential state
        totalEventsExpected: firstEvent.payload.eventCount || 1000,
        speed: currentEvent.payload.speed || 0,
        fuel: currentEvent.payload.fuelLevel || 100
      };
    }
    return state;
  }

  /**
   * Starts the simulation emission loop.
   */
  start() {
    if (this.simulationRunning) return;
    this.simulationRunning = true;
    
    // Set the start time for the simulation clock
    if (this.simStartTime === null) {
      this.simStartTime = Date.now();
    }
    
    this._scheduleNextTick();
    console.log('Simulation started.');
    this.io.emit('simulationStatus', { running: true, speed: this.speedMultiplier });
  }

  /**
   * Pauses the simulation emission loop.
   */
  pause() {
    this.simulationRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('Simulation paused.');
    this.io.emit('simulationStatus', { running: false, speed: this.speedMultiplier });
  }

  /**
   * Resets the simulation to the start of all trip queues.
   */
  reset() {
    this.pause();
    this.profiles.forEach(profileKey => {
      const tripId = `TRIP_${profileKey}`;
      this.tripIndices[tripId] = 0;
    });
    this.simStartTime = null;
    this.simCurrentTimeOffset = 0;
    console.log('Simulation reset.');
    this.io.emit('simulationStatus', { running: false, speed: this.speedMultiplier });
  }

  /**
   * Updates the speed multiplier (1, 5, 10).
   */
  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(1, Math.min(10, multiplier));
    console.log(`Simulation speed set to ${this.speedMultiplier}x`);
    this.io.emit('simulationStatus', { running: this.simulationRunning, speed: this.speedMultiplier });
    
    if (this.simulationRunning) {
      if (this.timer) clearTimeout(this.timer);
      this._scheduleNextTick();
    }
  }

  /**
   * Internal loop that emits one event from each active trip queue.
   */
  _scheduleNextTick() {
    if (!this.simulationRunning) return;

    const interval = this.baseInterval / this.speedMultiplier;

    this.timer = setTimeout(() => {
      this._emitCurrentEvents();
      this._scheduleNextTick();
    }, interval);
  }

  _emitCurrentEvents() {
    let anyTripActive = false;

    // Update simulation clock based on logical time passed (1000ms per tick)
    this.simCurrentTimeOffset += this.baseInterval;

    for (const tripId in this.tripQueues) {
      const queue = this.tripQueues[tripId];
      const index = this.tripIndices[tripId];

      if (index < queue.length) {
        const event = queue[index];
        
        // We override the event timestamp to match our simulation clock's progress
        // This ensures that the frontend sees a consistent, time-based stream
        const adjustedEvent = {
          ...event,
          simulationTimestamp: this.simStartTime + this.simCurrentTimeOffset
        };
        
        this.io.emit('simulationEvent', adjustedEvent);
        this.tripIndices[tripId]++;
        anyTripActive = true;
      }
    }

    if (!anyTripActive) {
      console.log('All trips completed. Stopping simulation.');
      this.pause();
    }
  }
}

module.exports = SimulationManager;
