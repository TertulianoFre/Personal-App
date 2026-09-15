import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { TreinoExercicio, Treino } from '../../types/database';
import type { AlunoTreinosStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoTreinosStackParamList, 'TreinoDetail'>;

export default function TreinoDetailScreen({ route, navigation }: Props) {
  const { treinoId, treinoNome } = route.params;
  const [treino, setTreino] = useState<Treino | null>(null);
  const [itens, setItens] = useState<TreinoExercicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: treinoData } = await supabase.from('treinos').select('*').eq('id', treinoId).single();
      setTreino(treinoData as Treino);

      const { data: itensData } = await supabase
        .from('treino_exercicios')
        .select('*, exercicio:exercicios(*)')
        .eq('treino_id', treinoId)
        .order('ordem');
      setItens((itensData as TreinoExercicio[]) ?? []);
      setLoading(false);
    })();
  }, [treinoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={itens}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          {!!treino?.observacoes && (
            <View style={styles.obsCard}>
              <Text style={styles.obsText}>{treino.observacoes}</Text>
            </View>
          )}
          {itens.length > 0 && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('ExecutarTreino', { treinoId, treinoNome })}
            >
              <Text style={styles.startButtonText}>▶ Iniciar treino</Text>
            </TouchableOpacity>
          )}
        </>
      }
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <Text style={styles.exNome}>
            {index + 1}. {item.exercicio?.nome}
          </Text>
          {!!item.exercicio?.grupo_muscular && (
            <Text style={styles.exGrupo}>{item.exercicio.grupo_muscular}</Text>
          )}

          <View style={styles.metaRow}>
            {!!item.series && <Text style={styles.metaText}>{item.series} séries</Text>}
            {!!item.repeticoes && <Text style={styles.metaText}>{item.repeticoes} reps</Text>}
            {!!item.carga && <Text style={styles.metaText}>{item.carga}</Text>}
            {!!item.descanso_segundos && <Text style={styles.metaText}>{item.descanso_segundos}s descanso</Text>}
          </View>

          {!!item.observacoes && <Text style={styles.itemObs}>{item.observacoes}</Text>}

          {!!item.exercicio?.video_url && (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => Linking.openURL(item.exercicio!.video_url!)}
            >
              <Text style={styles.videoButtonText}>▶ Ver vídeo demonstrativo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { padding: spacing.md },
  obsCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  obsText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 },
  startButton: { ...shared.primaryButton, marginBottom: spacing.md },
  startButtonText: { ...shared.primaryButtonText },
  card: { ...shared.card, marginBottom: spacing.sm },
  exNome: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.onSurface },
  exGrupo: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  metaText: {
    ...typography.labelSm,
    color: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  itemObs: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, marginTop: spacing.sm, fontStyle: 'italic' },
  videoButton: { marginTop: spacing.md, alignSelf: 'flex-start' },
  videoButtonText: { ...typography.labelMd, color: colors.primary },
});
