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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { GRUPOS_MUSCULARES } from '../../types/database';
import type { PersonalExerciciosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';
import ExercicioVideoModal from '../../components/ExercicioVideoModal';

type Props = NativeStackScreenProps<PersonalExerciciosStackParamList, 'ExercicioForm'>;

export default function ExercicioFormScreen({ route, navigation }: Props) {
  const { exercicioId } = route.params;
  const { profile } = useAuth();
  const [nome, setNome] = useState('');
  const [principal, setPrincipal] = useState<string | null>(null);
  const [secundarios, setSecundarios] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [descricao, setDescricao] = useState('');
  const [donoId, setDonoId] = useState<string | null | undefined>(undefined); // undefined = exercício novo
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!exercicioId);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    if (!exercicioId) return;
    (async () => {
      const { data, error } = await supabase.from('exercicios').select('*').eq('id', exercicioId).single();
      if (!error && data) {
        setNome(data.nome);
        setPrincipal(data.grupamento_principal);
        setSecundarios(data.grupamentos_secundarios ?? []);
        setVideoUrl(data.video_url ?? '');
        setDescricao(data.descricao ?? '');
        setDonoId(data.personal_id);
      }
      setLoadingData(false);
    })();
  }, [exercicioId]);

  function toggleSecundario(grupo: string) {
    setSecundarios((prev) => (prev.includes(grupo) ? prev.filter((g) => g !== grupo) : [...prev, grupo]));
  }

  function escolherPrincipal(grupo: string) {
    setPrincipal((prev) => (prev === grupo ? null : grupo));
    setSecundarios((prev) => prev.filter((g) => g !== grupo));
  }

  async function handleSave() {
    if (!nome) {
      Alert.alert('Informe o nome do exercício.');
      return;
    }
    setLoading(true);

    const payload = {
      nome,
      grupamento_principal: principal,
      grupamentos_secundarios: secundarios,
      video_url: videoUrl || null,
      descricao: descricao || null,
    };

    const { error } = exercicioId
      ? await supabase.from('exercicios').update(payload).eq('id', exercicioId)
      : await supabase.from('exercicios').insert({ ...payload, personal_id: profile!.id });

    setLoading(false);

    if (error) {
      Alert.alert('Erro ao salvar', error.message);
      return;
    }
    navigation.goBack();
  }

  async function handleDelete() {
    if (!exercicioId) return;
    Alert.alert('Remover exercício', 'Tem certeza? Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('exercicios').delete().eq('id', exercicioId);
          if (error) {
            Alert.alert('Erro ao remover', error.message);
            return;
          }
          navigation.goBack();
        },
      },
    ]);
  }

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const ehBiblioteca = donoId === null;
  const podeRemover = !!exercicioId && donoId === profile?.id;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {ehBiblioteca && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Exercício da biblioteca base (compartilhado com todos os personals)</Text>
        </View>
      )}

      <Text style={shared.inputLabel}>Nome do exercício</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Supino reto"
      />

      <Text style={[shared.inputLabel, styles.spacedLabel]}>Grupamento principal (volume direto)</Text>
      <View style={styles.chipsWrap}>
        {GRUPOS_MUSCULARES.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, principal === g && styles.chipActive]}
            onPress={() => escolherPrincipal(g)}
          >
            <Text style={[styles.chipText, principal === g && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[shared.inputLabel, styles.spacedLabel]}>Grupamentos secundários (volume indireto)</Text>
      <View style={styles.chipsWrap}>
        {GRUPOS_MUSCULARES.filter((g) => g !== principal).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, secundarios.includes(g) && styles.chipActiveSecundario]}
            onPress={() => toggleSecundario(g)}
          >
            <Text style={[styles.chipText, secundarios.includes(g) && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[shared.inputLabel, styles.spacedLabel]}>Link do vídeo (YouTube)</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={videoUrl}
        onChangeText={setVideoUrl}
        placeholder="https://youtu.be/..."
        autoCapitalize="none"
      />
      {!!videoUrl && (
        <TouchableOpacity style={styles.previewButton} onPress={() => setPreviewVisible(true)}>
          <Text style={styles.previewButtonText}>▶ Pré-visualizar vídeo</Text>
        </TouchableOpacity>
      )}

      <Text style={[shared.inputLabel, styles.spacedLabel]}>Observações / execução</Text>
      <TextInput
        style={[shared.input, styles.textArea]}
        placeholderTextColor={colors.outline}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Dicas de execução, cuidados, etc."
        multiline
      />

      <TouchableOpacity style={[shared.primaryButton, { marginTop: spacing.xl }]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={shared.primaryButtonText}>Salvar</Text>}
      </TouchableOpacity>

      {podeRemover && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Remover exercício</Text>
        </TouchableOpacity>
      )}

      <ExercicioVideoModal
        visible={previewVisible}
        videoUrl={videoUrl}
        exercicioNome={nome || 'Pré-visualização'}
        onClose={() => setPreviewVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  spacedLabel: { marginTop: spacing.md },
  badge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  badgeText: { ...typography.labelSm, color: colors.primary, textTransform: 'none' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipActiveSecundario: { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.primary },
  chipText: { ...typography.labelSm, color: colors.onSurfaceVariant, textTransform: 'none' },
  chipTextActive: { color: colors.onPrimary, fontFamily: 'Inter_600SemiBold' },
  previewButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  previewButtonText: { ...typography.labelMd, color: colors.primary },
  textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 },
  deleteButton: { alignItems: 'center', marginTop: spacing.md },
  deleteButtonText: { ...typography.labelMd, color: colors.error },
});
