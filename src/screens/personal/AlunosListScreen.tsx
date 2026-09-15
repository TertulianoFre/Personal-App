import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'AlunosList'>;

export default function AlunosListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [alunos, setAlunos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAlunos() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('personal_id', profile.id)
      .order('full_name');
    if (!error) setAlunos(data as Profile[]);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadAlunos();
    }, [profile?.id])
  );

  if (!loading && alunos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum aluno ainda</Text>
        <Text style={styles.emptyText}>
          Vá na aba Perfil e compartilhe seu código de convite com seus alunos. Assim que eles se
          cadastrarem com o código, vão aparecer aqui.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={alunos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAlunos} tintColor={colors.primary} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AlunoDetail', { alunoId: item.id, alunoNome: item.full_name })}
        >
          <Text style={styles.cardName}>{item.full_name}</Text>
          <Text style={[styles.cardStatus, item.status === 'inactive' && styles.cardStatusInactive]}>
            {item.status === 'active' ? 'Ativo' : 'Inativo'}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    ...shared.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardStatus: { ...typography.labelSm, color: '#7fd18a' },
  cardStatusInactive: { color: colors.onSurfaceVariant },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  emptyTitle: { ...typography.headlineSm, color: colors.onSurface, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
});
