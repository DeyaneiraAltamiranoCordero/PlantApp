import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { InputTextField } from '../../components/ui/InputText';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { signInWithGoogle, createAccountWithEmail, signInWithEmail, resetPassword, loading } = useAuth();
  const { styles, theme } = useLoginTheme();
  console.log('[LoginScreen] Rendering');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const loadRememberedEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('REMEMBERED_EMAIL');
      if (storedEmail) {
        setEmail(storedEmail);
        setRememberEmail(true);
      }
    };

    void loadRememberedEmail();
  }, []);

  const persistRememberedEmail = async (nextEmail: string, shouldRemember: boolean) => {
    if (shouldRemember) {
      await AsyncStorage.setItem('REMEMBERED_EMAIL', nextEmail);
      return;
    }

    await AsyncStorage.removeItem('REMEMBERED_EMAIL');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('[LoginScreen] Google sign-in error:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google. Revisá Metro/adb logs para detalles.');
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
      await persistRememberedEmail(normalizedEmail, rememberEmail);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con correo y contraseña. Verificá tus datos e intentá de nuevo.');
    } finally {
      setIsEmailSigningIn(false);
    }
  };

  const handleCreateAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      Alert.alert('Faltan datos', 'Completá nombre, correo, contraseña y confirmación para crear la cuenta.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'La contraseña y su confirmación deben coincidir.');
      return;
    }

    setIsCreatingAccount(true);
    try {
      await createAccountWithEmail({
        name: normalizedName,
        email: normalizedEmail,
        password,
        confirmPassword,
        lastName: lastName.trim() || undefined,
        secondLastName: secondLastName.trim() || undefined,
      });
      await persistRememberedEmail(normalizedEmail, rememberEmail);
      Alert.alert('Cuenta creada', 'Tu cuenta fue creada correctamente. Por favor iniciá sesión.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('[LoginScreen] Create account error:', error);
      Alert.alert('Error', 'No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.');
    } finally {
      setIsCreatingAccount(false);
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
        <Text style={styles.formTitle}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

        {mode === 'register' && (
          <Text style={styles.formNote}>
            {'Obligatorios: nombre, correo, contraseña y confirmación. Opcionales: apellidos.'}
          </Text>
        )}

        {mode === 'register' && (
          <>
            <InputTextField
              label="Nombre"
              iconName="user"
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={setFullName}
            />

            <InputTextField
              label="Primer apellido"
              iconName="user"
              placeholder="Opcional"
              autoCapitalize="words"
              autoCorrect={false}
              value={lastName}
              onChangeText={setLastName}
              helperText="Opcional"
            />

            <InputTextField
              label="Segundo apellido"
              iconName="user"
              placeholder="Opcional"
              autoCapitalize="words"
              autoCorrect={false}
              value={secondLastName}
              onChangeText={setSecondLastName}
              helperText="Opcional"
            />

            <InputTextField
              label="Apodo"
              iconName="at-sign"
              placeholder="Opcional"
              autoCapitalize="none"
              autoCorrect={false}
              value={nickname}
              onChangeText={setNickname}
              helperText="Opcional — si lo dejás vacío se completará automáticamente desde tu correo."
            />
          </>
        )}

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

        {mode === 'register' && (
          <InputTextField
            label="Confirmar contraseña"
            iconName="lock"
            placeholder="Repetí tu contraseña"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

        {mode === 'login' ? (
          <>
            <View style={styles.rememberRow}>
              <Text style={styles.rememberLabel}>Recordar correo</Text>
              <Switch
                value={rememberEmail}
                onValueChange={setRememberEmail}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            </View>

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
          </>
        ) : null}

        <View style={styles.buttonContainer}>
          {mode === 'login' ? (
            <Button
              title="Iniciar sesión"
              onPress={handleEmailSignIn}
              variant="primary"
              size="lg"
              loading={isEmailSigningIn}
              disabled={loading || isEmailSigningIn || isGoogleSigningIn}
            />
          ) : (
            <Button
              title="Crear cuenta"
              onPress={handleCreateAccount}
              variant="primary"
              size="lg"
              loading={isCreatingAccount}
              disabled={loading || isCreatingAccount || isGoogleSigningIn}
            />
          )}

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
          onPress={() => setMode((current) => (current === 'login' ? 'register' : 'login'))}
          activeOpacity={0.7}
        >
          <Text style={styles.createAccountText}>
            {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
            <Text style={styles.createAccountTextStrong}>
              {mode === 'login' ? 'Crear una cuenta' : 'Iniciar sesión'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}