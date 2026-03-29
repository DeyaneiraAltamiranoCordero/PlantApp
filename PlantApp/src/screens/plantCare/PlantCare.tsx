import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Plant, getUserPlants } from '../../context/services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlantCareStyles } from './PlantCare.style';
import { PlantCard } from '../../components/screenPlantCare/PlantCard';
import { PlantDetailPanel } from '../../components/screenPlantCare/PlantDetailPanel';

type PlantTab = 'all' | 'favorites' | 'detection';

const tabs: { key: PlantTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'favorites', label: 'Favoritas' },
  { key: 'detection', label: 'Detectadas' },
];

export default function PlantCareScreen() {
  const { currentUser } = useAuth();
  const { styles, theme } = usePlantCareStyles();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activeTab, setActiveTab] = useState<PlantTab>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

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

  const favoritesCount = useMemo(() => plants.filter((plant) => plant.isFavorite).length, [plants]);
  const detectionCount = useMemo(
    () => plants.filter((plant) => plant.source === 'detection').length,
    [plants],
  );

  const filteredPlants = useMemo(() => {
    switch (activeTab) {
      case 'favorites':
        return plants.filter((plant) => plant.isFavorite);
      case 'detection':
        return plants.filter((plant) => plant.source === 'detection');
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
            tab.key === 'favorites' ? favoritesCount : tab.key === 'detection' ? detectionCount : plants.length;
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
            <PlantCard plant={item} onPress={() => handlePlantPress(item)} />
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
