//_layout.tsx
import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from "../src/theme/desingSystem";
import AppLayout from "./(app)/_layout";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppLayout />
      </NavigationContainer>
    </ThemeProvider>
  );
}