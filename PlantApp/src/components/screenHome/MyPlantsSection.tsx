import React from 'react';
import { View, Text } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useProfileTheme } from '../../screens/userProfile/UserProfile.styles';

interface MyPlantsSectionProps {
    favoritePlants: string[];
    plantCategories: string[];
}

export function MyPlantsSection({
    favoritePlants,
    plantCategories,
}: MyPlantsSectionProps) {
    const { styles, theme } = useProfileTheme();

    return (
        <View style={styles.formCard}>
            <View style={styles.cardHeader}>
                <FontAwesome5 name="seedling" size={20} color={styles.unifiedIcon.color} />
                <Text style={styles.formTitle}>Mis Plantas</Text>
            </View>

            <View style={{ gap: theme.spacing.md }}>
                <View style={styles.labelContainer}>
                    <Feather name="heart" size={16} color={styles.heartIcon.color} />
                    <Text style={styles.subtitleLabel}>PLANTAS FAVORITAS</Text>
                </View>

                {favoritePlants.length > 0 ? (
                    <View style={styles.tagsContainer}>
                        {favoritePlants.map((plantName) => (
                            <View key={plantName} style={styles.tagBadge}>
                                <Feather name="heart" size={12} color={styles.heartIcon.color} />
                                <Text style={styles.tagText}>{plantName}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>
                        No tienes plantas favoritas aún.
                    </Text>
                )}
            </View>

            <View style={{ gap: theme.spacing.md }}>
                <View style={styles.labelContainer}>
                    <Feather name="list" size={16} color={styles.unifiedIcon.color} />
                    <Text style={styles.subtitleLabel}>CATEGORÍAS</Text>
                </View>

                {plantCategories.length > 0 ? (
                    <View style={styles.tagsContainer}>
                        {plantCategories.map((cat) => (
                            <View key={cat} style={styles.tagBadge}>
                                <Feather name="feather" size={12} color={styles.unifiedIcon.color} />
                                <Text style={styles.tagText}>{cat}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>
                        No has seleccionado categorías aún.
                    </Text>
                )}
            </View>
        </View>
    );
}