import React, { useEffect, useState } from "react";
import { ScrollView, Alert, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { MyPlantsSection } from "../../components/screenUserProfile/MyPlantsSection";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { useTheme } from "../../theme/desingSystem";
import { useProfileTheme } from "./UserProfile.styles";
import { useAuth } from "../../hooks/useAuth";
import firestore from '@react-native-firebase/firestore';

export default function UserProfile() {
    const { currentUser } = useAuth();

    // Estados para los datos del usuario (ahora vacíos inicialmente)
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [birthday, setBirthday] = useState("");
    const [description, setDescription] = useState("");
    const [bibliography, setBibliography] = useState("");

    // Datos de las estadisticas
    const [plantsCount, setPlantsCount] = useState(0);
    const [streakCount, setStreakCount] = useState(0);
    const [friendsCount, setFriendsCount] = useState(0);

    // Estados de Mis Plantas
    const [favoritePlant, setFavoritePlant] = useState("Filodendro corazón");
    const [plantCategories, setPlantCategories] = useState(["Suculentas", "Interior", "Aromáticas"]);

    const [isPrivate, setIsPrivate] = useState(false);

    const { theme: profileTheme, styles } = useProfileTheme();
    const { isDark, toggleTheme } = useTheme();

    // Efecto para sincronizar con Firestore
    useEffect(() => {
        if (!currentUser) return;

        const subscriber = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(documentSnapshot => {
                if (documentSnapshot.exists()) {
                    const data = documentSnapshot.data();
                    if (data) {
                        setName(data.name || "");
                        setNickname(data.nickname || "");
                        setProfileImage(data.profilePicture || "");
                        setPlantsCount(data.plantCount || 0);
                        setStreakCount(data.streak || 0);
                        setDescription(data.description || "");
                        setBibliography(data.bibliography || "");
                        if (data.birthDate) setBirthday(data.birthDate);
                    }
                }
            });

        return () => subscriber();
    }, [currentUser]);

    const handleImageChange = () => {
        // lógica para abrir la cámara o galería
        console.log("Cambiar imagen presionado");
    };

    const handleSaveChanges = () => {
        Alert.alert("¡Éxito!", "Tus cambios han sido guardados correctamente.");
        console.log("Guardando cambios...");
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: styles.content.paddingBottom + 80 },
            ]}
        >
            <ProfileHeader
                name={name}
                nickname={nickname}
                imageUrl={profileImage}
                onImageChange={handleImageChange}
            />

            <StatsBar
                plants={plantsCount}
                streak={streakCount}
                friends={friendsCount}
            />

            <PersonalInfoForm
                name={name}
                nickname={nickname}
                birthday={birthday}
                description={description}
                bibliography={bibliography}
                onNameChange={setName}
                onNicknameChange={setNickname}
                onBirthdayChange={setBirthday}
                onDescriptionChange={setDescription}
                onBibliographyChange={setBibliography}
            />

            <MyPlantsSection
                favoritePlant={favoritePlant}
                plantCategories={plantCategories}
                onFavoritePlantChange={setFavoritePlant}
            />

            <SettingsPanel
                isPrivate={isPrivate}
                onPrivacyChange={setIsPrivate}
                isDark={isDark}
                onThemeChange={toggleTheme}
            />

            <Button
                title="Guardar Cambios"
                onPress={handleSaveChanges}
                icon="check-circle"
                variant="primary"
                size="md"
                style={styles.saveButtonContainer}
            />
        </ScrollView>
    );
}