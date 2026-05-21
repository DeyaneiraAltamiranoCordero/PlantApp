import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/desingSystem';
import HomeScreen from '../screens/home/Home';
import ProfileScreen from '../screens/userProfile/UserProfile';
import PlantCareScreen from '../screens/plantCare/PlantCare';
import FriendsScreen from '../screens/friends/Friends';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Pressable, Alert, Linking } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';

const CameraTabButton = () => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();

    const handlePress = async () => {
        console.log("Cámara pulsada, verificando permisos...");
        
        if (!cameraPermission || !libraryPermission) {
            return;
        }

        // Si ya tenemos cámara, navegamos directo
        if (cameraPermission.granted) {
            navigation.navigate('Scanner');
            return;
        }

        // Si no, pedimos cámara (y galería de paso)
        console.log("Solicitando permisos de cámara...");
        const cameraResult = await requestCameraPermission();
        
        if (cameraResult.granted) {
            // Aprovechamos para pedir galería si no la tiene
            if (!libraryPermission.granted) {
                await requestLibraryPermission();
            }
            navigation.navigate('Scanner');
        } else {
            if (!cameraResult.canAskAgain) {
                Alert.alert(
                    "Permiso requerido",
                    "La cámara es esencial para escanear. Por favor, actívala en ajustes.",
                    [
                        { text: "Cancelar" },
                        { text: "Ajustes", onPress: () => Linking.openSettings() }
                    ]
                );
            }
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Abrir cámara"
            style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <View style={{
                top: -8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.primary,
                width: 64,
                height: 64,
                borderRadius: 32,
                elevation: 5,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            }}>
                <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
            </View>
        </Pressable>
    );
};

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: theme.typography.size.sm,
                    fontFamily: theme.typography.fontFamily.semibold,
                    marginBottom: 2,
                },
                tabBarActiveTintColor: theme.colors.tertiary,
                tabBarInactiveTintColor: theme.colors.mutedForeground,
                tabBarStyle: route.name === 'Scanner'
                    ? { display: 'none' }
                    : {
                        backgroundColor: theme.colors.card,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderTopWidth: 0,
                        elevation: 8,
                        zIndex: 100,
                        height: 70,
                        paddingTop: 8,
                        paddingBottom: 8,
                    },
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="PlantCare"
                component={PlantCareScreen}
                options={{
                    tabBarLabel: 'Plantas',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="leaf" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{
                    tabBarLabel: '',
                    tabBarButton: () => <CameraTabButton />,
                }}
            />
            <Tab.Screen
                name="Friends"
                component={FriendsScreen}
                options={{
                    tabBarLabel: 'Amigos',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}