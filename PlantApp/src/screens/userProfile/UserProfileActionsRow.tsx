import React from 'react';
import { View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/desingSystem';

type Props = {
  isSaving: boolean;
  isLoadingProfile: boolean;
  onSavePress: () => void;
  onSignOutPress: () => void;
};

export function UserProfileActionsRow({
  isSaving,
  isLoadingProfile,
  onSavePress,
  onSignOutPress,
}: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xxl,
      }}
    >
      <Button
        title="Guardar Cambios"
        onPress={onSavePress}
        icon="check-circle"
        variant="primary"
        size="md"
        style={{ flex: 1 }}
        loading={isSaving}
        disabled={isSaving || isLoadingProfile}
      />
      <Button
        accessibilityLabel="Cerrar sesión"
        onPress={onSignOutPress}
        icon="log-out"
        variant="secondary"
        size="md"
      />
    </View>
  );
}
