import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { AlunoPerfilStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoPerfilStackParamList, 'NovaAvaliacao'>;

async function uploadFoto(uri: string, alunoId: string): Promise<string> {
  const file = new File(uri);
  const buffer = await file.arrayBuffer();
  const path = `${alunoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from('evolucao-fotos').upload(path, buffer, {
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  return path;
}

export default function NovaAvaliacaoScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [pesoKg, setPesoKg] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [braco, setBraco] = useState('');
  const [coxa, setCoxa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function escolherFotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para continuar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 4 - fotos.length,
    });

    if (!result.canceled) {
      setFotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
    }
  }

  function removerFoto(uri: string) {
    setFotos((prev) => prev.filter((f) => f !== uri));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    try {
      const fotoPaths = await Promise.all(fotos.map((uri) => uploadFoto(uri, profile.id)));

      const { error } = await supabase.from('avaliacoes_fisicas').insert({
        aluno_id: profile.id,
        data: new Date().toISOString().slice(0, 10),
        peso_kg: pesoKg ? parseFloat(pesoKg.replace(',', '.')) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : null,
        medida_cintura_cm: cintura ? parseFloat(cintura.replace(',', '.')) : null,
        medida_quadril_cm: quadril ? parseFloat(quadril.replace(',', '.')) : null,
        medida_braco_cm: braco ? parseFloat(braco.replace(',', '.')) : null,
        medida_coxa_cm: coxa ? parseFloat(coxa.replace(',', '.')) : null,
        fotos: fotoPaths,
        observacoes: observacoes || null,
      });

      if (error) throw error;

      Alert.alert('Avaliação salva', 'Sua evolução foi registrada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={shared.inputLabel}>PESO (KG)</Text>
      <TextInput
        style={shared.input}
        keyboardType="decimal-pad"
        value={pesoKg}
        onChangeText={setPesoKg}
        placeholder="Ex: 70.5"
        placeholderTextColor={colors.outline}
      />

      <Text style={[shared.inputLabel, styles.spacedLabel]}>% DE GORDURA</Text>
      <TextInput
        style={shared.input}
        keyboardType="decimal-pad"
        value={percentualGordura}
        onChangeText={setPercentualGordura}
        placeholder="Opcional"
        placeholderTextColor={colors.outline}
      />

      <Text style={[styles.sectionTitle]}>Medidas (cm)</Text>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={shared.inputLabel}>CINTURA</Text>
          <TextInput style={shared.input} keyboardType="decimal-pad" value={cintura} onChangeText={setCintura} placeholderTextColor={colors.outline} />
        </View>
        <View style={styles.rowItem}>
          <Text style={shared.inputLabel}>QUADRIL</Text>
          <TextInput style={shared.input} keyboardType="decimal-pad" value={quadril} onChangeText={setQuadril} placeholderTextColor={colors.outline} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={shared.inputLabel}>BRAÇO</Text>
          <TextInput style={shared.input} keyboardType="decimal-pad" value={braco} onChangeText={setBraco} placeholderTextColor={colors.outline} />
        </View>
        <View style={styles.rowItem}>
          <Text style={shared.inputLabel}>COXA</Text>
          <TextInput style={shared.input} keyboardType="decimal-pad" value={coxa} onChangeText={setCoxa} placeholderTextColor={colors.outline} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Fotos</Text>
      <View style={styles.fotosRow}>
        {fotos.map((uri) => (
          <View key={uri} style={styles.fotoWrap}>
            <Image source={{ uri }} style={styles.foto} />
            <TouchableOpacity style={styles.removeFoto} onPress={() => removerFoto(uri)}>
              <MaterialCommunityIcons name="close" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        {fotos.length < 4 && (
          <TouchableOpacity style={styles.addFoto} onPress={escolherFotos}>
            <MaterialCommunityIcons name="camera-plus-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[shared.inputLabel, styles.spacedLabel]}>OBSERVAÇÕES</Text>
      <TextInput
        style={[shared.input, styles.textArea]}
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Como você está se sentindo?"
        placeholderTextColor={colors.outline}
        multiline
      />

      <TouchableOpacity style={[shared.primaryButton, styles.saveButton]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={shared.primaryButtonText}>Salvar avaliação</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  spacedLabel: { marginTop: spacing.md },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowItem: { flex: 1 },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fotoWrap: { position: 'relative' },
  foto: { width: 76, height: 76, borderRadius: radii.md, borderWidth: 1, borderColor: colors.outlineVariant },
  removeFoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: radii.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFoto: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: { marginTop: spacing.xl },
});
