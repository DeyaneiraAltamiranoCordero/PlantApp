import React, { createContext, useContext, useState, useCallback } from 'react';
import { Plant, getUserPlants, createPlant as apiCreatePlant, CreatePlantPayload } from './services/api';
import { useAuth } from './AuthContext';

interface PlantContextType {
  plants: Plant[];
  isLoading: boolean;
  loadPlants: (options?: { showToastOnSuccess?: boolean }) => Promise<void>;
  addPlant: (payload: CreatePlantPayload) => Promise<Plant>;
  updatePlantLocal: (updatedPlant: Plant) => void;
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
}

const PlantContext = createContext<PlantContextType | null>(null);

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPlants = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const response = await getUserPlants(currentUser.uid);
      setPlants(response);
    } catch (error) {
      console.error('Error loading plants in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const addPlant = async (payload: CreatePlantPayload) => {
    try {
      const newPlant = await apiCreatePlant(payload);
      setPlants((prev) => [newPlant, ...prev]);
      return newPlant;
    } catch (error) {
      console.error('Error adding plant in context:', error);
      throw error;
    }
  };

  const updatePlantLocal = (updatedPlant: Plant) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
    );
  };

  return (
    <PlantContext.Provider
      value={{
        plants,
        isLoading,
        loadPlants,
        addPlant,
        updatePlantLocal,
        setPlants,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants() {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants must be used within a PlantProvider');
  }
  return context;
}
