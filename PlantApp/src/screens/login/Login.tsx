import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();
  const { styles } = useLoginTheme();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={styles.title.color} />
      </View>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Continuar con Google"
          onPress={handleGoogleSignIn}
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
}