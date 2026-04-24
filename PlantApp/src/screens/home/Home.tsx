import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/desingSystem';
import { createHomeStyles } from './Home.styles';

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');

  const displayName = useMemo(() => {
    const fromAuth = currentUser?.displayName?.trim();
    if (fromAuth) return fromAuth;
    const emailPrefix = currentUser?.email?.split('@')?.[0]?.trim();
    return emailPrefix || 'Usuario';
  }, [currentUser]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.userName}>{displayName}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather
            name="search"
            size={18}
            color={theme.colors.mutedForeground}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Buscar"
            placeholderTextColor={theme.colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>
    </ScrollView>
  );
}