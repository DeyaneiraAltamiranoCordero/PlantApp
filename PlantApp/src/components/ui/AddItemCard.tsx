import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export type AddItemCardProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function AddItemCard({ title, subtitle, onPress, disabled, accessibilityLabel }: AddItemCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={Boolean(disabled)}
      activeOpacity={0.85}
      style={[styles.container, Boolean(disabled) && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.size.lg,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.bold,
    },
    subtitle: {
      color: theme.colors.mutedForeground,
      marginTop: theme.spacing.xs,
      fontFamily: theme.typography.fontFamily.default,
    },
  });
}
