import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

export type InfoCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function InfoCard({ children, style }: InfoCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.container, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
    },
  });
}
