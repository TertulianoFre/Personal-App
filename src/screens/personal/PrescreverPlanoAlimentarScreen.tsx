import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Alimento } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'PrescreverPlanoAlimentar'>;

interface ItemAlimento {
  key: string;
  alimento_id: string;
  nome: string;
  quantidade_g: string;
  kcal_100g: number;
  proteina_g: number;
  carboidratos_g: number;
  gorduras_g: number;
}

interface ItemRefeicao {
  key: string;
  nome: string;
  horario: string;
  buscaAlimento: string;
  alimentos: ItemAlimento[];
}

let tempKeyCounter = 0;

function macrosDoAlimento(item: ItemAlimento) {
  const fator = (parseFloat(item.quantidade_g.replace(',', '.')) || 0) / 100;
  return {
    kcal: item.kcal_100g * fator,
    proteina: item.proteina_g * fator,
    carboidratos: item.carboidratos_g * fator,
    gorduras: item.gorduras_g * fator,
  };
}

function macrosDaRefeicao(refeicao: ItemRefeicao) {
  return refeicao.alimentos.reduce(
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

export default function PrescreverPlanoAlimentarScreen({ route, navigation }: Props) {
  const { alunoId, planoId } = route.params;
  const { profile } = useAuth();

  const [nome, setNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [refeicoes, setRefeicoes] = useState<ItemRefeicao[]>([]);

  const [alimentosBase, setAlimentosBase] = useState<Alimento[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: alimentosData } = await supabase.from('alimentos').select('*').order('nome');
      setAlimentosBase((alimentosData as Alimento[]) ?? []);

      if (planoId) {
        const { data: plano } = await supabase.from('planos_alimentares').select('*').eq('id', planoId).single();
        if (plano) {
          setNome(plano.nome);
          setObservacoes(plano.observacoes ?? '');
          setAtivo(plano.ativo);
        }

        const { data: refeicoesData } = await supabase
          .from('refeicoes')
          .select('*, refeicao_alimentos(*, alimento:alimentos(*))')
          .eq('plano_id', planoId)
          .order('ordem');

        if (refeicoesData) {
          setRefeicoes(
            refeicoesData.map((r: any) => ({
              key: r.id,
              nome: r.nome,
              horario: r.horario ?? '',
              buscaAlimento: '',
              alimentos: (r.refeicao_alimentos ?? [])
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((ra: any) => ({
                  key: ra.id,
                  alimento_id: ra.alimento_id,
                  nome: ra.alimento?.nome ?? '(alimento removido)',
                  quantidade_g: ra.quantidade_g?.toString() ?? '',
                  kcal_100g: ra.alimento?.kcal_100g ?? 0,
                  proteina_g: ra.alimento?.proteina_g ?? 0,
                  carboidratos_g: ra.alimento?.carboidratos_g ?? 0,
                  gorduras_g: ra.alimento?.gorduras_g ?? 0,
                })),
            }))
          );
        }
      }

      setLoadingData(false);
    })();
  }, [planoId]);

  function addRefeicao() {
    setRefeicoes((prev) => [
      ...prev,
      { key: `temp-${tempKeyCounter++}`, nome: '', horario: '', buscaAlimento: '', alimentos: [] },
    ]);
  }

  function updateRefeicao(key: string, patch: Partial<ItemRefeicao>) {
    setRefeicoes((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRefeicao(key: string) {
    setRefeicoes((prev) => prev.filter((r) => r.key !== key));
  }

  function addAlimento(refeicaoKey: string, alimento: Alimento) {
    setRefeicoes((prev) =>
      prev.map((r) =>
        r.key === refeicaoKey
          ? {
              ...r,
              buscaAlimento: '',
              alimentos: [
                ...r.alimentos,
                {
                  key: `temp-${tempKeyCounter++}`,
                  alimento_id: alimento.id,
                  nome: alimento.nome,
                  quantidade_g: '100',
                  kcal_100g: alimento.kcal_100g,
                  proteina_g: alimento.proteina_g,
                  carboidratos_g: alimento.carboidratos_g,
                  gorduras_g: alimento.gorduras_g,
                },
              ],
            }
          : r
      )
    );
  }

  function updateAlimento(refeicaoKey: string, itemKey: string, quantidade_g: string) {
    setRefeicoes((prev) =>
      prev.map((r) =>
        r.key === refeicaoKey
          ? { ...r, alimentos: r.alimentos.map((a) => (a.key === itemKey ? { ...a, quantidade_g } : a)) }
          : r
      )
    );
  }

  function removeAlimento(refeicaoKey: string, itemKey: string) {
    setRefeicoes((prev) =>
      prev.map((r) =>
        r.key === refeicaoKey ? { ...r, alimentos: r.alimentos.filter((a) => a.key !== itemKey) } : r
      )
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

  async function handleSave() {
    if (!nome) {
      Alert.alert('Dê um nome para o plano (ex: Plano de cutting).');
      return;
    }
    if (refeicoes.length === 0) {
      Alert.alert('Adicione pelo menos uma refeição.');
      return;
    }
    if (refeicoes.some((r) => !r.nome)) {
      Alert.alert('Dê um nome para cada refeição (ex: Café da manhã).');
      return;
    }

    setSaving(true);

    const planoPayload = {
      nome,
      observacoes: observacoes || null,
      ativo,
      aluno_id: alunoId,
      personal_id: profile!.id,
    };

    let savedPlanoId = planoId;

    if (planoId) {
      const { error } = await supabase.from('planos_alimentares').update(planoPayload).eq('id', planoId);
      if (error) {
        setSaving(false);
        Alert.alert('Erro ao salvar plano', error.message);
        return;
      }
      // Estratégia simples: apaga as refeições antigas (cascade apaga os alimentos delas) e recria.
      await supabase.from('refeicoes').delete().eq('plano_id', planoId);
    } else {
      const { data, error } = await supabase.from('planos_alimentares').insert(planoPayload).select('id').single();
      if (error || !data) {
        setSaving(false);
        Alert.alert('Erro ao salvar plano', error?.message ?? 'Tente novamente.');
        return;
      }
      savedPlanoId = data.id;
    }

    const refeicoesPayload = refeicoes.map((r, index) => ({
      plano_id: savedPlanoId,
      nome: r.nome,
      horario: r.horario || null,
      ordem: index,
    }));

    const { data: refeicoesInseridas, error: refeicoesError } = await supabase
      .from('refeicoes')
      .insert(refeicoesPayload)
      .select('id')
      .order('ordem', { ascending: true });

    if (refeicoesError || !refeicoesInseridas) {
      setSaving(false);
      Alert.alert('Erro ao salvar refeições', refeicoesError?.message ?? 'Tente novamente.');
      return;
    }

    const alimentosPayload = refeicoes.flatMap((r, rIndex) =>
      r.alimentos.map((a, aIndex) => ({
        refeicao_id: refeicoesInseridas[rIndex].id,
        alimento_id: a.alimento_id,
        quantidade_g: parseFloat(a.quantidade_g.replace(',', '.')) || 0,
        ordem: aIndex,
      }))
    );

    if (alimentosPayload.length > 0) {
      const { error: alimentosError } = await supabase.from('refeicao_alimentos').insert(alimentosPayload);
      if (alimentosError) {
        setSaving(false);
        Alert.alert('Erro ao salvar alimentos', alimentosError.message);
        return;
      }
    }

    setSaving(false);
    navigation.goBack();
  }

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={shared.inputLabel}>Nome do plano</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Plano de cutting"
      />

      <View style={styles.ativoRow}>
        <Text style={styles.ativoLabel}>Plano ativo</Text>
        <Switch
          value={ativo}
          onValueChange={setAtivo}
          trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
          thumbColor={ativo ? colors.primary : colors.outline}
        />
      </View>

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Observações gerais</Text>
      <TextInput
        style={[shared.input, styles.textArea]}
        placeholderTextColor={colors.outline}
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        placeholder="Ex: beber pelo menos 2,5L de água por dia"
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>TOTAL DO DIA</Text>
        <View style={styles.totalRow}>
          <MacroTag label="kcal" valor={totalDia.kcal} />
          <MacroTag label="prot" valor={totalDia.proteina} sufixo="g" />
          <MacroTag label="carb" valor={totalDia.carboidratos} sufixo="g" />
          <MacroTag label="gord" valor={totalDia.gorduras} sufixo="g" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Refeições</Text>
      {refeicoes.length === 0 && <Text style={styles.emptyText}>Nenhuma refeição adicionada ainda.</Text>}

      {refeicoes.map((refeicao) => {
        const macros = macrosDaRefeicao(refeicao);
        const buscaFiltrada = refeicao.buscaAlimento.trim()
          ? alimentosBase
              .filter((a) => a.nome.toLowerCase().includes(refeicao.buscaAlimento.trim().toLowerCase()))
              .slice(0, 20)
          : [];

        return (
          <View key={refeicao.key} style={styles.refeicaoCard}>
            <View style={styles.refeicaoHeader}>
              <TextInput
                style={styles.refeicaoNomeInput}
                placeholderTextColor={colors.outline}
                value={refeicao.nome}
                onChangeText={(v) => updateRefeicao(refeicao.key, { nome: v })}
                placeholder="Nome da refeição (ex: Café da manhã)"
              />
              <TouchableOpacity onPress={() => removeRefeicao(refeicao.key)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.horarioInput}
              placeholderTextColor={colors.outline}
              value={refeicao.horario}
              onChangeText={(v) => updateRefeicao(refeicao.key, { horario: v })}
              placeholder="Horário (ex: 07:00)"
            />

            {refeicao.alimentos.map((item) => (
              <View key={item.key} style={styles.alimentoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alimentoNome}>{item.nome}</Text>
                  <Text style={styles.alimentoMacro}>
                    {macrosDoAlimento(item).kcal.toFixed(0)} kcal
                  </Text>
                </View>
                <TextInput
                  style={styles.quantidadeInput}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.outline}
                  value={item.quantidade_g}
                  onChangeText={(v) => updateAlimento(refeicao.key, item.key, v)}
                />
                <Text style={styles.gramasLabel}>g</Text>
                <TouchableOpacity onPress={() => removeAlimento(refeicao.key, item.key)} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {refeicao.alimentos.length > 0 && (
              <View style={styles.refeicaoMacrosRow}>
                <MacroTag label="kcal" valor={macros.kcal} />
                <MacroTag label="prot" valor={macros.proteina} sufixo="g" />
                <MacroTag label="carb" valor={macros.carboidratos} sufixo="g" />
                <MacroTag label="gord" valor={macros.gorduras} sufixo="g" />
              </View>
            )}

            <TextInput
              style={[shared.input, styles.buscaAlimentoInput]}
              placeholder="Buscar alimento pra adicionar..."
              placeholderTextColor={colors.outline}
              value={refeicao.buscaAlimento}
              onChangeText={(v) => updateRefeicao(refeicao.key, { buscaAlimento: v })}
            />
            {buscaFiltrada.length > 0 && (
              <View style={styles.resultadosWrap}>
                {buscaFiltrada.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.resultadoChip}
                    onPress={() => addAlimento(refeicao.key, a)}
                  >
                    <Text style={styles.resultadoChipText}>+ {a.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.addRefeicaoButton} onPress={addRefeicao}>
        <Text style={styles.addRefeicaoText}>+ Adicionar refeição</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[shared.primaryButton, { marginTop: spacing.xl }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={shared.primaryButtonText}>Salvar plano</Text>}
      </TouchableOpacity>
    </ScrollView>
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
  container: { padding: spacing.lg, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  textArea: { minHeight: 70, textAlignVertical: 'top', paddingTop: 14 },
  ativoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ativoLabel: { ...typography.bodyMd, fontSize: 15, color: colors.onSurface },
  totalCard: { ...shared.card, marginTop: spacing.lg, alignItems: 'center' },
  totalTitle: { ...typography.labelSm, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  totalRow: { flexDirection: 'row', gap: spacing.md },
  macroTag: { alignItems: 'center' },
  macroTagValor: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.primary, fontSize: 15 },
  macroTagLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 10, textTransform: 'uppercase' },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: spacing.sm },
  refeicaoCard: { ...shared.card, marginBottom: spacing.md },
  refeicaoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refeicaoNomeInput: {
    flex: 1,
    ...typography.bodyMd,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 4,
  },
  horarioInput: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
    marginTop: spacing.xs,
    paddingVertical: 4,
  },
  alimentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
  },
  alimentoNome: { ...typography.bodyMd, fontSize: 14, color: colors.onSurface },
  alimentoMacro: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 10, textTransform: 'none', marginTop: 2 },
  quantidadeInput: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 56,
    textAlign: 'center',
    backgroundColor: colors.black,
    color: colors.onSurface,
    fontSize: 13,
  },
  gramasLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textTransform: 'none' },
  refeicaoMacrosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  buscaAlimentoInput: { marginTop: spacing.md, paddingVertical: 10 },
  resultadosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  resultadoChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resultadoChipText: { ...typography.labelSm, color: colors.primary, textTransform: 'none', fontSize: 12 },
  addRefeicaoButton: {
    ...shared.secondaryButton,
    marginTop: spacing.sm,
  },
  addRefeicaoText: { ...shared.secondaryButtonText },
});
