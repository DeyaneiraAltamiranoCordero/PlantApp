//_layout.tsx
import React from "react";
import { Stack } from "expo-router";

// theme context handles color scheme and toggle state
import { ThemeProvider, useTheme } from "../src/theme/ThemeContext";

function RootStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        title: "Flora",
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
