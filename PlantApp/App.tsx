import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ToastProvider } from './src/context/ToastContext';
import TabNavigator from "./src/navegation/barNavegation";
import LoginScreen from './src/screens/login/Login';
import UserProfileScreen from './src/screens/userProfile/UserProfile';
import { ThemeProvider, useTheme } from "./src/theme/desingSystem";
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';

const Stack = createNativeStackNavigator();

function Navigation() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || { colors: { background: '#ffffff', primary: '#2D5A27' } };
  const { loading: authLoading, currentUser } = useAuth();

  const [fontsLoaded] = useFonts({
    'Nunito': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
  });

  const loading = authLoading || !fontsLoaded;

  React.useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2D5A27" />
        <Text style={{ marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer>
        <Stack.Navigator
          key={currentUser ? 'auth' : 'guest'}
          screenOptions={{ headerShown: false }}
          initialRouteName={currentUser ? "Main" : "Login"}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
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
            <Navigation />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}