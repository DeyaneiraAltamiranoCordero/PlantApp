//_layout.tsx
import React from "react";
import { Stack, Redirect } from "expo-router";

import { ThemeProvider, useTheme } from "../src/theme/ThemeContext";
import { Slot } from "expo-router";

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
    >
      {}
      <Slot />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* always redirect root to tabs/home */}
      <Redirect href="/(tabs)/home" />
      <RootStack />
    </ThemeProvider>
  );
}
