import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { Button } from "../../components/ui/Button";
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { MyPlantsSection } from "../../components/screenUserProfile/MyPlantsSection";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { useTheme } from "../../theme/desingSystem";
import { useProfileTheme } from "./UserProfilestyles";


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

    //si el perfil es privado o no (se mantiene local) y el modo oscuro lo sacamos de context
    const [isPrivate, setIsPrivate] = useState(false);

    // obtener tema global y método para alternarlo
    const { theme: profileTheme, styles } = useProfileTheme();
    const { isDark, toggleTheme } = useTheme();

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
                onNameChange={setName}
                onNicknameChange={setNickname}
                onBirthdayChange={setBirthday}
                onDescriptionChange={setDescription}
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
            />
        </ScrollView>
    );
}