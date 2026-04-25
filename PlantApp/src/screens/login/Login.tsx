import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();
  const { styles, theme } = useLoginTheme();
  console.log('[LoginScreen] Rendering');

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={styles.title.color} />
          <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
        </View>
      )}
      <Text style={styles.title}>Bienvenido</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Continuar con Google"
          onPress={handleGoogleSignIn}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          leftIcon={
            <FontAwesome
              name="google"
              size={20}
              color={theme.colors.primaryForeground}
            />
          }
        />
      </View>
    </View>
  );
}