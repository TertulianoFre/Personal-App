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
import type { PersonalExerciciosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalExerciciosStackParamList, 'ExercicioForm'>;

export default function ExercicioFormScreen({ route, navigation }: Props) {
  const { exercicioId } = route.params;
  const { profile } = useAuth();
  const [nome, setNome] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!exercicioId);

  useEffect(() => {
    if (!exercicioId) return;
    (async () => {
      const { data, error } = await supabase.from('exercicios').select('*').eq('id', exercicioId).single();
      if (!error && data) {
        setNome(data.nome);
        setGrupoMuscular(data.grupo_muscular ?? '');
        setVideoUrl(data.video_url ?? '');
        setDescricao(data.descricao ?? '');
      }
      setLoadingData(false);
    })();
  }, [exercicioId]);

  async function handleSave() {
    if (!nome) {
      Alert.alert('Informe o nome do exercício.');
      return;
    }
    setLoading(true);

    const payload = {
      nome,
      grupo_muscular: grupoMuscular || null,
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

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={shared.inputLabel}>Nome do exercício</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Supino reto"
      />

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Grupo muscular</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={grupoMuscular}
        onChangeText={setGrupoMuscular}
        placeholder="Ex: Peito"
      />

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Link do vídeo (YouTube, Vimeo, etc.)</Text>
      <TextInput
        style={shared.input}
        placeholderTextColor={colors.outline}
        value={videoUrl}
        onChangeText={setVideoUrl}
        placeholder="https://youtu.be/..."
        autoCapitalize="none"
      />

      <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Observações / execução</Text>
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

      {exercicioId && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Remover exercício</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 },
  deleteButton: { alignItems: 'center', marginTop: spacing.md },
  deleteButtonText: { ...typography.labelMd, color: colors.error },
});
