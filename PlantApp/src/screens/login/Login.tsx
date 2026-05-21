import React from 'react';
import { ActivityIndicator, Alert, Image, Text, View } from 'react-native';
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
      <View style={styles.heroCard}>
        <View style={styles.heroOrbTop} />
        <View style={styles.heroOrbBottom} />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Tu jardín, siempre al día</Text>
        </View>
        <Image
          source={require('../../../assets/images/hojas.png')}
          style={styles.heroLeaves}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Organiza el riego, tus plantas y sus cuidados desde un solo lugar.</Text>

        <View style={styles.featureRow}>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Riegos</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Recordatorios</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Plantas</Text>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={styles.title.color} />
          <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
        </View>
      )}
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