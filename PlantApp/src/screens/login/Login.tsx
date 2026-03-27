import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { useLoginTheme } from './Login.styles';

export default function LoginScreen({ navigation }: any) {
  const { authGoogle, authFirebaseAnonymous, currentUser, loading } = useAuth();
  const { styles } = useLoginTheme();

  useEffect(() => {
    if (currentUser) {
      navigation.navigate('Main');
    }
  }, [currentUser]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Iniciar sesión con Google"
          onPress={() => authGoogle()}
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
}