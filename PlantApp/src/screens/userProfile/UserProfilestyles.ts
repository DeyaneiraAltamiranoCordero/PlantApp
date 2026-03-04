import { StyleSheet, Platform } from "react-native";
import { ThemeColors } from "../../theme/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    // --- Screen Container Styles ---
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.xl,
        paddingTop: spacing.huge,
        paddingBottom: spacing.huge,
    },

    // --- Profile Header Styles ---
    headerContainer: {
        alignItems: 'center',
        gap: spacing.md,
        paddingBottom: spacing.sm,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: spacing.avatar.size,
        height: spacing.avatar.size,
        borderRadius: spacing.avatar.radius,
        borderWidth: spacing.avatar.border,
        borderColor: colors.secondary,
    },
    avatarFallback: {
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallbackText: {
        color: colors.secondaryForeground,
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
    },
    cameraButton: {
        position: 'absolute',
        bottom: spacing.cameraIcon.offset,
        right: spacing.cameraIcon.offset,
        width: spacing.cameraIcon.size,
        height: spacing.cameraIcon.size,
        borderRadius: spacing.cameraIcon.radius,
        backgroundColor: colors.isDark ? colors.secondaryForeground : colors.primary,
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
        marginTop: spacing.sm,
    },
    name: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: colors.foreground,
    },
    nickname: {
        fontSize: typography.size.base,
        color: colors.mutedForeground,
    },

    // --- Personal Info Form Styles ---
    formCard: {
        backgroundColor: colors.card,
        borderRadius: spacing.lg,
        padding: spacing.xl,
        gap: spacing.xl,
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
        borderColor: colors.border,
        borderWidth: 1,
        marginTop: spacing.xl,
    },
    formTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    fieldContainer: {
        gap: spacing.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    label: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.semibold,
        color: colors.foreground,
    },
    input: {
        backgroundColor: colors.muted,
        borderRadius: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        color: colors.foreground,
        fontSize: typography.size.base,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    textArea: {
        minHeight: 100,
    },

    // --- My Plants Form Styles ---
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    subtitleLabel: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: colors.mutedForeground,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primary + '20', // Opacidad añadida en HEX
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
    },
    tagText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: colors.primary,
    },
    emptyText: {
        fontSize: typography.size.base,
        color: colors.mutedForeground,
    },

    // --- Settings Panel Styles ---
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.muted + '60', // Opacidad añadida en HEX
        borderRadius: spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    settingIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
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
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.foreground,
    },
    settingStatus: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: colors.mutedForeground,
    },

    // --- Stats Bar Styles ---
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: colors.card,
        borderRadius: spacing.lg,
        padding: spacing.lg,
        marginTop: spacing.md,
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
        borderColor: colors.border,
        borderWidth: 1,
    },
    statItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statsIcon: {
        color: colors.isDark ? colors.secondaryForeground : colors.primary
    },
    unifiedIcon: {
        color: colors.isDark ? colors.secondaryForeground : colors.primary
    },
    heartIcon: {
        color: colors.destructive
    },
    statValue: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: colors.foreground,
    },
    statLabel: {
        fontSize: typography.size.sm,
        color: colors.mutedForeground,
        fontWeight: typography.weight.semibold,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.border,
    },

    // --- Actions Styles ---
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: spacing.lg,
        marginTop: spacing.xl,
        marginBottom: spacing.xxl, // Extra space at the bottom for scrolling
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    saveButtonText: {
        color: colors.primaryForeground,
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
    },
});