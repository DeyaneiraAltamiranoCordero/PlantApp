import React from 'react';
import { View } from 'react-native';
import UserProfile from '../../src/screens/userProfile/UserProfile';

export default function ProfileTab() {
  return (
    <View style={{ flex: 1 }}>
      <UserProfile />
    </View>
  );
}