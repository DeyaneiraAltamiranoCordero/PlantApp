import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export type CatalogSummaryCardProps = {
  title: string;
  description: string;
  onView?: () => void;
  viewDisabled?: boolean;
  viewA11yLabel?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  addA11yLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function CatalogSummaryCard({
  title,
  description,
  onView,
  viewDisabled,
  viewA11yLabel,
  onAdd,
  addDisabled,
  addA11yLabel,
  style,
}: CatalogSummaryCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const isViewDisabled = Boolean(viewDisabled) || !onView;
  const isAddDisabled = Boolean(addDisabled) || !onAdd;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <TouchableOpacity
          onPress={!isViewDisabled ? onView : undefined}
          disabled={isViewDisabled}
          activeOpacity={0.85}
          style={[styles.actionButton, isViewDisabled && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={viewA11yLabel}
        >
          <Text style={styles.actionText}>Ver lista</Text>
          <Feather name="chevron-right" size={18} color={theme.colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={!isAddDisabled ? onAdd : undefined}
          disabled={isAddDisabled}
          style={[styles.iconButton, isAddDisabled && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={addA11yLabel}
        >
          <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.size.base,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    description: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
