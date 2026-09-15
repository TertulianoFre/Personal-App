import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Treino } from '../../types/database';
import { DIAS_SEMANA } from '../../types/database';
import type { AlunoTreinosStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoTreinosStackParamList, 'MeusTreinos'>;

export default function MeusTreinosScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadTreinos() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .eq('aluno_id', profile.id)
      .eq('ativo', true)
      .order('dia_semana', { ascending: true, nullsFirst: false });
    if (!error) setTreinos(data as Treino[]);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadTreinos();
    }, [profile?.id])
  );

  if (!loading && treinos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum treino por aqui ainda</Text>
        <Text style={styles.emptyText}>Assim que seu personal montar um treino pra você, ele aparece aqui.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={treinos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTreinos} tintColor={colors.primary} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TreinoDetail', { treinoId: item.id, treinoNome: item.nome })}
        >
          <Text style={styles.cardName}>{item.nome}</Text>
          <Text style={styles.cardMeta}>
            {item.dia_semana !== null ? DIAS_SEMANA[item.dia_semana] : 'Treino avulso'}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  emptyTitle: { ...typography.headlineSm, color: colors.onSurface, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
});
