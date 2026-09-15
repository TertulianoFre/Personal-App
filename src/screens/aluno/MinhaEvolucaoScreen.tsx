import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { AvaliacaoFisica } from '../../types/database';
import type { AlunoPerfilStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoPerfilStackParamList, 'MinhaEvolucao'>;

type AvaliacaoComUrls = AvaliacaoFisica & { fotoUrls: string[] };

export default function MinhaEvolucaoScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComUrls[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('aluno_id', profile.id)
      .order('data', { ascending: false });

    const rows = (data as AvaliacaoFisica[]) ?? [];
    const comUrls = await Promise.all(
      rows.map(async (a) => {
        if (!a.fotos || a.fotos.length === 0) return { ...a, fotoUrls: [] };
        const { data: signed } = await supabase.storage.from('evolucao-fotos').createSignedUrls(a.fotos, 3600);
        return { ...a, fotoUrls: (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[] };
      })
    );

    setAvaliacoes(comUrls);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const ultimoPeso = avaliacoes[0]?.peso_kg;
  const primeiroPeso = avaliacoes[avaliacoes.length - 1]?.peso_kg;
  const variacao = ultimoPeso != null && primeiroPeso != null ? ultimoPeso - primeiroPeso : null;

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        style={[shared.primaryButton, styles.newButton]}
        onPress={() => navigation.navigate('NovaAvaliacao')}
      >
        <Text style={shared.primaryButtonText}>+ Nova avaliação</Text>
      </TouchableOpacity>

      {variacao !== null && avaliacoes.length > 1 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>VARIAÇÃO DE PESO NO PERÍODO</Text>
          <Text style={[styles.summaryValue, { color: variacao <= 0 ? colors.primary : colors.error }]}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)} kg
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={avaliacoes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Você ainda não registrou nenhuma avaliação física.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</Text>
                {item.peso_kg != null && <Text style={styles.cardPeso}>{item.peso_kg} kg</Text>}
              </View>

              <View style={styles.medidasRow}>
                {item.percentual_gordura != null && <Text style={styles.medida}>% gordura: {item.percentual_gordura}</Text>}
                {item.medida_cintura_cm != null && <Text style={styles.medida}>Cintura: {item.medida_cintura_cm}cm</Text>}
                {item.medida_quadril_cm != null && <Text style={styles.medida}>Quadril: {item.medida_quadril_cm}cm</Text>}
                {item.medida_braco_cm != null && <Text style={styles.medida}>Braço: {item.medida_braco_cm}cm</Text>}
                {item.medida_coxa_cm != null && <Text style={styles.medida}>Coxa: {item.medida_coxa_cm}cm</Text>}
              </View>

              {item.fotoUrls.length > 0 && (
                <FlatList
                  horizontal
                  data={item.fotoUrls}
                  keyExtractor={(u) => u}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.sm }}
                  renderItem={({ item: url }) => <Image source={{ uri: url }} style={styles.foto} />}
                />
              )}

              {!!item.observacoes && <Text style={styles.obs}>{item.observacoes}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  newButton: { marginHorizontal: spacing.md, marginTop: spacing.md },
  summaryCard: {
    ...shared.card,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  summaryValue: { ...typography.headlineMd, marginTop: 4 },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { ...typography.labelMd, color: colors.primary },
  cardPeso: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  medidasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  medida: {
    ...typography.labelSm,
    textTransform: 'none',
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  foto: { width: 80, height: 80, borderRadius: radii.md, borderWidth: 1, borderColor: colors.outlineVariant },
  obs: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
