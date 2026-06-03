import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Linking, PanResponder, Pressable, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

import { useTheme } from '../theme/desingSystem';
import HomeScreen from '../screens/home/Home';
import PlantCareScreen from '../screens/plantCare/PlantCare';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import ChatScreen from '../screens/chat/Chat';
import ProfileScreen from '../screens/userProfile/UserProfile';

const Tab = createBottomTabNavigator();
const SWIPE_TABS = ['Home', 'PlantCare', 'Chat', 'Profile'] as const;

function SwipeableScreen({
  tabName,
  children,
}: {
  tabName: typeof SWIPE_TABS[number];
  children: React.ReactNode;
}) {
  const navigation = useNavigation<any>();

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontalSwipe = Math.abs(gestureState.dx) > 20;
          const isMostlyHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          return isHorizontalSwipe && isMostlyHorizontal;
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentIndex = SWIPE_TABS.indexOf(tabName);
          const swipeLeft = gestureState.dx < -50;
          const swipeRight = gestureState.dx > 50;

          if (swipeLeft && currentIndex < SWIPE_TABS.length - 1) {
            navigation.navigate(SWIPE_TABS[currentIndex + 1]);
          }

          if (swipeRight && currentIndex > 0) {
            navigation.navigate(SWIPE_TABS[currentIndex - 1]);
          }
        },
      }),
    [navigation, tabName],
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

function HomeTab() {
  return (
    <SwipeableScreen tabName="Home">
      <HomeScreen />
    </SwipeableScreen>
  );
}

function PlantCareTab() {
  return (
    <SwipeableScreen tabName="PlantCare">
      <PlantCareScreen />
    </SwipeableScreen>
  );
}

function ChatTab() {
  return (
    <SwipeableScreen tabName="Chat">
      <ChatScreen />
    </SwipeableScreen>
  );
}

function ProfileTab() {
  return (
    <SwipeableScreen tabName="Profile">
      <ProfileScreen />
    </SwipeableScreen>
  );
}

function CameraTabButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();

  const handlePress = async () => {
    if (!cameraPermission || !libraryPermission) {
      return;
    }

    if (cameraPermission.granted) {
      navigation.navigate('Scanner');
      return;
    }

    const cameraResult = await requestCameraPermission();

    if (cameraResult.granted) {
      if (!libraryPermission.granted) {
        await requestLibraryPermission();
      }
      navigation.navigate('Scanner');
      return;
    }

    if (!cameraResult.canAskAgain) {
      Alert.alert(
        'Permiso requerido',
        'La cámara es esencial para escanear. Por favor, actívala en ajustes.',
        [
          { text: 'Cancelar' },
          { text: 'Ajustes', onPress: () => Linking.openSettings() },
        ],
      );
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
      <View
        style={{
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
        }}
      >
        <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.tertiary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
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
        tabBarLabelStyle: {
          fontSize: theme.typography.size.sm,
          fontFamily: theme.typography.fontFamily.semibold,
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PlantCare"
        component={PlantCareTab}
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
        name="Chat"
        component={ChatTab}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
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
