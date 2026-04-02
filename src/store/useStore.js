import { create } from 'zustand';
import initialCars from '../data/cars.json';
import { DEFAULT_SCENARIO_ORDER } from '../data/scenarios';
import {
  readCustomCarsFromCookie,
  writeCustomCarsToCookie,
} from '../lib/customCarsCookie.js';

const catalogCars = [...initialCars];
const bootCustom = readCustomCarsFromCookie();

function buildFleet(customCars) {
  return [...catalogCars, ...customCars];
}

export const useStore = create((set) => ({
  fleet: buildFleet(bootCustom),
  customCars: bootCustom,
  selectedSegment: null,
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
    set((state) => {
      if (!car?.id) return state;
      const withoutDup = state.customCars.filter((c) => c.id !== car.id);
      const customCars = [...withoutDup, car];
      writeCustomCarsToCookie(customCars);
      return {
        customCars,
        fleet: buildFleet(customCars),
      };
    }),

  reset: () =>
    set({
      selectedSegment: null,
      scenarioPriorityOrder: [...DEFAULT_SCENARIO_ORDER],
      compareList: [],
    }),
}));
