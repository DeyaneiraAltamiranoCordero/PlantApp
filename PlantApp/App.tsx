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

type ErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Render error:', error, info.componentStack);
    SplashScreen.hideAsync().catch((err) => console.error('[AppErrorBoundary] SplashScreen error:', err));
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#D94F4F', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            La app no pudo renderizar
          </Text>
          <Text style={{ color: '#2D2A26', fontSize: 15, lineHeight: 22 }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function Navigation() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || { colors: { background: '#ffffff', primary: '#2D5A27' } };
  const { loading: authLoading, currentUser } = useAuth();
  const loading = authLoading;
  
  console.log('[App] State:', { authLoading, loading });

  React.useEffect(() => {
    console.log('[App] useEffect - loading changed:', loading);
    SplashScreen.hideAsync().catch((err) => console.error('[App] SplashScreen error:', err));
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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {currentUser ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="UserProfile" component={UserProfileScreen} />
              <Stack.Screen name="ScanResult" component={ScanResultScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch((err) => console.error('[App] SplashScreen error:', err));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppErrorBoundary>
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
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
