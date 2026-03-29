import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export type ToastKind = 'success' | 'warning' | 'error';

export type ToastTabProps = {
  kind: ToastKind;
  title?: string;
  message: string;
  onClose: () => void;
};

export function ToastTab({ kind, title, message, onClose }: ToastTabProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const accentColor =
    kind === 'success'
      ? theme.colors.primary
      : kind === 'warning'
        ? theme.colors.warning
        : theme.colors.destructive;

  return (
    <View style={styles.container} pointerEvents="auto">
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar notificación"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.closeButton}
          >
            <Feather name="x" size={16} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text style={styles.message} numberOfLines={4}>
          {message}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      maxWidth: 340,
      minWidth: 260,
    },
    accent: {
      width: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    title: {
      flex: 1,
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    message: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
    },
  });
}
