import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Exercicio } from '../../types/database';
import { DIAS_SEMANA } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'PrescreverTreino'>;

interface ItemTreino {
  key: string; // id local (uuid do treino_exercicios existente ou temporário)
  exercicio_id: string;
  nome: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso_segundos: string;
  observacoes: string;
}

let tempKeyCounter = 0;

export default function PrescreverTreinoScreen({ route, navigation }: Props) {
  const { alunoId, treinoId } = route.params;
  const { profile } = useAuth();

  const [nome, setNome] = useState('');
  const [diaSemana, setDiaSemana] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemTreino[]>([]);

  const [biblioteca, setBiblioteca] = useState<Exercicio[]>([]);
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const bibliotecaFiltrada = useMemo(() => {
    if (!buscaExercicio.trim()) return biblioteca.slice(0, 30);
    const termo = buscaExercicio.trim().toLowerCase();
    return biblioteca.filter(
      (ex) =>
        ex.nome.toLowerCase().includes(termo) ||
        (ex.grupamento_principal ?? '').toLowerCase().includes(termo)
    );
  }, [biblioteca, buscaExercicio]);

  useEffect(() => {
    (async () => {
      if (!profile) return;

      const { data: exerciciosData } = await supabase
        .from('exercicios')
        .select('*')
        .or(`personal_id.eq.${profile.id},personal_id.is.null`)
        .order('nome');
      setBiblioteca((exerciciosData as Exercicio[]) ?? []);

      if (treinoId) {
        const { data: treino } = await supabase.from('treinos').select('*').eq('id', treinoId).single();
        if (treino) {
          setNome(treino.nome);
          setDiaSemana(treino.dia_semana);
          setObservacoes(treino.observacoes ?? '');
        }
        const { data: treinoExercicios } = await supabase
          .from('treino_exercicios')
          .select('*, exercicio:exercicios(*)')
          .eq('treino_id', treinoId)
          .order('ordem');
        if (treinoExercicios) {
          setItens(
            treinoExercicios.map((te: any) => ({
              key: te.id,
              exercicio_id: te.exercicio_id,
              nome: te.exercicio?.nome ?? '(exercício removido)',
              series: te.series?.toString() ?? '',
              repeticoes: te.repeticoes ?? '',
              carga: te.carga ?? '',
              descanso_segundos: te.descanso_segundos?.toString() ?? '',
              observacoes: te.observacoes ?? '',
            }))
          );
        }
      }

      setLoadingData(false);
    })();
  }, [profile?.id, treinoId]);

  function addExercicio(ex: Exercicio) {
    setItens((prev) => [
      ...prev,
      {
        key: `temp-${tempKeyCounter++}`,
        exercicio_id: ex.id,
        nome: ex.nome,
        series: '3',
        repeticoes: '10-12',
        carga: '',
        descanso_segundos: '60',
        observacoes: '',
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<ItemTreino>) {
    setItens((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItens((prev) => prev.filter((it) => it.key !== key));
  }

  async function handleSave() {
    if (!nome) {
      Alert.alert('Dê um nome para o treino (ex: Treino A - Peito e Tríceps).');
      return;
    }
    if (itens.length === 0) {
      Alert.alert('Adicione pelo menos um exercício ao treino.');
      return;
    }

    setSaving(true);

    const treinoPayload = {
      nome,
      dia_semana: diaSemana,
      observacoes: observacoes || null,
      aluno_id: alunoId,
      personal_id: profile!.id,
    };

    let savedTreinoId = treinoId;

    if (treinoId) {
      const { error } = await supabase.from('treinos').update(treinoPayload).eq('id', treinoId);
      if (error) {
        setSaving(false);
        Alert.alert('Erro ao salvar treino', error.message);
        return;
      }
      // Estratégia simples: apaga os itens antigos e recria com os atuais.
      await supabase.from('treino_exercicios').delete().eq('treino_id', treinoId);
    } else {
      const { data, error } = await supabase.from('treinos').insert(treinoPayload).select('id').single();
      if (error || !data) {
        setSaving(false);
        Alert.alert('Erro ao salvar treino', error?.message ?? 'Tente novamente.');
        return;
      }
      savedTreinoId = data.id;
    }

    const itensPayload = itens.map((it, index) => ({
      treino_id: savedTreinoId,
      exercicio_id: it.exercicio_id,
      ordem: index,
      series: it.series ? parseInt(it.series, 10) : null,
      repeticoes: it.repeticoes || null,
      carga: it.carga || null,
      descanso_segundos: it.descanso_segundos ? parseInt(it.descanso_segundos, 10) : null,
      observacoes: it.observacoes || null,
    }));

    const { error: itensError } = await supabase.from('treino_exercicios').insert(itensPayload);

    setSaving(false);

    if (itensError) {
      Alert.alert('Erro ao salvar exercícios do treino', itensError.message);
      return;
    }

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
      <Text style={shared.inputLabel}>Nome do treino</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Treino A - Peito e Tríceps"
      />

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Dia da semana (opcional)</Text>
      <View style={styles.diasRow}>
        <TouchableOpacity
          style={[styles.diaChip, diaSemana === null && styles.diaChipActive]}
          onPress={() => setDiaSemana(null)}
        >
          <Text style={[styles.diaChipText, diaSemana === null && styles.diaChipTextActive]}>Avulso</Text>
        </TouchableOpacity>
        {DIAS_SEMANA.map((dia, index) => (
          <TouchableOpacity
            key={dia}
            style={[styles.diaChip, diaSemana === index && styles.diaChipActive]}
            onPress={() => setDiaSemana(index)}
          >
            <Text style={[styles.diaChipText, diaSemana === index && styles.diaChipTextActive]}>
              {dia.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Observações gerais</Text>
      <TextInput
        style={[shared.input, styles.textArea]}
        placeholderTextColor={colors.outline}
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        placeholder="Ex: aquecer 5min de esteira antes de começar"
      />

      <Text style={styles.sectionTitle}>Exercícios do treino</Text>
      {itens.length === 0 && <Text style={styles.emptyText}>Nenhum exercício adicionado ainda.</Text>}

      {itens.map((item, index) => (
        <View key={item.key} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNome}>
              {index + 1}. {item.nome}
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.key)}>
              <Text style={styles.removeText}>remover</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemRow}>
            <View style={styles.itemField}>
              <Text style={styles.itemFieldLabel}>Séries</Text>
              <TextInput
                style={styles.itemInput}
                placeholderTextColor={colors.outline}
                keyboardType="number-pad"
                value={item.series}
                onChangeText={(v) => updateItem(item.key, { series: v })}
              />
            </View>
            <View style={styles.itemField}>
              <Text style={styles.itemFieldLabel}>Repetições</Text>
              <TextInput
                style={styles.itemInput}
                placeholderTextColor={colors.outline}
                value={item.repeticoes}
                onChangeText={(v) => updateItem(item.key, { repeticoes: v })}
                placeholder="8-12"
              />
            </View>
            <View style={styles.itemField}>
              <Text style={styles.itemFieldLabel}>Carga</Text>
              <TextInput
                style={styles.itemInput}
                placeholderTextColor={colors.outline}
                value={item.carga}
                onChangeText={(v) => updateItem(item.key, { carga: v })}
                placeholder="20kg"
              />
            </View>
            <View style={styles.itemField}>
              <Text style={styles.itemFieldLabel}>Descanso (s)</Text>
              <TextInput
                style={styles.itemInput}
                placeholderTextColor={colors.outline}
                keyboardType="number-pad"
                value={item.descanso_segundos}
                onChangeText={(v) => updateItem(item.key, { descanso_segundos: v })}
              />
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Adicionar da biblioteca</Text>
      {biblioteca.length === 0 ? (
        <Text style={styles.emptyText}>
          Nenhum exercício disponível ainda. Vá na aba Exercícios para cadastrar.
        </Text>
      ) : (
        <>
          <TextInput
            style={[shared.input, { marginBottom: spacing.sm }]}
            placeholder="Buscar exercício por nome ou grupo muscular..."
            placeholderTextColor={colors.outline}
            value={buscaExercicio}
            onChangeText={setBuscaExercicio}
          />
          <View style={styles.bibliotecaWrap}>
            {bibliotecaFiltrada.map((ex) => (
              <TouchableOpacity key={ex.id} style={styles.bibliotecaChip} onPress={() => addExercicio(ex)}>
                <Text style={styles.bibliotecaChipText}>+ {ex.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!buscaExercicio && biblioteca.length > 30 && (
            <Text style={styles.emptyText}>Mostrando 30 de {biblioteca.length} — use a busca para ver mais.</Text>
          )}
        </>
      )}

      <TouchableOpacity style={[shared.primaryButton, { marginTop: spacing.xl }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={shared.primaryButtonText}>Salvar treino</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  textArea: { minHeight: 70, textAlignVertical: 'top', paddingTop: 14 },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaChip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  diaChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaChipText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  diaChipTextActive: { color: colors.onPrimary },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: spacing.sm },
  itemCard: { ...shared.card, marginBottom: spacing.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  itemNome: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface, flexShrink: 1 },
  removeText: { ...typography.labelSm, color: colors.error },
  itemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemField: { flexGrow: 1, minWidth: '22%' },
  itemFieldLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, marginBottom: 4, fontSize: 10 },
  itemInput: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.black,
    fontSize: 14,
    color: colors.onSurface,
    fontFamily: 'Inter_400Regular',
  },
  bibliotecaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  bibliotecaChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bibliotecaChipText: { ...typography.labelSm, color: colors.primary },
});
