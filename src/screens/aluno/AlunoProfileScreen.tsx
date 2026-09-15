import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import type { AlunoPerfilStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoPerfilStackParamList, 'PerfilHome'>;

export default function AlunoProfileScreen({ navigation }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile?.full_name}</Text>
      <Text style={styles.role}>Aluno</Text>

      <MenuItem
        icon="clipboard-text-outline"
        label="Minha Anamnese"
        onPress={() => navigation.navigate('Anamnese')}
      />
      <MenuItem
        icon="chart-line"
        label="Minha Evolução"
        onPress={() => navigation.navigate('MinhaEvolucao')}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={styles.menuItemText}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 40 },
  name: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  role: { ...typography.labelSm, color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  menuItem: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  menuItemText: { ...typography.bodyMd, fontSize: 15, color: colors.onSurface, flex: 1 },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logoutText: { ...typography.labelMd, color: colors.error },
});
