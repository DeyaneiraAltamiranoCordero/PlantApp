import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';
import { LoginHero } from './LoginHero';
import { LoginCredentialsForm } from './LoginCredentialsForm';
import { LoginActions } from './LoginActions';
import { CreateAccountPrompt } from './CreateAccountPrompt';

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
      <LoginHero styles={styles} />

      {loading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={styles.title.color} />
          <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <LoginCredentialsForm
          styles={styles}
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onResetPasswordPress={handleResetPassword}
          isResettingPassword={isResettingPassword}
          loading={loading}
        />

        <LoginActions
          styles={styles}
          theme={theme}
          onEmailSignInPress={handleEmailSignIn}
          onGoogleSignInPress={handleGoogleSignIn}
          isEmailSigningIn={isEmailSigningIn}
          isGoogleSigningIn={isGoogleSigningIn}
          loading={loading}
        />

        <CreateAccountPrompt styles={styles} onPress={() => {}} />
      </View>
    </ScrollView>
  );
}