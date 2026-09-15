import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, typography, spacing, shared } from '../../theme/theme';

export default function PersonalProfileScreen() {
  const { profile, signOut } = useAuth();

  async function shareCode() {
    if (!profile?.invite_code) return;
    await Share.share({
      message: `Baixe o app e use meu código de personal trainer para se cadastrar: ${profile.invite_code}`,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile?.full_name}</Text>
      <Text style={styles.role}>Personal Trainer</Text>

      <View style={styles.card}>
        <Text style={shared.inputLabel}>Seu código de convite</Text>
        <Text style={styles.code}>{profile?.invite_code}</Text>
        <Text style={styles.cardHint}>
          Compartilhe esse código com seus alunos. Eles usam ele na tela de cadastro para
          ficarem vinculados a você automaticamente.
        </Text>
        <TouchableOpacity style={shared.primaryButton} onPress={shareCode}>
          <Text style={shared.primaryButtonText}>Compartilhar código</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 60 },
  name: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  role: { ...typography.labelSm, color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  card: { ...shared.card, marginBottom: spacing.lg },
  code: { ...typography.displayLg, color: colors.primary, letterSpacing: 4, marginBottom: spacing.sm },
  cardHint: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.md, lineHeight: 18 },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { ...typography.labelMd, color: colors.error },
});
