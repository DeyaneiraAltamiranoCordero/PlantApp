import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../theme/colors';
import { getStyles } from '../../screens/userProfile/UserProfilestyles';

interface StatsBarProps {
    plants: number;
    streak: number;
    friends: number;
    theme: ThemeColors;
}

export function StatsBar({ plants, streak, friends, theme }: StatsBarProps) {
    const styles = getStyles(theme);

    return (
        <View style={styles.statsCard}>
            {/* Plantas - Icono de hoja en estilo outline ('sin negrita') */}
            <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                    <Ionicons name="leaf-outline" size={18} color={styles.statsIcon.color} />
                    <Text style={styles.statValue}>{plants}</Text>
                </View>
                <Text style={styles.statLabel}>Plantas</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Racha - Icono de fuego en estilo outline */}
            <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                    <Ionicons name="flame-outline" size={18} color={styles.statsIcon.color} />
                    <Text style={styles.statValue}>{streak}</Text>
                </View>
                <Text style={styles.statLabel}>Racha</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Amigos - Icono de usuarios en estilo outline */}
            <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                    <Ionicons name="people-outline" size={18} color={styles.statsIcon.color} />
                    <Text style={styles.statValue}>{friends}</Text>
                </View>
                <Text style={styles.statLabel}>Amigos</Text>
            </View>
        </View>
    );
}