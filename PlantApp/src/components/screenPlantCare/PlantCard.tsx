import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Plant } from '../../context/services/api';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
}

export function PlantCard({ plant, onPress }: PlantCardProps) {
  const { theme, styles } = usePlantCareStyles();

  const badgeColor = plant.source === 'detection'
    ? theme.colors.secondary
    : theme.colors.accent;
  const badgeLabel = plant.source === 'detection' ? 'Detección' : 'Manual';

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
            {plant.isFavorite && (
              <MaterialCommunityIcons
                name="heart"
                size={18}
                color={theme.colors.destructive}
                style={styles.favoriteIcon}
              />
            )}
          </View>
          <Text style={styles.plantCategory} numberOfLines={1}>
            {plant.categoryName || plant.categoryId || 'Sin categoría'}
          </Text>
          {plant.status && (
            <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.primary}20` }]}> 
              <MaterialCommunityIcons name="leaf" size={16} color={theme.colors.primary} />
              <Text style={[styles.statusText, { color: theme.colors.primary }]}>{plant.status}</Text>
            </View>
          )}
        </View>
      </View>

      {plant.source && (
        <View style={[styles.statusBadge, { backgroundColor: badgeColor, position: 'absolute', top: 12, right: 12 }]}
        >
          <Text style={[styles.statusText, { color: theme.colors.card }]}>{badgeLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
