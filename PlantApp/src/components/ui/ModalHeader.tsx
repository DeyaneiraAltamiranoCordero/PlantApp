import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  rightIcon?: FeatherIconName;
  onRightAction?: () => void;
  rightActionA11yLabel?: string;
  rightDisabled?: boolean;
};

export function ModalHeader({
  title,
  subtitle,
  rightIcon = 'plus',
  onRightAction,
  rightActionA11yLabel,
  rightDisabled,
}: ModalHeaderProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {onRightAction ? (
        <TouchableOpacity
          onPress={onRightAction}
          disabled={Boolean(rightDisabled)}
          style={[styles.actionButton, Boolean(rightDisabled) && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={rightActionA11yLabel}
        >
          <Feather name={rightIcon} size={18} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.size.xl,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.bold,
    },
    subtitle: {
      color: theme.colors.mutedForeground,
      marginTop: theme.spacing.xs,
      fontFamily: theme.typography.fontFamily.default,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
    },
  });
}
