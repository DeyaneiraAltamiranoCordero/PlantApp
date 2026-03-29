import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

export type BooleanSwitchRowProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
};

export function BooleanSwitchRow({ value, onValueChange, trueLabel = 'Sí', falseLabel = 'No' }: BooleanSwitchRowProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
        thumbColor={theme.colors.card}
      />
      <Text style={styles.text}>{value ? trueLabel : falseLabel}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    text: {
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
    },
  });
}
