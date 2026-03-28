import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { MyPlantsSection } from "../../components/screenUserProfile/MyPlantsSection";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { Button } from "../../components/ui/Button";
import { db } from '../../config/firebase';
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../theme/desingSystem";
import { useProfileTheme } from "./UserProfile.styles";

export default function UserProfile() {
    const { currentUser, signOut } = useAuth();
    const navigation = useNavigation();

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

        const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (documentSnapshot) => {
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

        return () => unsubscribe();
    }, [currentUser]);

    const handleImageChange = () => {
        // lógica para abrir la cámara o galería
        console.log("Cambiar imagen presionado");
    };

    const handleSaveChanges = () => {
        Alert.alert("¡Éxito!", "Tus cambios han sido guardados correctamente.");
        console.log("Guardando cambios...");
    };

    const handleSignOut = async () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que deseas cerrar sesión?",
            [
                {
                    text: "Cancelar",
                    onPress: () => console.log("Cancelado"),
                    style: "cancel"
                },
                {
                    text: "Cerrar sesión",
                    onPress: async () => {
                        try {
                            await signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error("Error al cerrar sesión:", error);
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

            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 40 }}>
                <Button
                    title="Guardar Cambios"
                    onPress={handleSaveChanges}
                    icon="check-circle"
                    variant="primary"
                    size="md"
                    style={{ flex: 1 }}
                />
                <Button
                    title="Cerrar sesión"
                    onPress={handleSignOut}
                    icon="logout"
                    variant="secondary"
                    size="md"
                    style={{ flex: 1 }}
                />
            </View>
        </ScrollView>
    );
}