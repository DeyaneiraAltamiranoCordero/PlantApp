import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { PersonalInfoForm } from "../../components/screenUserProfile/PersonalInfoForm";
import { ProfileHeader } from "../../components/screenUserProfile/ProfileHeader";
import { SettingsPanel } from "../../components/screenUserProfile/SettingsPanel";
import { StatsBar } from "../../components/screenUserProfile/StatsBar";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { ApiError, getUserProfile, updateUserProfile } from "../../context/services/api";
import { useTheme } from "../../theme/desingSystem";
import { useProfileTheme } from "./UserProfile.styles";

export default function UserProfile() {
    const { currentUser, signOut } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [secondLastName, setSecondLastName] = useState("");
    const [nickname, setNickname] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [birthday, setBirthday] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [plantsCount, setPlantsCount] = useState(0);
    const [streakCount, setStreakCount] = useState(0);  
    const [friendsCount, setFriendsCount] = useState(0);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { styles, theme } = useProfileTheme();
    const { isDark, toggleTheme } = useTheme();

    const applyFallbackProfileFromCurrentUser = () => {
        if (!currentUser) return;

        const displayName = currentUser.displayName ?? "";
        const [firstName, ...restNames] = displayName.split(" ").filter(Boolean);
        const fallbackNickname = currentUser.email?.split("@")[0] || `plantLover_${currentUser.uid.substring(0, 4)}`;
        const derivedLastName = restNames[0] ?? "";
        const derivedSecondLastName = restNames.length > 1 ? restNames.slice(1).join(" ") : "";

        setName(firstName || fallbackNickname || "Usuario");
        setLastName(derivedLastName);
        setSecondLastName(derivedSecondLastName);
        setNickname(fallbackNickname);
        setProfileImage(currentUser.photoURL ?? "");
        setEmail(currentUser.email ?? "");
        setPlantsCount(0);
        setStreakCount(0);
        setDescription("");
        setBirthday("");
        setFriendsCount(0);
        setIsPrivate(false);
    };

    useEffect(() => {
        if (!currentUser) return;

        let isMounted = true;
        const loadProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const profile = await getUserProfile(currentUser.uid);
                if (!isMounted) return;

                const stats = profile.stats ?? { plantsCount: 0, favoritePlantsCount: 0, friendsCount: 0 };
                setName(profile.user.name || "");
                setLastName(profile.user.lastName || "");
                setSecondLastName(profile.user.secondLastName || "");
                setNickname(profile.user.nickname || profile.user.code || "");
                setProfileImage(profile.user.profilePicture || "");
                setEmail(profile.user.email || currentUser.email || "");

                const plantsLength = Array.isArray(profile.plants) ? profile.plants.length : undefined;
                setPlantsCount(plantsLength ?? stats.plantsCount ?? 0);
                setStreakCount(profile.user.streak ?? profile.user.streakDays ?? 0);
                setDescription(profile.user.description || "");
                setBirthday(profile.user.birthDate || "");

                const friendsLength = Array.isArray(profile.friends) ? profile.friends.length : undefined;
                setFriendsCount(friendsLength ?? stats.friendsCount ?? 0);
                setIsPrivate(profile.user.isPrivate ?? profile.user.publicProfile === false);
            } catch (error) {
                if (error instanceof ApiError && error.status === 404) {
                    if (!isMounted) return;
                    applyFallbackProfileFromCurrentUser();
                    return;
                }
                console.error("Error al cargar el perfil:", error);
                Alert.alert("Error", "No se pudo cargar tu perfil.");
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        };

        loadProfile();
        return () => {
            isMounted = false;
        };
    }, [currentUser]);

    const handleImageChange = () => {
        console.log("Cambiar imagen presionado");
    };

    const handleSaveChanges = async () => {
        if (!currentUser) return;
        try {
            setIsSaving(true);
            await updateUserProfile(currentUser.uid, {
                name,
                lastName,
                secondLastName,
                nickname,
                description,
                birthDate: birthday,
                profilePicture: profileImage,
                publicProfile: !isPrivate,
            });
            Alert.alert("¡Éxito!", "Tus cambios han sido guardados correctamente.");
        } catch (error) {
            console.error("Error al guardar:", error);
            Alert.alert("Error", "No se pudieron guardar los cambios.");
        } finally {
            setIsSaving(false);
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
                </>
            )}
            <PersonalInfoForm
                name={name}
                lastName={lastName}
                secondLastName={secondLastName}
                nickname={nickname}
                birthday={birthday}
                description={description}
                email={email}
                onNameChange={setName}
                onLastNameChange={setLastName}
                onSecondLastNameChange={setSecondLastName}
                onNicknameChange={setNickname}
                onBirthdayChange={setBirthday}
                onDescriptionChange={setDescription}
            />
            <SettingsPanel
                isPrivate={isPrivate}
                onPrivacyChange={setIsPrivate}
                isDark={isDark}
                onThemeChange={toggleTheme}
            />
            <View
                style={{
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    marginTop: theme.spacing.xl,
                    marginBottom: theme.spacing.xxl,
                }}
            >
                <Button
                    title="Guardar Cambios"
                    onPress={handleSaveChanges}
                    icon="check-circle"
                    variant="primary"
                    size="md"
                    style={{ flex: 1 }}
                    loading={isSaving}
                    disabled={isSaving || isLoadingProfile}
                />
                <Button
                    accessibilityLabel="Cerrar sesión"
                    onPress={handleSignOut}
                    icon="log-out"
                    variant="secondary"
                    size="md"
                />
            </View>
        </ScrollView>
    );
}