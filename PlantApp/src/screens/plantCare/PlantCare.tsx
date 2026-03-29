import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Plant, getUserPlants, updatePlant } from '../../context/services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlantCareStyles } from './PlantCare.style';
import { PlantCard } from '../../components/screenPlantCare/PlantCard';
import { PlantDetailPanel } from '../../components/screenPlantCare/PlantDetailPanel';

type PlantTab = 'all' | 'favorites' | 'sick';

const tabs: { key: PlantTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'favorites', label: 'Favoritas' },
  { key: 'sick', label: 'Tratamiento' },
];

export default function PlantCareScreen() {
  const { currentUser } = useAuth();
  const { styles, theme } = usePlantCareStyles();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activeTab, setActiveTab] = useState<PlantTab>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [togglingFavoriteIds, setTogglingFavoriteIds] = useState<string[]>([]);

  const loadPlants = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const response = await getUserPlants(currentUser.uid);
      setPlants(response);
    } catch (error) {
      console.error('Error al obtener plantas', error);
      Alert.alert('Error', 'No pudimos cargar tus plantas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlants();
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
    setPlants((prev) => prev.map((plant) => (plant.id === updated.id ? updated : plant)));
    setSelectedPlant(updated);
  };

  const handleToggleFavorite = async (plant: Plant) => {
    const isBusy = togglingFavoriteIds.includes(plant.id);
    if (isBusy) return;

    const nextIsFavorite = !Boolean(plant.isFavorite);
    setTogglingFavoriteIds((prev) => [...prev, plant.id]);

    // Optimistic update
    setPlants((prev) => prev.map((p) => (p.id === plant.id ? { ...p, isFavorite: nextIsFavorite } : p)));
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant({ ...selectedPlant, isFavorite: nextIsFavorite });
    }

    try {
      const updated = await updatePlant(plant.id, { isFavorite: nextIsFavorite });
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPlant?.id === updated.id) {
        setSelectedPlant(updated);
      }
    } catch (error) {
      console.error('Error actualizando favorito', error);
      // rollback
      setPlants((prev) => prev.map((p) => (p.id === plant.id ? { ...p, isFavorite: Boolean(plant.isFavorite) } : p)));
      if (selectedPlant?.id === plant.id) {
        setSelectedPlant({ ...selectedPlant, isFavorite: Boolean(plant.isFavorite) });
      }
      Alert.alert('Error', 'No pudimos actualizar el favorito.');
    } finally {
      setTogglingFavoriteIds((prev) => prev.filter((id) => id !== plant.id));
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Plantas</Text>
        <Text style={styles.headerSubtitle}>Organizá y edita las plantas que detectaste o cargaste.</Text>
      </View>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const count =
            tab.key === 'favorites' ? favoritesCount : tab.key === 'sick' ? sickCount : plants.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.plantsContainer}>
        <Text style={styles.sectionTitle}>Listado</Text>
      </View>
    </>
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
        onRefresh={loadPlants}
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
      />
    </View>
  );
}
