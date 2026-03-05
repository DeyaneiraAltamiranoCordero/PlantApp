import { AppTheme, getAppTheme, useTheme } from "../../theme/desingSystem";
import { StyleSheet, Platform } from "react-native";

export const createUserStyle = (theme: AppTheme) =>
    StyleSheet.create({
        // Contenedor principal
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            padding: theme.spacing.xl,
            paddingTop: theme.spacing.huge,
            paddingBottom: theme.spacing.huge,
        },

        // Encabezado del perfil
        headerContainer: {
            alignItems: 'center',
            gap: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
        },
        avatarContainer: {
            position: 'relative',
        },
        avatar: {
            width: theme.spacing.avatar.size,
            height: theme.spacing.avatar.size,
            borderRadius: theme.spacing.avatar.radius,
            borderWidth: theme.spacing.avatar.border,
            borderColor: theme.colors.secondary,
        },
        avatarFallback: {
            backgroundColor: theme.colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarFallbackText: {
            color: theme.colors.secondaryForeground,
            fontSize: theme.typography.size.xxl,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
        },
        cameraButton: {
            position: 'absolute',
            bottom: theme.spacing.cameraIcon.offset,
            right: theme.spacing.cameraIcon.offset,
            width: theme.spacing.cameraIcon.size,
            height: theme.spacing.cameraIcon.size,
            borderRadius: theme.spacing.cameraIcon.radius,
            backgroundColor: theme.colors.isDark ? theme.colors.secondaryForeground : theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                },
                android: {
                    elevation: 5,
                },
            }),
        },
        headerTextContainer: {
            alignItems: 'center',
            marginTop: theme.spacing.sm,
        },
        name: {
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            color: theme.colors.foreground,
        },
        nickname: {
            fontSize: theme.typography.size.base,
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.fontFamily.default,
        },

        // Formulario de información personal
        formCard: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.spacing.lg,
            padding: theme.spacing.xl,
            gap: theme.spacing.xl,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                },
                android: {
                    elevation: 2,
                },
            }),
            borderColor: theme.colors.border,
            borderWidth: 1,
            marginTop: theme.spacing.xl,
        },
        formTitle: {
            fontSize: theme.typography.size.lg,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            color: theme.colors.foreground,
            marginBottom: theme.spacing.sm,
        },
        fieldContainer: {
            gap: theme.spacing.sm,
        },
        labelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
        },
        label: {
            fontSize: theme.typography.size.base,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.fontFamily.semibold,
            color: theme.colors.foreground,
        },
        input: {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            color: theme.colors.foreground,
            fontSize: theme.typography.size.base,
            fontFamily: theme.typography.fontFamily.default,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        textArea: {
            minHeight: 100,
        },

        // Sección de mis plantas
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
        },
        subtitleLabel: {
            fontSize: 10,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: theme.colors.mutedForeground,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
        },
        tagBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            backgroundColor: theme.colors.primary + '20', // Opacidad añadida en HEX
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            borderRadius: 16,
        },
        tagText: {
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.fontFamily.semibold,
            color: theme.colors.primary,
        },
        emptyText: {
            fontSize: theme.typography.size.base,
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.fontFamily.default,
        },

        // Configuración y privacidad
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.muted + '60', //El +60 es de la opacidad
            borderRadius: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
        },
        settingInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.lg,
        },
        settingIconWrapper: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: theme.colors.border,
            borderWidth: 1,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 1,
                },
                android: {
                    elevation: 1,
                },
            }),
        },
        settingTitle: {
            fontSize: theme.typography.size.base,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            color: theme.colors.foreground,
        },
        settingStatus: {
            fontSize: 10,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: theme.colors.mutedForeground,
        },

        statsCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: theme.colors.card,
            borderRadius: theme.spacing.lg,
            padding: theme.spacing.lg,
            marginTop: theme.spacing.md,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                },
                android: {
                    elevation: 2,
                },
            }),
            borderColor: theme.colors.border,
            borderWidth: 1,
        },
        statItem: {
            alignItems: 'center',
            gap: theme.spacing.xs,
        },
        statValueContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
        },
        statsIcon: {
            color: theme.colors.isDark ? theme.colors.secondaryForeground : theme.colors.primary
        },
        unifiedIcon: {
            color: theme.colors.isDark ? theme.colors.secondaryForeground : theme.colors.primary
        },
        heartIcon: {
            color: theme.colors.destructive
        },
        statValue: {
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            color: theme.colors.foreground,
        },
        statLabel: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.mutedForeground,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.fontFamily.semibold,
        },
        statDivider: {
            width: 1,
            height: 30,
            backgroundColor: theme.colors.border,
        },

        // acciones
    
    });

//función para crear los estilos de cada modo (claro/oscuro)
const stylesByMode = {
    light: createUserStyle(getAppTheme("light")),
    dark: createUserStyle(getAppTheme("dark")),
};

// Hook personalizado para usar el tema y los estilos en el componente
export function useProfileTheme() {
    const { isDark } = useTheme();
    const theme = isDark ? getAppTheme("dark") : getAppTheme("light");
    return { theme, styles: stylesByMode[theme.mode] };
}