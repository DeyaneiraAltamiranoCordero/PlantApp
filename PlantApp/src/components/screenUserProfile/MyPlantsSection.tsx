import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getStyles } from '../../screens/userProfile/UserProfilestyles';

interface MyPlantsSectionProps {
    favoritePlant: string;
    plantCategories: string[];
    onFavoritePlantChange: (val: string) => void;
    theme: ThemeColors;
}

export function MyPlantsSection({
    favoritePlant,
    plantCategories,
    onFavoritePlantChange,
    theme
}: MyPlantsSectionProps) {
    const styles = getStyles(theme);

    return (
        <View style={styles.formCard}>
            <View style={styles.cardHeader}>
                <FontAwesome5 name="seedling" size={20} color={styles.unifiedIcon.color} />
                <Text style={styles.formTitle}>Mis Plantas</Text>
            </View>

            {/* Planta Favorita */}
            <View style={styles.fieldContainer}>
                <View style={styles.labelContainer}>
                    <Feather name="heart" size={16} color={styles.heartIcon.color} />
                    <Text style={styles.label}>Planta Favorita</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Monstera Deliciosa"
                    placeholderTextColor={theme.mutedForeground}
                    value={favoritePlant}
                    onChangeText={onFavoritePlantChange}
                />
            </View>

            {/* Categorias */}
            <View style={{ gap: 12 }}>
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