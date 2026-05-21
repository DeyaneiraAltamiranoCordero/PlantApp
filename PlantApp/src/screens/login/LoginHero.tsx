import React from 'react';
import { Image, Text, View } from 'react-native';
import type { LoginStyles } from './Login.styles';

interface LoginHeroProps {
  styles: LoginStyles;
}

export function LoginHero({ styles }: LoginHeroProps) {
  return (
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
  );
}
