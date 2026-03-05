import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProfileTheme } from '../../screens/userProfile/UserProfilestyles';

interface SettingsPanelProps {
    isPrivate: boolean;
    onPrivacyChange: (val: boolean) => void;
    isDark: boolean;
    /** callback invoked when the user toggles dark mode; parameter is ignored */
    onThemeChange: () => void;
}

export function SettingsPanel({ isPrivate, onPrivacyChange, isDark, onThemeChange }: SettingsPanelProps) {
    const { theme, styles } = useProfileTheme();

    return (
        <View style={styles.formCard}>
            <Text style={[styles.formTitle, { marginBottom: 0 }]}>Configuración</Text>

            {/* Modo Nocturno */}
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <View style={styles.settingIconWrapper}>
                        {isDark ? (
                            <Feather name="moon" size={20} color={theme.colors.secondaryForeground} />
                        ) : (
                            <Feather name="sun" size={20} color={theme.colors.mutedForeground} />
                        )}
                    </View>
                    <View>
                        <Text style={styles.settingTitle}>Modo Nocturno</Text>
                        <Text style={styles.settingStatus}>
                            {isDark ? 'ACTIVADO' : 'DESACTIVADO'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={isDark}
                    onValueChange={() => onThemeChange()}
                    trackColor={{ false: theme.colors.input, true: theme.colors.primary }}
                    thumbColor={theme.colors.card}
                    ios_backgroundColor={theme.colors.input}
                />
            </View>

            {/* Privacidad */}
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <View style={styles.settingIconWrapper}>
                        {isPrivate ? (
                            <Feather name="lock" size={20} color={styles.unifiedIcon.color} />
                        ) : (
                            <Feather name="globe" size={20} color={styles.unifiedIcon.color} />
                        )}
                    </View>
                    <View>
                        <Text style={styles.settingTitle}>Privacidad</Text>
                        <Text style={styles.settingStatus}>
                            {isPrivate ? 'PERFIL PRIVADO' : 'PERFIL PÚBLICO'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={isPrivate}
                    onValueChange={onPrivacyChange}
                    trackColor={{ false: theme.colors.input, true: theme.colors.primary }}
                    thumbColor={theme.colors.card}
                    ios_backgroundColor={theme.colors.input}
                />
            </View>
        </View>
    );
}
