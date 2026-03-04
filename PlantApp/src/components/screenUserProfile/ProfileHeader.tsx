import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { Feather } from '@expo/vector-icons';
import { getStyles } from '../../screens/userProfile/UserProfilestyles';

interface ProfileHeaderProps {
    name: string;
    nickname: string;
    imageUrl: string;
    onImageChange: () => void;
    theme: ThemeColors;
}

export function ProfileHeader({ name, nickname, imageUrl, onImageChange, theme }: ProfileHeaderProps) {
    const styles = getStyles(theme);
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <View style={styles.headerContainer}>
            <View style={styles.avatarContainer}>
                {/* Lógica del Avatar */}
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>{initial}</Text>
                    </View>
                )}

                {/* Botón flotante para la cámara */}
                <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={onImageChange}
                    activeOpacity={0.8}
                >
                    <Feather name="camera" size={16} color={theme.primaryForeground} />
                </TouchableOpacity>
            </View>

            {/* Lógica de Nombres y Apodos */}
            <View style={styles.headerTextContainer}>
                <Text style={styles.name}>{name || "Tu Nombre"}</Text>
                <Text style={styles.nickname}>@{nickname || "apodo"}</Text>
            </View>
        </View>
    );
}
