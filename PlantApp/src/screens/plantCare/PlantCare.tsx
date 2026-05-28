import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Text, View, Platform, StatusBar } from 'react-native';
import { ApiError, ApiValidationError, Plant, getUserPlants, prefetchPlantCatalogs, updatePlant } from '../../context/services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePlantCareStyles } from './PlantCare.style';
import { PlantCard } from '../../components/screenPlantCare/PlantCard';
import { PlantDetailPanel } from '../../components/screenPlantCare/PlantDetailPanel';
import { PlantTabs } from '../../components/screenPlantCare/PlantTabs';
import { usePlants } from '../../context/PlantContext';

type PlantTab = 'all' | 'favorites' | 'sick';

const tabs: { key: PlantTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'favorites', label: 'Favoritas' },
  { key: 'sick', label: 'Tratamiento' },
];

export default function PlantCareScreen() {
  const { currentUser } = useAuth();
  const { styles, theme } = usePlantCareStyles();
  const { showToast } = useToast();
  const { plants, isLoading, loadPlants, updatePlantLocal, setPlants } = usePlants();
  const [activeTab, setActiveTab] = useState<PlantTab>('all');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [togglingFavoriteIds, setTogglingFavoriteIds] = useState<string[]>([]);

  const handleLoadPlants = async (options?: { showToastOnSuccess?: boolean }) => {
    try {
      await loadPlants();
      if (options?.showToastOnSuccess) {
        showToast({
          kind: 'success',
          title: 'Listo',
          message: 'Actualizamos tu lista de plantas.',
        });
      }
    } catch (error) {
      console.error('Error al obtener plantas', error);
      showToast({ kind: 'error', title: 'Error', message: 'No pudimos cargar tus plantas.' });
    }
  };

  useEffect(() => {
    handleLoadPlants();
    if (currentUser) {
      // Prefetch catalogs once so "Agregar" flows have data ready.
      void prefetchPlantCatalogs();
    }
  }, [currentUser]);

  const isPlantSick = (plant: Plant) => {
    const hasPests = Array.isArray(plant.pests) && plant.pests.length > 0;
    if (hasPests) return true;
    const status = (plant.status ?? '').trim().toLowerCase();
    if (!status) return false;
    // Regla simple: si NO contiene 'saludable', la consideramos enferma / en tratamiento.
    return !status.includes('saludable');
  };

  const favoritesCount = useMemo(() => plants.filter((plant) => plant.isFavorite).length, [plants]);
  const sickCount = useMemo(() => plants.filter(isPlantSick).length, [plants]);

  const filteredPlants = useMemo(() => {
    switch (activeTab) {
      case 'favorites':
        return plants.filter((plant) => plant.isFavorite);
      case 'sick':
        return plants.filter(isPlantSick);
      default:
        return plants;
    }
  }, [activeTab, plants]);

  const handlePlantPress = (plant: Plant) => {
    setSelectedPlant(plant);
  };

  const handlePlantUpdated = (updated: Plant) => {
    updatePlantLocal(updated);
    setSelectedPlant(updated);
  };

  const handlePlantDeleted = (plantId: string) => {
    setPlants((prev) => prev.filter((plant) => plant.id !== plantId));
    setSelectedPlant(null);
  };

  const handleToggleFavorite = async (plant: Plant) => {
    const isBusy = togglingFavoriteIds.includes(plant.id);
    if (isBusy) return;

    const nextIsFavorite = !Boolean(plant.isFavorite);
    setTogglingFavoriteIds((prev) => [...prev, plant.id]);

    // Optimistic update
    updatePlantLocal({ ...plant, isFavorite: nextIsFavorite });
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant({ ...selectedPlant, isFavorite: nextIsFavorite });
    }

    try {
      const updated = await updatePlant(plant.id, { isFavorite: nextIsFavorite });
      updatePlantLocal(updated);
      if (selectedPlant?.id === updated.id) {
        setSelectedPlant(updated);
      }
    } catch (error) {
      console.error('Error actualizando favorito', error);
      // rollback
      updatePlantLocal({ ...plant, isFavorite: Boolean(plant.isFavorite) });
      if (selectedPlant?.id === plant.id) {
        setSelectedPlant({ ...selectedPlant, isFavorite: Boolean(plant.isFavorite) });
      }
      Alert.alert('Error', 'No pudimos actualizar el favorito.');
    } finally {
      setTogglingFavoriteIds((prev) => prev.filter((id) => id !== plant.id));
    }
  };

  const renderHeader = () => (
    <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Plantas</Text>
        <Text style={styles.headerSubtitle}>Organizá y edita las plantas que detectaste o cargaste.</Text>
      </View>
      <PlantTabs
        tabs={tabs.map((tab) => ({
          ...tab,
          count: tab.key === 'favorites' ? favoritesCount : tab.key === 'sick' ? sickCount : plants.length,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <View style={styles.plantsContainer}>
        <Text style={styles.sectionTitle}>Listado</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: theme.spacing.xl }}>
            <PlantCard
              plant={item}
              onPress={() => handlePlantPress(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              isTogglingFavorite={togglingFavoriteIds.includes(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        onRefresh={() => handleLoadPlants({ showToastOnSuccess: true })}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.emptyState, { marginHorizontal: theme.spacing.xl }]}> 
              <Text style={styles.emptyStateText}>
                Todavía no registraste plantas. Escaneá una con la cámara o cargala manualmente.
              </Text>
            </View>
          ) : null
        }
      />
      <PlantDetailPanel
        visible={Boolean(selectedPlant)}
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
        onPlantUpdated={handlePlantUpdated}
        onPlantDeleted={handlePlantDeleted}
      />
    </View>
  );
}
