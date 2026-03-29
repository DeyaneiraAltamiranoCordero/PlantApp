import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MyPlantsSection } from '../../components/screenHome/MyPlantsSection';
import { useAuth } from '../../context/AuthContext';
import { ApiError, getUserProfile } from '../../context/services/api';
import { useTheme } from '../../theme/desingSystem';
import { createHomeStyles } from './Home.styles';

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [favoritePlants, setFavoritePlants] = useState<string[]>([]);
  const [plantCategories, setPlantCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const uniqueStrings = (items: Array<string | undefined | null>) => {
    const normalized = items
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
    return Array.from(new Set(normalized));
  };

  const displayName = useMemo(() => {
    const fromAuth = currentUser?.displayName?.trim();
    if (fromAuth) return fromAuth;
    const emailPrefix = currentUser?.email?.split('@')?.[0]?.trim();
    return emailPrefix || 'Usuario';
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (!isMounted) return;

        setFavoritePlants(uniqueStrings(profile.favoritePlants?.map((p) => p.name) ?? []));

        const categoryNamesFromProfile = uniqueStrings(profile.categories?.map((c) => c.name) ?? []);
        const categoryNamesFromPlants = uniqueStrings(profile.plants?.map((p) => p.categoryName) ?? []);
        setPlantCategories(
          categoryNamesFromProfile.length > 0 ? categoryNamesFromProfile : categoryNamesFromPlants,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          if (!isMounted) return;
          setFavoritePlants([]);
          setPlantCategories([]);
          return;
        }
        console.error('Error al cargar resumen:', error);
        Alert.alert('Error', 'No se pudo cargar el resumen.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.userName}>{displayName}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather
            name="search"
            size={18}
            color={theme.colors.mutedForeground}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Buscar"
            placeholderTextColor={theme.colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.xl }}>
        {isLoading ? (
          <View style={{ paddingVertical: theme.spacing.xl }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <MyPlantsSection favoritePlants={favoritePlants} plantCategories={plantCategories} />
        )}
      </View>
    </ScrollView>
  );
}