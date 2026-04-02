import { create } from 'zustand';
import initialCars from '../data/cars.json';
import { DEFAULT_SCENARIO_ORDER } from '../data/scenarios';

export const useStore = create((set) => ({
  fleet: initialCars,
  customCars: [],
  selectedSegment: null, // 'spare', 'middle', 'main'
  /** Ordered IDs: index 0 = highest priority for matching */
  scenarioPriorityOrder: [...DEFAULT_SCENARIO_ORDER],
  compareList: [],

  setSegment: (segment) => set({ selectedSegment: segment }),

  setScenarioPriorityOrder: (order) => set({ scenarioPriorityOrder: order }),

  addToCompare: (carId) =>
    set((state) => {
      if (state.compareList.includes(carId)) return state;
      if (state.compareList.length >= 3) return state;
      return { compareList: [...state.compareList, carId] };
    }),

  removeFromCompare: (carId) =>
    set((state) => ({
      compareList: state.compareList.filter((id) => id !== carId),
    })),

  clearCompare: () => set({ compareList: [] }),

  addCustomCar: (car) =>
    set((state) => ({
      customCars: [...state.customCars, car],
      fleet: [...state.fleet, car],
    })),

  reset: () =>
    set({
      selectedSegment: null,
      scenarioPriorityOrder: [...DEFAULT_SCENARIO_ORDER],
      compareList: [],
    }),
}));
