import { create } from 'zustand';

interface SelectedPropertyState {
  propertyId: string | null;
  setPropertyId: (id: string) => void;
}

export const useSelectedProperty = create<SelectedPropertyState>((set) => ({
  propertyId: null,
  setPropertyId: (id) => set({ propertyId: id }),
})); 