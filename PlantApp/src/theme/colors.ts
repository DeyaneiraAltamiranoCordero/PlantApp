// src/theme/colors.ts

export interface ThemeColors {
    isDark: boolean;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
}

export const lightTheme: ThemeColors = {
    isDark: false,
    background: '#FDF5F7',
    foreground: '#2D2A26',
    card: '#FFFFFF',
    cardForeground: '#2D2A26',
    popover: '#FFFFFF',
    popoverForeground: '#2D2A26',
    primary: '#7D8968',
    primaryForeground: '#FFFFFF',
    secondary: '#F6C4D1',
    secondaryForeground: '#3D2E34',
    muted: '#F0E8EB',
    mutedForeground: '#7A6E72',
    accent: '#E8F0E4',
    accentForeground: '#3D4A32',
    destructive: '#D94F4F',
    destructiveForeground: '#e47190',
    border: '#E8DDE1',
    input: '#E8DDE1',
    ring: '#7D8968',
};

export const darkTheme: ThemeColors = {
    isDark: true,
    background: '#131908ff',
    foreground: '#F0EDE8',
    card: '#242820',
    cardForeground: '#F0EDE8',
    popover: '#242820',
    popoverForeground: '#F0EDE8',
    primary: '#A3B18A',
    primaryForeground: '#1A1D16',
    secondary: '#3D2E34',
    secondaryForeground: '#F6C4D1',
    muted: '#2E3228',
    mutedForeground: '#A09A94',
    accent: '#3D2E34',
    accentForeground: '#F6C4D1',
    destructive: '#8B2E2E',
    destructiveForeground: '#efa8bb',
    border: '#3A3E34',
    input: '#3A3E34',
    ring: '#A3B18A',
};

// Exportar el tema claro por defecto por si otros archivos lo importan de manera directa
export const colors = lightTheme;