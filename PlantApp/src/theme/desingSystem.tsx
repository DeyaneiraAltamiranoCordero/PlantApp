import { ColorSchemeName, useColorScheme } from "react-native";
import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "light" | "dark";

interface ThemeColors {
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
    tertiary: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    warning: string;
    warningForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
}

interface ThemeTypography {
    fontFamily: {
        default: string;
        semibold: string;
        bold: string;
    };
    size: {
        sm: number;
        base: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    weight: {
        normal: "normal";
        semibold: "600";
        bold: "bold";
    };
}

interface ThemeSpacing {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    huge: number;
    avatar: {
        size: number;
        radius: number;
        border: number;
    };
    cameraIcon: {
        size: number;
        radius: number;
        offset: number;
    };
}

interface ThemeRadius{
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    full: number;
}

export interface AppTheme {
    mode: ThemeMode;
    colors: ThemeColors;
    spacing: ThemeSpacing;
    radius: ThemeRadius;
    typography: ThemeTypography;
}

interface ThemeContextData {
    theme: AppTheme;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    // keep in sync with system unless user toggles manually
    useEffect(() => {
        setIsDark(systemScheme === 'dark');
    }, [systemScheme]);

    const toggleTheme = () => setIsDark(prev => !prev);

    const theme = isDark ? themes.dark : themes.light;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}


//Colores modo claro y oscuro
const lightColors: ThemeColors = {
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
    tertiary: '#e47190',
    muted: '#F0E8EB',
    mutedForeground: '#7A6E72',
    accent: '#E8F0E4',
    accentForeground: '#3D4A32',
    warning: '#F5B301',
    warningForeground: '#3A2A00',
    destructive: '#D94F4F',
    destructiveForeground: '#6f1717',
    border: '#E8DDE1',
    input: '#E8DDE1',
    ring: '#7D8968',
};

const darkColors: ThemeColors = {
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
    tertiary:'#F6C4D1',
    muted: '#2E3228',
    mutedForeground: '#A09A94',
    accent: '#3D2E34',
    accentForeground: '#F6C4D1',
    warning: '#F5B301',
    warningForeground: '#131908ff',
    destructive: '#8B2E2E',
    destructiveForeground: '#6f1717',
    border: '#3A3E34',
    input: '#3A3E34',
    ring: '#A3B18A',
};

//Tipografía
const typography: ThemeTypography = {
    fontFamily: {
        default: "Nunito",
        semibold: "Nunito",
        bold: "Nunito",
    },
    size: {
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
    },
    weight: {
        normal: "normal",
        semibold: "600",
        bold: "bold",
    },
};

//Espaciado
const sharedSpacing: ThemeSpacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    avatar: {
        size: 96,
        radius: 48,
        border: 4,
    },
    cameraIcon: {
        size: 32,
        radius: 16,
        offset: -4,
    },
};

//Radios
const sharedRadius: ThemeRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};


//Para acceder a los temas desde cualquier parte de la app
const themes: Record<ThemeMode, AppTheme> = {
    light: {
        mode: "light",
        colors: lightColors,
        spacing: sharedSpacing,
        radius: sharedRadius,
        typography: typography,
    },
    dark: { 
        mode: "dark",
        colors: darkColors,
        spacing: sharedSpacing,
        radius: sharedRadius,
        typography: typography,
    },
};

//
export function getAppTheme(mode: ColorSchemeName): AppTheme {
    if(mode === "dark") {
        return themes.dark;
    }
    return themes.light;
}   

export function useAppTheme(): AppTheme {
    const { theme } = useTheme();
    return theme;
}
