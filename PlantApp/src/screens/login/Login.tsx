import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useLoginTheme } from './Login.styles';

export default function LoginScreen({ navigation }: any) {
  const { signInWithGoogle, currentUser, loading } = useAuth();
  const { styles } = useLoginTheme();

  // Navegar a Main cuando hay usuario autenticado
  useEffect(() => {
    if (currentUser) {
      navigation.navigate('Main');
    }
  }, [currentUser]);

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
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
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