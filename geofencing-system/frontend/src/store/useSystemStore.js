import { create } from 'zustand';

export const useSystemStore = create((set) => ({
  geofences: [],
  vehicles: [],
  alerts: [],
  selectedVehicle: null,
  
  setGeofences: (geofences) => set({ geofences }),
  setVehicles: (vehicles) => set({ vehicles }),
  
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 100) 
  })),
  
  updateVehicleLocation: (vehicleId, location, currentGeofences) => set((state) => {
    const updatedVehicles = state.vehicles.map(v => 
      v.id === vehicleId ? { ...v, current_location: location, current_geofences: currentGeofences } : v
    );
    return { vehicles: updatedVehicles };
  }),

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
}));
