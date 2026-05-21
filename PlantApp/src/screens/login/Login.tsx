import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { InputTextField } from '../../components/ui/InputText';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, resetPassword, loading } = useAuth();
  const { styles, theme } = useLoginTheme();
  console.log('[LoginScreen] Rendering');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google. Intentá de nuevo.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleEmailSignIn = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      Alert.alert('Faltan datos', 'Completá tu correo y contraseña para iniciar sesión.');
      return;
    }

    setIsEmailSigningIn(true);
    try {
      await signInWithEmail(normalizedEmail, password);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con correo y contraseña. Verificá tus datos e intentá de nuevo.');
    } finally {
      setIsEmailSigningIn(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      Alert.alert('Correo requerido', 'Escribí tu correo para poder restablecer la contraseña.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await resetPassword(normalizedEmail);
      Alert.alert('Revisá tu correo', 'Te enviamos un enlace para restablecer tu contraseña.');
    }
    catch (error) {
      Alert.alert('Error', 'No se pudo enviar el correo de restablecimiento. Intentá de nuevo.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroCard}>
        <Image
          source={require('../../../assets/images/logoSolo.png')}
          style={styles.heroLeafTop}
          resizeMode="contain"
        />
        <Image
          source={require('../../../assets/images/logoSolo.png')}
          style={styles.heroLeafBottom}
          resizeMode="contain"
        />
        <Image
          source={require('../../../assets/images/logoSolo.png')}
          style={styles.heroLeaves}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bienvenido</Text>
      </View>

      {loading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={styles.title.color} />
          <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
        </View>
      )}

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
          onChangeText={setEmail}
        />

        <InputTextField
          label="Contraseña"
          iconName="lock"
          placeholder="Tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.resetLink}
          onPress={handleResetPassword}
          disabled={isResettingPassword || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.resetLinkText}>
            {isResettingPassword ? 'Enviando enlace...' : 'Restablecer contraseña'}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <Button
            title="Iniciar sesión"
            onPress={handleEmailSignIn}
            variant="primary"
            size="lg"
            loading={isEmailSigningIn}
            disabled={loading || isEmailSigningIn || isGoogleSigningIn}
          />

          <Button
            title="Continuar con Google"
            onPress={handleGoogleSignIn}
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

        <TouchableOpacity
          style={styles.createAccountLink}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Text style={styles.createAccountText}>
            ¿No tenés cuenta? <Text style={styles.createAccountTextStrong}>Crear una cuenta</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}