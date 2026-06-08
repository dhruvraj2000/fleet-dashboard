import { create } from 'zustand';

export const useFleetStore = create((set) => ({
  simulationStatus: {
    running: false,
    speed: 1,
  },
  isDarkMode: true, // Enterprise default
  fleetMetrics: {
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    avgFleetSpeed: 0,
    progressDistribution: {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0,
    },
  },
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  updateFleetMetrics: (metrics) => set((state) => ({
    fleetMetrics: {
      ...state.fleetMetrics,
      ...metrics
    }
  })),
}));
