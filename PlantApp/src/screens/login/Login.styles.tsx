import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

export const useLoginTheme = () => {
  const { theme, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
      overflow: 'hidden',
    },
    heroCard: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      borderRadius: theme.radius.xxl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.xl,
      position: 'relative',
    },
    heroOrbTop: {
      position: 'absolute',
      top: -24,
      right: -18,
      width: 96,
      height: 96,
      borderRadius: 96,
      backgroundColor: theme.colors.accent,
      opacity: 0.8,
    },
    heroOrbBottom: {
      position: 'absolute',
      bottom: -18,
      left: -10,
      width: 72,
      height: 72,
      borderRadius: 72,
      backgroundColor: theme.colors.secondary,
      opacity: 0.35,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.colors.primary}18`,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    heroBadgeText: {
      color: theme.colors.primary,
      fontSize: theme.typography.size.sm,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    heroLeaves: {
      width: 220,
      height: 180,
      marginBottom: theme.spacing.lg,
      transform: [{ rotate: '-6deg' }],
    },
    title: {
      fontSize: theme.typography.size.xxl * 1.35,
      fontWeight: theme.typography.weight.bold as 'bold',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: theme.spacing.sm,
      color: theme.colors.foreground,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: theme.typography.size.base,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.lg,
      maxWidth: 300,
    },
    featureRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    featurePill: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    featurePillText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    buttonContainer: {
      width: '100%',
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    loadingWrapper: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    loadingText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.typography.size.base,
      fontFamily: theme.typography.fontFamily.default,
    },
  });

  return { styles, theme, isDark };
};
