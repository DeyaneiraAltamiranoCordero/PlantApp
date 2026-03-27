import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/desingSystem';
import HomeScreen from '../screens/home/Home';
import ProfileScreen from '../screens/userProfile/UserProfile';
import PlantCareScreen from '../screens/plantCare/PlantCare';
import FriendsScreen from '../screens/friends/Friends';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
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
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="PlantCare"
                component={PlantCareScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="sprout" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{
                            top: -15,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: theme.colors.primary,
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            elevation: 5,
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        }}>
                            <MaterialCommunityIcons name="line-scan" size={32} color="#FFFFFF" />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Friends"
                component={FriendsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-group" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}