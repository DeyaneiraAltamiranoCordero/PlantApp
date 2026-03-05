//_layout.tsx
import React from "react";
import { Stack, Redirect } from "expo-router";

import { ThemeProvider, useTheme } from "../src/theme/desingSystem";
import { Slot } from "expo-router";

function RootStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        title: "Flora",
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.foreground,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Slot />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* root stack handles rendering; redirect is managed by index.tsx */}
      <RootStack />
    </ThemeProvider>
  );
}
