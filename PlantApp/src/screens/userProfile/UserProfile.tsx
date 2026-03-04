import React, { useState } from "react";
import { ScrollView, TouchableOpacity, Text, Alert } from "react-native";
import { Feather } from '@expo/vector-icons';
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { MyPlantsSection } from "../../components/screenUserProfile/MyPlantsSection";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { getStyles } from "./UserProfilestyles";
import { lightTheme, darkTheme } from "../../theme/colors";


//TODO ESTO ES SOLO PARA VER INFORMACION PERO SE TIENE QUE CAMBIAR
export default function UserProfile() {
    // Estados para los datos del usuario
    const [name, setName] = useState("Deya Cordero");
    const [nickname, setNickname] = useState("cactus");
    const [profileImage, setProfileImage] = useState("");
    const [birthday, setBirthday] = useState("1998-05-12");
    const [description, setDescription] = useState("Amante de las suculentas y coleccionista de plantas flotantes.");

    // Datos de las estadisticas de plantas, amigos y racha
    const [plantsCount, setPlantsCount] = useState(12);
    const [streakCount, setStreakCount] = useState(30);
    const [friendsCount, setFriendsCount] = useState(24);

    // Estados de Mis Plantas
    const [favoritePlant, setFavoritePlant] = useState("Filodendro corazón");
    // Array simulado de categorias seleccionadas
    const [plantCategories, setPlantCategories] = useState(["Suculentas", "Interior", "Aromáticas"]);

    //si el perfil es privado o no y lo mismo con el modo oscuro y claro
    const [isPrivate, setIsPrivate] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Deducir el tema activo en base al estado de isDark
    const theme = isDark ? darkTheme : lightTheme;
    const styles = getStyles(theme);

    const handleImageChange = () => {
        // lógica para abrir la cámara o galería
        console.log("Cambiar imagen presionado");
    };

    const handleSaveChanges = () => {
        Alert.alert("¡Éxito!", "Tus cambios han sido guardados correctamente.");
        console.log("Guardando cambios...");
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <ProfileHeader
                name={name}
                nickname={nickname}
                imageUrl={profileImage}
                onImageChange={handleImageChange}
                theme={theme}
            />

            <StatsBar
                plants={plantsCount}
                streak={streakCount}
                friends={friendsCount}
                theme={theme}
            />

            <PersonalInfoForm
                name={name}
                nickname={nickname}
                birthday={birthday}
                description={description}
                onNameChange={setName}
                onNicknameChange={setNickname}
                onBirthdayChange={setBirthday}
                onDescriptionChange={setDescription}
                theme={theme}
            />

            <MyPlantsSection
                favoritePlant={favoritePlant}
                plantCategories={plantCategories}
                onFavoritePlantChange={setFavoritePlant}
                theme={theme}
            />

            <SettingsPanel
                isPrivate={isPrivate}
                onPrivacyChange={setIsPrivate}
                isDark={isDark}
                onThemeChange={setIsDark}
                theme={theme}
            />

            {/* Save Button */}
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
                activeOpacity={0.8}
            >
                <Feather name="check-circle" size={18} color={theme.primaryForeground} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}