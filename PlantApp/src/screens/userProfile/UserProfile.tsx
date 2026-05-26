import { useNavigation } from '@react-navigation/native';
import React from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, View } from "react-native";
import { CameraScanner } from '../../components/camera/CameraScanner';
import { uploadUserPhoto } from '../../context/services/api';
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { MyPlantsSection } from "../../components/screenHome/MyPlantsSection";
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
        favoritePlants,
        plantCategories,
        isLoadingProfile,
        isSaving,
    } = useUserProfileController({ currentUser });

    const { styles, theme } = useProfileTheme();
    const { isDark, toggleTheme } = useTheme();

    const handleImageChange = () => {
        setShowCamera(true);
    };

    const [showCamera, setShowCamera] = React.useState(false);
    const [isUploadingImage, setIsUploadingImage] = React.useState(false);

    const handleProfileImage = async (photo: { uri?: string; base64?: string } | any) => {
        const base64 = photo?.base64;
        if (!base64) {
            Alert.alert('Error', 'No se recibió la imagen en formato base64.');
            return;
        }

        if (!currentUser) {
            Alert.alert('Error', 'Usuario no autenticado');
            return;
        }

        try {
            setIsUploadingImage(true);
            const url = await uploadUserPhoto(currentUser.uid, `profile_${currentUser.uid}.jpg`, base64);
            setProfileImage(url);
            setShowCamera(false);
            Alert.alert('Listo', 'Foto de perfil actualizada.');
        } catch (err) {
            console.error('Error subiendo la foto:', err);
            Alert.alert('Error', 'No se pudo subir la foto. Intentá de nuevo.');
        } finally {
            setIsUploadingImage(false);
        }
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
                    <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
                        <CameraScanner
                            mode="profile"
                            onPhotoTaken={handleProfileImage}
                            onGallerySelected={handleProfileImage}
                            onClose={() => setShowCamera(false)}
                        />
                    </Modal>

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
            <MyPlantsSection
                favoritePlants={favoritePlants}
                plantCategories={plantCategories}
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