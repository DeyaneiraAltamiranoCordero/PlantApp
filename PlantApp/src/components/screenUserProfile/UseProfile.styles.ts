import { AppTheme, getAppTheme, useTheme } from "../../theme/desingSystem";
import { StyleSheet } from "react-native";

export const createUserStyle = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
    });

const stylesByMode = {
    light: createUserStyle(getAppTheme("light")),
    dark: createUserStyle(getAppTheme("dark")),
};

//funcion para detectar el tema oscuro o claro y retorna el estilo.
export function useProfileTheme(){
    const { isDark } = useTheme();
    const theme = isDark ? getAppTheme("dark") : getAppTheme("light");
    return { theme, styles: stylesByMode[theme.mode] };
} 