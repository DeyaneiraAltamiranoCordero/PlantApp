import { useNavigation } from '@react-navigation/native';
import React from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/desingSystem";
import { useProfileTheme } from "./UserProfile.styles";
import { useUserProfileController } from './useUserProfileController';
import { UserProfileActionsRow } from './UserProfileActionsRow';

export default function UserProfile() {
    const { currentUser, signOut } = useAuth();
    const navigation = useNavigation();

    const {
        control,
        handleSubmit,
        onSubmit,
        watchedName,
        watchedNickname,
        profileImage,
        setProfileImage,
        plantsCount,
        streakCount,
        friendsCount,
        isPrivate,
        setIsPrivate,
        isLoadingProfile,
        isSaving,
    } = useUserProfileController({ currentUser });

    const { styles, theme } = useProfileTheme();
    const { isDark, toggleTheme } = useTheme();

    const handleImageChange = () => {
        console.log("Cambiar imagen presionado");
    };

    const handleSignOut = async () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que deseas cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Cerrar sesión",
                    onPress: async () => {
                        try {
                            await signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' as never }],
                            });
                        } catch (error) {
                            Alert.alert("Error", "No se pudo cerrar sesión");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: styles.content.paddingBottom + 80 },
            ]}
        >
            {isLoadingProfile ? (
                <View style={{ paddingVertical: 40 }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <>
                    <ProfileHeader
                        name={watchedName || ''}
                        nickname={watchedNickname || ''}
                        imageUrl={profileImage}
                        onImageChange={handleImageChange}
                    />
                    <StatsBar
                        plants={plantsCount}
                        streak={streakCount}
                        friends={friendsCount}
                    />
                </>
            )}

            <PersonalInfoForm
                control={control}
            />
            <SettingsPanel
                isPrivate={isPrivate}
                onPrivacyChange={setIsPrivate}
                isDark={isDark}
                onThemeChange={toggleTheme}
            />

            <UserProfileActionsRow
                isSaving={isSaving}
                isLoadingProfile={isLoadingProfile}
                onSavePress={handleSubmit(onSubmit)}
                onSignOutPress={handleSignOut}
            />
        </ScrollView>
    );
}