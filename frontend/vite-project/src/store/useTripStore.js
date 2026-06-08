import { create } from 'zustand';

export const useTripStore = create((set, get) => ({
  trips: {}, // tripId -> tripData
  selectedTripId: null,

  updateTrip: (tripId, data) => set((state) => {
    const currentTrip = state.trips[tripId] || { 
      coords: [], 
      events: [], 
      status: 'IDLE',
      distance: 0,
      errorCount: 0,
      totalEventsExpected: 0
    };

    return {
      trips: {
        ...state.trips,
        [tripId]: {
          ...currentTrip,
          ...data
        }
      }
    };
  }),

  setSelectedTrip: (tripId) => set({ selectedTripId: tripId }),

  resetTrips: () => set({ trips: {}, selectedTripId: null }),
}));

