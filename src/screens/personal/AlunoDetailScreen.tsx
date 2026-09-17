import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { Treino } from '../../types/database';
import { DIAS_SEMANA } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'AlunoDetail'>;

export default function AlunoDetailScreen({ route, navigation }: Props) {
  const { alunoId, alunoNome } = route.params;
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadTreinos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false });
    if (!error) setTreinos(data as Treino[]);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadTreinos();
    }, [alunoId])
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('VerAnamnese', { alunoId, alunoNome })}
        >
          <Text style={shared.secondaryButtonText}>Anamnese</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('VerEvolucao', { alunoId, alunoNome })}
        >
          <Text style={shared.secondaryButtonText}>Evolução</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('PlanosAlimentares', { alunoId, alunoNome })}
        >
          <Text style={shared.secondaryButtonText}>Dieta</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('PrescreverTreino', { alunoId, alunoNome })}
      >
        <Text style={shared.primaryButtonText}>+ Novo treino</Text>
      </TouchableOpacity>

      <FlatList
        data={treinos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTreinos} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Esse aluno ainda não tem treinos.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('PrescreverTreino', { alunoId, alunoNome, treinoId: item.id })
            }
          >
            <Text style={styles.cardName}>{item.nome}</Text>
            <Text style={styles.cardMeta}>
              {item.dia_semana !== null ? DIAS_SEMANA[item.dia_semana] : 'Avulso'} ·{' '}
              {item.ativo ? 'Ativo' : 'Inativo'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  secondaryAction: {
    ...shared.secondaryButton,
    flex: 1,
    paddingVertical: 12,
  },
  newButton: {
    ...shared.primaryButton,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
