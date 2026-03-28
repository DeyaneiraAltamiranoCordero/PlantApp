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
      padding: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.size.xxl * 1.5,
      fontWeight: theme.typography.weight.bold as 'bold',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: theme.spacing.huge,
      color: theme.colors.foreground,
      letterSpacing: 0.5,
    },
    buttonContainer: {
      width: '100%',
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
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
