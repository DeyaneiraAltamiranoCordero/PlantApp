import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { InputTextField } from '../../components/ui/InputText';
import { useAuth } from '../../context/AuthContext';
import { useLoginTheme } from './Login.styles';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { styles, theme } = useLoginTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const initialEmail = typeof route.params?.email === 'string' ? route.params.email : '';
    setEmail(initialEmail);
  }, [route.params?.email]);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSend = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      Alert.alert('Correo requerido', 'Escribí tu correo para enviar el enlace de restablecimiento.');
      return;
    }

    setIsSending(true);
    try {
      await resetPassword(normalizedEmail);
      Alert.alert(
        'Revisá tu correo',
        'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
        [
          {
            text: 'Volver al inicio',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('[ForgotPasswordScreen] Reset password error:', error);
      Alert.alert('Error', 'No se pudo enviar el correo. Intentá de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroCard}>
        <Text style={styles.title}>Restablecer contraseña</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Recuperar acceso</Text>
        <Text style={styles.formNote}>
          Escribí tu correo y te enviamos un enlace para cambiar tu contraseña.
        </Text>

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

        <View style={styles.modalActions}>
          <Button
            title="Cancelar"
            onPress={handleCancel}
            variant="outline"
            size="lg"
            disabled={isSending}
            style={styles.modalActionButton}
          />
          <Button
            title={isSending ? 'Enviando...' : 'Enviar'}
            onPress={handleSend}
            variant="primary"
            size="lg"
            loading={isSending}
            disabled={isSending}
            style={styles.modalActionButton}
          />
        </View>

        <TouchableOpacity
          style={styles.createAccountLink}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.createAccountText}>
            <Text style={styles.createAccountTextStrong}>Volver al inicio</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}