import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ToastProvider } from './src/context/ToastContext';
import TabNavigator from "./src/navegation/barNavegation";
import LoginScreen from './src/screens/login/Login';
import UserProfileScreen from './src/screens/userProfile/UserProfile';
import { ThemeProvider, useTheme } from "./src/theme/desingSystem";

const Stack = createNativeStackNavigator();

function Navigation() {
  const { theme } = useTheme() || { theme: { colors: { background: '#ffffff', primary: '#000000' } } };
  const { loading, currentUser } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
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
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
              <Navigation />
            </View>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}