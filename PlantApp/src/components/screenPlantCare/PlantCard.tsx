import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Plant } from '../../context/services/api';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onToggleFavorite: () => void;
  isTogglingFavorite?: boolean;
}

export function PlantCard({ plant, onPress, onToggleFavorite, isTogglingFavorite }: PlantCardProps) {
  const { theme, styles } = usePlantCareStyles();

  const isFavorite = Boolean(plant.isFavorite);
  const hasPests = Array.isArray(plant.pests) && plant.pests.length > 0;
  const statusLabel = hasPests ? 'Enferma' : plant.status?.trim() || 'Saludable';

  return (
    <TouchableOpacity style={styles.plantCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.plantCardHeader}>
        {plant.imageUrl ? (
          <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
        ) : (
          <View style={styles.plantImagePlaceholder}>
            <Feather name="image" size={24} color={theme.colors.mutedForeground} />
          </View>
        )}

        <View style={styles.plantMainInfo}>
          <View style={styles.plantNameRow}>
            <Text numberOfLines={1} style={styles.plantName}>{plant.name}</Text>
            <TouchableOpacity
              onPress={onToggleFavorite}
              disabled={Boolean(isTogglingFavorite)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.favoriteIcon}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? theme.colors.destructive : theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.plantCategory} numberOfLines={1}>
            {plant.categoryName || 'Sin categoría'}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
              alignItems: 'center',
            }}
          >
            <View style={[styles.statusBadge, { marginTop: 0, backgroundColor: `${theme.colors.primary}20` }]}>
              <MaterialCommunityIcons name="leaf" size={16} color={theme.colors.primary} />
              <Text style={[styles.statusText, { color: theme.colors.primary }]}>{statusLabel}</Text>
            </View>

            <View style={[styles.statusBadge, { marginTop: 0, backgroundColor: `${theme.colors.primary}12` }]}>
              <MaterialCommunityIcons name="water-outline" size={16} color={theme.colors.primary} />
            </View>

            <View style={[styles.statusBadge, { marginTop: 0, backgroundColor: `${theme.colors.tertiary}20` }]}>
              <MaterialCommunityIcons name="fire" size={16} color={theme.colors.tertiary} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
