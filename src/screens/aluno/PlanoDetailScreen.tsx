import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { PlanoAlimentar, Refeicao, RefeicaoAlimento } from '../../types/database';
import type { AlunoDietaStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoDietaStackParamList, 'PlanoDetail'>;

interface RefeicaoComAlimentos extends Refeicao {
  refeicao_alimentos: RefeicaoAlimento[];
}

function macrosDoAlimento(item: RefeicaoAlimento) {
  const fator = item.quantidade_g / 100;
  return {
    kcal: (item.alimento?.kcal_100g ?? 0) * fator,
    proteina: (item.alimento?.proteina_g ?? 0) * fator,
    carboidratos: (item.alimento?.carboidratos_g ?? 0) * fator,
    gorduras: (item.alimento?.gorduras_g ?? 0) * fator,
  };
}

function macrosDaRefeicao(refeicao: RefeicaoComAlimentos) {
  return refeicao.refeicao_alimentos.reduce(
    (acc, item) => {
      const m = macrosDoAlimento(item);
      return {
        kcal: acc.kcal + m.kcal,
        proteina: acc.proteina + m.proteina,
        carboidratos: acc.carboidratos + m.carboidratos,
        gorduras: acc.gorduras + m.gorduras,
      };
    },
    { kcal: 0, proteina: 0, carboidratos: 0, gorduras: 0 }
  );
}

export default function PlanoDetailScreen({ route }: Props) {
  const { planoId } = route.params;
  const [plano, setPlano] = useState<PlanoAlimentar | null>(null);
  const [refeicoes, setRefeicoes] = useState<RefeicaoComAlimentos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: planoData } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('id', planoId)
        .single();
      setPlano(planoData as PlanoAlimentar);

      const { data: refeicoesData } = await supabase
        .from('refeicoes')
        .select('*, refeicao_alimentos(*, alimento:alimentos(*))')
        .eq('plano_id', planoId)
        .order('ordem');
      setRefeicoes((refeicoesData as RefeicaoComAlimentos[]) ?? []);
      setLoading(false);
    })();
  }, [planoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalDia = refeicoes.reduce(
    (acc, r) => {
      const m = macrosDaRefeicao(r);
      return {
        kcal: acc.kcal + m.kcal,
        proteina: acc.proteina + m.proteina,
        carboidratos: acc.carboidratos + m.carboidratos,
        gorduras: acc.gorduras + m.gorduras,
      };
    },
    { kcal: 0, proteina: 0, carboidratos: 0, gorduras: 0 }
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={refeicoes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          {!!plano?.observacoes && (
            <View style={styles.obsCard}>
              <Text style={styles.obsText}>{plano.observacoes}</Text>
            </View>
          )}
          <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>TOTAL DO DIA</Text>
            <View style={styles.totalRow}>
              <MacroTag label="kcal" valor={totalDia.kcal} />
              <MacroTag label="prot" valor={totalDia.proteina} sufixo="g" />
              <MacroTag label="carb" valor={totalDia.carboidratos} sufixo="g" />
              <MacroTag label="gord" valor={totalDia.gorduras} sufixo="g" />
            </View>
          </View>
        </>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>Esse plano ainda não tem refeições cadastradas.</Text>
      }
      renderItem={({ item }) => {
        const macros = macrosDaRefeicao(item);
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.refNome}>{item.nome}</Text>
              {!!item.horario && <Text style={styles.refHorario}>{item.horario}</Text>}
            </View>

            {item.refeicao_alimentos
              .slice()
              .sort((a, b) => a.ordem - b.ordem)
              .map((ra) => (
                <View key={ra.id} style={styles.alimentoRow}>
                  <Text style={styles.alimentoNome}>{ra.alimento?.nome ?? '(alimento removido)'}</Text>
                  <Text style={styles.alimentoQtd}>{ra.quantidade_g}g</Text>
                </View>
              ))}

            {item.refeicao_alimentos.length > 0 && (
              <View style={styles.macrosRow}>
                <MacroTag label="kcal" valor={macros.kcal} />
                <MacroTag label="prot" valor={macros.proteina} sufixo="g" />
                <MacroTag label="carb" valor={macros.carboidratos} sufixo="g" />
                <MacroTag label="gord" valor={macros.gorduras} sufixo="g" />
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

function MacroTag({ label, valor, sufixo = '' }: { label: string; valor: number; sufixo?: string }) {
  return (
    <View style={styles.macroTag}>
      <Text style={styles.macroTagValor}>
        {valor.toFixed(0)}
        {sufixo}
      </Text>
      <Text style={styles.macroTagLabel}>{label}</Text>
    </View>
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
  totalCard: { ...shared.card, marginBottom: spacing.md, alignItems: 'center' },
  totalTitle: { ...typography.labelSm, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  totalRow: { flexDirection: 'row', gap: spacing.md },
  macroTag: { alignItems: 'center' },
  macroTagValor: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.primary, fontSize: 15 },
  macroTagLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 10, textTransform: 'uppercase' },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refNome: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.onSurface },
  refHorario: { ...typography.labelSm, color: colors.onSurfaceVariant },
  alimentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
  },
  alimentoNome: { ...typography.bodyMd, fontSize: 14, color: colors.onSurface, flex: 1 },
  alimentoQtd: { ...typography.labelSm, color: colors.onSurfaceVariant },
  macrosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
