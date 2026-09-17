import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import ChatScreen from '../shared/ChatScreen';
import { colors } from '../../theme/theme';

export default function MensagensScreen() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <ChatScreen alunoId={profile.id} />;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
