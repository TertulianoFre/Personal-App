import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { TreinoExercicio } from '../../types/database';
import type { AlunoTreinosStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoTreinosStackParamList, 'ExecutarTreino'>;

type ItemState = {
  item: TreinoExercicio;
  concluido: boolean;
  carga_realizada: string;
  repeticoes_realizadas: string;
};

export default function ExecutarTreinoScreen({ route, navigation }: Props) {
  const { treinoId } = route.params;
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itens, setItens] = useState<ItemState[]>([]);

  const [descansoAtivo, setDescansoAtivo] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [dificuldade, setDificuldade] = useState(3);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('treino_exercicios')
        .select('*, exercicio:exercicios(*)')
        .eq('treino_id', treinoId)
        .order('ordem');
      const rows = (data as TreinoExercicio[]) ?? [];
      setItens(
        rows.map((item) => ({
          item,
          concluido: false,
          carga_realizada: item.carga ?? '',
          repeticoes_realizadas: item.repeticoes ?? '',
        }))
      );
      setLoading(false);
    })();
  }, [treinoId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function toggleConcluido(index: number) {
    setItens((prev) => {
      const next = [...prev];
      const wasConcluido = next[index].concluido;
      next[index] = { ...next[index], concluido: !wasConcluido };
      return next;
    });

    const item = itens[index];
    if (!item.concluido && item.item.descanso_segundos) {
      startDescanso(item.item.descanso_segundos);
    }
  }

  function startDescanso(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDescansoAtivo(seconds);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDescansoAtivo(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function pularDescanso() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDescansoAtivo(null);
  }

  function updateField(index: number, field: 'carga_realizada' | 'repeticoes_realizadas', value: string) {
    setItens((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  const totalConcluidos = itens.filter((i) => i.concluido).length;

  async function handleFinalizar() {
    if (!profile) return;
    setSaving(true);

    const { data: execucao, error: execError } = await supabase
      .from('treino_execucoes')
      .insert({
        treino_id: treinoId,
        aluno_id: profile.id,
        data: new Date().toISOString().slice(0, 10),
        dificuldade,
        comentario: comentario || null,
      })
      .select()
      .single();

    if (execError || !execucao) {
      setSaving(false);
      Alert.alert('Erro ao salvar', execError?.message ?? 'Tente novamente.');
      return;
    }

    const itemsPayload = itens.map((i) => ({
      treino_execucao_id: execucao.id,
      treino_exercicio_id: i.item.id,
      concluido: i.concluido,
      carga_realizada: i.carga_realizada || null,
      repeticoes_realizadas: i.repeticoes_realizadas || null,
    }));

    const { error: itemsError } = await supabase.from('treino_execucao_itens').insert(itemsPayload);
    setSaving(false);

    if (itemsError) {
      Alert.alert('Erro ao salvar itens', itemsError.message);
      return;
    }

    setFeedbackVisible(false);
    Alert.alert('Treino concluído!', 'Bom trabalho. Seu progresso foi registrado.', [
      { text: 'OK', onPress: () => navigation.popToTop() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          {totalConcluidos}/{itens.length} exercícios concluídos
        </Text>
      </View>

      <FlatList
        data={itens}
        keyExtractor={(i) => i.item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: state, index }) => (
          <View style={[styles.card, state.concluido && styles.cardConcluido]}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => toggleConcluido(index)}>
              <MaterialCommunityIcons
                name={state.concluido ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={24}
                color={state.concluido ? colors.primary : colors.outline}
              />
              <Text style={styles.exNome}>
                {index + 1}. {state.item.exercicio?.nome}
              </Text>
            </TouchableOpacity>

            <View style={styles.metaRow}>
              {!!state.item.series && <Text style={styles.metaText}>{state.item.series} séries prescritas</Text>}
              {!!state.item.descanso_segundos && (
                <Text style={styles.metaText}>{state.item.descanso_segundos}s descanso</Text>
              )}
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>REPS REALIZADAS</Text>
                <TextInput
                  style={styles.smallInput}
                  value={state.repeticoes_realizadas}
                  onChangeText={(v) => updateField(index, 'repeticoes_realizadas', v)}
                  placeholder={state.item.repeticoes ?? '—'}
                  placeholderTextColor={colors.outline}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>CARGA REALIZADA</Text>
                <TextInput
                  style={styles.smallInput}
                  value={state.carga_realizada}
                  onChangeText={(v) => updateField(index, 'carga_realizada', v)}
                  placeholder={state.item.carga ?? '—'}
                  placeholderTextColor={colors.outline}
                />
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={[shared.primaryButton, styles.finishButton]} onPress={() => setFeedbackVisible(true)}>
            <Text style={shared.primaryButtonText}>Finalizar treino</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={descansoAtivo !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>DESCANSO</Text>
            <Text style={styles.timerValue}>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.skipButton} onPress={pularDescanso}>
              <Text style={styles.skipButtonText}>Pular descanso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={feedbackVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.feedbackCard}>
            <Text style={styles.timerLabel}>COMO FOI O TREINO?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setDificuldade(n)}>
                  <MaterialCommunityIcons
                    name={n <= dificuldade ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starsCaption}>1 = muito fácil · 5 = muito difícil</Text>

            <TextInput
              style={[shared.input, styles.commentInput]}
              value={comentario}
              onChangeText={setComentario}
              placeholder="Algum comentário para o seu personal? (opcional)"
              placeholderTextColor={colors.outline}
              multiline
            />

            <TouchableOpacity
              style={[shared.primaryButton, styles.finishButton]}
              onPress={handleFinalizar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={shared.primaryButtonText}>Concluir</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setFeedbackVisible(false)}>
              <Text style={styles.cancelLinkText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  progressBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  progressText: { ...typography.labelSm, color: colors.primary },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardConcluido: { borderColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exNome: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.onSurface, flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm, marginLeft: 32 },
  metaText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  inputsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginLeft: 32 },
  inputCol: { flex: 1 },
  inputLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, marginBottom: 4, fontSize: 10 },
  smallInput: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: colors.onSurface,
    fontSize: 14,
  },
  finishButton: { marginTop: spacing.md },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  timerCard: { ...shared.card, alignItems: 'center', width: '100%', paddingVertical: spacing.xl },
  timerLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  timerValue: { ...typography.displayLg, fontSize: 56, color: colors.primary, marginVertical: spacing.md },
  skipButton: { marginTop: spacing.sm },
  skipButtonText: { ...typography.labelMd, color: colors.primary },
  feedbackCard: { ...shared.card, width: '100%', alignItems: 'center', paddingVertical: spacing.lg },
  starsRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  starsCaption: { ...typography.labelSm, color: colors.onSurfaceVariant, textTransform: 'none', marginBottom: spacing.md },
  commentInput: { width: '100%', minHeight: 70, textAlignVertical: 'top', marginBottom: spacing.md },
  cancelLink: { marginTop: spacing.sm },
  cancelLinkText: { ...typography.labelMd, color: colors.onSurfaceVariant },
});
