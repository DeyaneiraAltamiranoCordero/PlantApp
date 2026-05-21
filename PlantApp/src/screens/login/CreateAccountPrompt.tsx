import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import type { LoginStyles } from './Login.styles';

interface CreateAccountPromptProps {
  styles: LoginStyles;
  onPress: () => void;
}

export function CreateAccountPrompt({ styles, onPress }: CreateAccountPromptProps) {
  return (
    <TouchableOpacity style={styles.createAccountLink} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.createAccountText}>
        ¿No tenés cuenta? <Text style={styles.createAccountTextStrong}>Crear una cuenta</Text>
      </Text>
    </TouchableOpacity>
  );
}
