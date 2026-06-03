import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { PlantProvider } from './src/context/PlantContext';
import { WateringNotificationsProvider } from './src/context/WateringNotificationsProvider';
import { ToastProvider } from './src/context/ToastContext';
import TabNavigator from "./src/navegation/barNavegation";
import LoginScreen from './src/screens/login/Login';
import ForgotPasswordScreen from './src/screens/login/ForgotPassword';
import UserProfileScreen from './src/screens/userProfile/UserProfile';
import ScanResultScreen from './src/screens/scanner/ScanResultScreen';
import { ThemeProvider, useTheme } from "./src/theme/desingSystem";

const Stack = createNativeStackNavigator();

function Navigation() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || { colors: { background: '#ffffff', primary: '#2D5A27' } };
  const { loading: authLoading, currentUser } = useAuth();
  const loading = authLoading;
  
  console.log('[App] State:', { authLoading, loading });

  React.useEffect(() => {
    console.log('[App] useEffect - loading changed:', loading);
    if (!loading) {
      console.log('[App] Hiding SplashScreen');
      SplashScreen.hideAsync().catch((err) => console.error('[App] SplashScreen error:', err));
    }
  }, [loading]);

  if (loading) {
    console.log('[App] Rendering Loading Screen');
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2D5A27" />
          <Text style={{ marginTop: 10 }}>Cargando... (Auth: {String(authLoading)})</Text>
      </View>
    );
  }

  console.log('[App] Rendering Navigation Container');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer>
        <Stack.Navigator
          key={currentUser ? 'auth' : 'guest'}
          screenOptions={{ headerShown: false }}
          initialRouteName={currentUser ? "Main" : "Login"}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PlantProvider>
              <WateringNotificationsProvider>
                <Navigation />
              </WateringNotificationsProvider>
            </PlantProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}