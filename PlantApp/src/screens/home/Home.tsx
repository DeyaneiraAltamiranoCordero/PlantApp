import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../context/services/api';
import { useTheme } from '../../theme/desingSystem';
import { createHomeStyles } from './Home.styles';

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

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

  const loadSummary = useCallback(async (showLoading = true) => {
    if (!currentUser) return;
    if (showLoading) setIsLoading(true);

    try {
      // Home now only needs minimal info if any, but we'll keep the call
      // or remove it if not needed. Since we removed the states, we can remove the logic.
      await getUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      loadSummary(true);
    }, [loadSummary])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => loadSummary(true)}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
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
          <View style={{ paddingVertical: theme.spacing.xl }}>
             <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center' }}>
                Explora y cuida tus plantas favoritas.
             </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}