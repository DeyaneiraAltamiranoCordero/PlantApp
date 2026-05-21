import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { Button } from '../../components/ui/Button';
import type { LoginStyles, LoginTheme } from './Login.styles';

interface LoginActionsProps {
  styles: LoginStyles;
  theme: LoginTheme;
  onEmailSignInPress: () => void;
  onGoogleSignInPress: () => void;
  isEmailSigningIn: boolean;
  isGoogleSigningIn: boolean;
  loading: boolean;
}

export function LoginActions({
  styles,
  theme,
  onEmailSignInPress,
  onGoogleSignInPress,
  isEmailSigningIn,
  isGoogleSigningIn,
  loading,
}: LoginActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      <Button
        title="Iniciar sesión"
        onPress={onEmailSignInPress}
        variant="primary"
        size="lg"
        loading={isEmailSigningIn}
        disabled={loading || isEmailSigningIn || isGoogleSigningIn}
      />

      <Button
        title="Continuar con Google"
        onPress={onGoogleSignInPress}
        variant="secondary"
        size="lg"
        loading={isGoogleSigningIn}
        disabled={loading || isGoogleSigningIn || isEmailSigningIn}
        leftIcon={
          <FontAwesome
            name="google"
            size={20}
            color={theme.colors.secondaryForeground}
          />
        }
      />
    </View>
  );
}
