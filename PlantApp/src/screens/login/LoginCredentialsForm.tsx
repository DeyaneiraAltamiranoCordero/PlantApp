import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { InputTextField } from '../../components/ui/InputText';
import type { LoginStyles } from './Login.styles';

interface LoginCredentialsFormProps {
  styles: LoginStyles;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onResetPasswordPress: () => void;
  isResettingPassword: boolean;
  loading: boolean;
}

export function LoginCredentialsForm({
  styles,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onResetPasswordPress,
  isResettingPassword,
  loading,
}: LoginCredentialsFormProps) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Iniciar sesión</Text>

      <InputTextField
        label="Correo electrónico"
        iconName="mail"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={onEmailChange}
      />

      <InputTextField
        label="Contraseña"
        iconName="lock"
        placeholder="Tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={onPasswordChange}
      />

      <TouchableOpacity
        style={styles.resetLink}
        onPress={onResetPasswordPress}
        disabled={isResettingPassword || loading}
        activeOpacity={0.7}
      >
        <Text style={styles.resetLinkText}>
          {isResettingPassword ? 'Enviando enlace...' : 'Restablecer contraseña'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
