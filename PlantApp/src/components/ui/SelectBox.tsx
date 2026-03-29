import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export type SelectBoxProps = {
  text: string;
  isOpen?: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SelectBox({
  text,
  isOpen,
  onPress,
  disabled,
  accessibilityLabel,
  leading,
  style,
}: SelectBoxProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={Boolean(disabled)}
      activeOpacity={0.85}
      style={[styles.container, style, Boolean(disabled) && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.left}>
        {leading}
        <Text style={styles.text} numberOfLines={1}>
          {text}
        </Text>
      </View>
      <Feather
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={theme.colors.mutedForeground}
      />
    </TouchableOpacity>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    text: {
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
      flexShrink: 1,
    },
  });
}
