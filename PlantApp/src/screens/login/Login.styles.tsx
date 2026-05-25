import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

export const useLoginTheme = () => {
  const { theme, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
      overflow: 'hidden',
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.xxl,
    },
    heroCard: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      borderRadius: theme.radius.xxl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.xs,
      position: 'relative',
      gap: theme.spacing.xs,
    },
    heroLeafTop: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 88,
      height: 88,
      opacity: isDark ? 0.22 : 0.38,
      transform: [{ rotate: '18deg' }],
    },
    heroLeafBottom: {
      position: 'absolute',
      bottom: 14,
      left: 10,
      width: 64,
      height: 64,
      opacity: isDark ? 0.18 : 0.3,
      transform: [{ rotate: '-22deg' }],
    },
    heroLeaves: {
      width: 155,
      height: 122,
      marginBottom: 0,
      transform: [{ rotate: '0deg' }],
    },
    title: {
      fontSize: theme.typography.size.xxl * 1.35,
      fontWeight: theme.typography.weight.bold as 'bold',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 0,
      color: theme.colors.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    formHeaderCard: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    formCard: {
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xxl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    formTitle: {
      fontSize: theme.typography.size.xl,
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: theme.typography.weight.bold as 'bold',
      color: theme.colors.foreground,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    formNote: {
      color: theme.colors.mutedForeground,
      fontSize: theme.typography.size.sm,
      fontFamily: theme.typography.fontFamily.default,
      textAlign: 'center',
      lineHeight: 20,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.muted,
    },
    rememberLabel: {
      color: theme.colors.foreground,
      fontSize: theme.typography.size.base,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    resetLink: {
      alignSelf: 'flex-start',
    },
    resetLinkText: {
      color: theme.colors.primary,
      fontSize: theme.typography.size.sm,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    buttonContainer: {
      width: '100%',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xs,
    },
    createAccountLink: {
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    createAccountText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.typography.size.sm,
      fontFamily: theme.typography.fontFamily.default,
      textAlign: 'center',
    },
    createAccountTextStrong: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    loadingWrapper: {
      alignItems: 'center',
      marginVertical: theme.spacing.sm,
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
