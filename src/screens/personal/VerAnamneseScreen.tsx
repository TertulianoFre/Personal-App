import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { Anamnese } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'VerAnamnese'>;

export default function VerAnamneseScreen({ route }: Props) {
  const { alunoId } = route.params;
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('anamneses')
        .select('*')
        .eq('aluno_id', alunoId)
        .maybeSingle();
      setAnamnese(data as Anamnese | null);
      setLoading(false);
    })();
  }, [alunoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!anamnese) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Este aluno ainda não preencheu a anamnese.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados gerais</Text>
        <InfoRow label="Idade" value={anamnese.idade ? `${anamnese.idade} anos` : '—'} />
        <InfoRow label="Altura" value={anamnese.altura_cm ? `${anamnese.altura_cm} cm` : '—'} />
        <InfoRow label="Peso" value={anamnese.peso_kg ? `${anamnese.peso_kg} kg` : '—'} />
        <InfoRow label="Objetivo" value={anamnese.objetivo ?? '—'} />
        <InfoRow label="Nível de experiência" value={anamnese.nivel_experiencia ?? '—'} />
        <InfoRow
          label="Dias disponíveis/semana"
          value={anamnese.dias_disponiveis_semana ? `${anamnese.dias_disponiveis_semana}` : '—'}
        />
        <InfoRow label="Restrições alimentares" value={anamnese.restricoes_alimentares ?? 'Nenhuma'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Saúde</Text>
        <InfoRow label="Possui lesão" value={anamnese.possui_lesao ? 'Sim' : 'Não'} />
        {anamnese.possui_lesao && anamnese.descricao_lesao && (
          <Text style={styles.detailText}>{anamnese.descricao_lesao}</Text>
        )}
        <InfoRow label="Condição médica" value={anamnese.possui_condicao_medica ? 'Sim' : 'Não'} />
        {anamnese.possui_condicao_medica && anamnese.descricao_condicao_medica && (
          <Text style={styles.detailText}>{anamnese.descricao_condicao_medica}</Text>
        )}
        <InfoRow label="Usa medicamento" value={anamnese.usa_medicamento ? 'Sim' : 'Não'} />
        {anamnese.usa_medicamento && anamnese.descricao_medicamento && (
          <Text style={styles.detailText}>{anamnese.descricao_medicamento}</Text>
        )}
        <InfoRow label="Liberado pelo médico" value={anamnese.liberado_medico ? 'Sim' : 'Não'} />
      </View>

      {!!anamnese.observacoes && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={styles.detailText}>{anamnese.observacoes}</Text>
        </View>
      )}

      <Text style={styles.updatedAt}>
        Atualizado em {new Date(anamnese.updated_at).toLocaleDateString('pt-BR')}
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { ...shared.card, marginBottom: spacing.md },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface, marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  infoLabel: { ...typography.bodyMd, fontSize: 14, color: colors.onSurfaceVariant },
  infoValue: { ...typography.bodyMd, fontSize: 14, color: colors.onSurface, fontFamily: 'Inter_600SemiBold', flexShrink: 1, textAlign: 'right' },
  detailText: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 2, marginBottom: 6 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.lg },
  updatedAt: { ...typography.labelSm, color: colors.outline, textAlign: 'center', textTransform: 'none' },
});
