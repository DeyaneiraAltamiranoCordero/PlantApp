import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const { authGoogle } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>

      <TouchableOpacity
        style={[styles.googleButton]}
        onPress={() => authGoogle()}
      >
        <FontAwesome name="google" size={24} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.secondaryButtonText}>Ingresar sin login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  disabledButton: {
    backgroundColor: '#a1c2fa',
  },
  icon: {
    marginRight: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 25,
    padding: 10,
  },
  secondaryButtonText: {
    color: '#777',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
