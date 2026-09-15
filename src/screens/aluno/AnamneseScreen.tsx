import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Anamnese } from '../../types/database';
import { NIVEIS_EXPERIENCIA, OBJETIVOS } from '../../types/database';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

const DIAS_OPCOES = [1, 2, 3, 4, 5, 6, 7];

export default function AnamneseScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [idade, setIdade] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [nivelExperiencia, setNivelExperiencia] = useState<string | null>(null);
  const [diasDisponiveis, setDiasDisponiveis] = useState<number | null>(null);
  const [restricoesAlimentares, setRestricoesAlimentares] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [possuiLesao, setPossuiLesao] = useState(false);
  const [descricaoLesao, setDescricaoLesao] = useState('');
  const [possuiCondicaoMedica, setPossuiCondicaoMedica] = useState(false);
  const [descricaoCondicaoMedica, setDescricaoCondicaoMedica] = useState('');
  const [usaMedicamento, setUsaMedicamento] = useState(false);
  const [descricaoMedicamento, setDescricaoMedicamento] = useState('');
  const [liberadoMedico, setLiberadoMedico] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('anamneses')
        .select('*')
        .eq('aluno_id', profile.id)
        .maybeSingle();

      if (data) {
        const a = data as Anamnese;
        setIdade(a.idade?.toString() ?? '');
        setAlturaCm(a.altura_cm?.toString() ?? '');
        setPesoKg(a.peso_kg?.toString() ?? '');
        setObjetivo(a.objetivo);
        setNivelExperiencia(a.nivel_experiencia);
        setDiasDisponiveis(a.dias_disponiveis_semana);
        setRestricoesAlimentares(a.restricoes_alimentares ?? '');
        setObservacoes(a.observacoes ?? '');
        setPossuiLesao(a.possui_lesao);
        setDescricaoLesao(a.descricao_lesao ?? '');
        setPossuiCondicaoMedica(a.possui_condicao_medica);
        setDescricaoCondicaoMedica(a.descricao_condicao_medica ?? '');
        setUsaMedicamento(a.usa_medicamento);
        setDescricaoMedicamento(a.descricao_medicamento ?? '');
        setLiberadoMedico(!!a.liberado_medico);
      }
      setLoading(false);
    })();
  }, [profile?.id]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const payload = {
      aluno_id: profile.id,
      idade: idade ? parseInt(idade, 10) : null,
      altura_cm: alturaCm ? parseInt(alturaCm, 10) : null,
      peso_kg: pesoKg ? parseFloat(pesoKg.replace(',', '.')) : null,
      objetivo,
      nivel_experiencia: nivelExperiencia,
      dias_disponiveis_semana: diasDisponiveis,
      restricoes_alimentares: restricoesAlimentares || null,
      observacoes: observacoes || null,
      possui_lesao: possuiLesao,
      descricao_lesao: possuiLesao ? descricaoLesao || null : null,
      possui_condicao_medica: possuiCondicaoMedica,
      descricao_condicao_medica: possuiCondicaoMedica ? descricaoCondicaoMedica || null : null,
      usa_medicamento: usaMedicamento,
      descricao_medicamento: usaMedicamento ? descricaoMedicamento || null : null,
      liberado_medico: liberadoMedico,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('anamneses').upsert(payload, { onConflict: 'aluno_id' });
    setSaving(false);

    if (error) {
      Alert.alert('Erro ao salvar', error.message);
    } else {
      Alert.alert('Anamnese salva', 'Suas informações foram atualizadas com sucesso.');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados gerais</Text>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={shared.inputLabel}>IDADE</Text>
            <TextInput
              style={shared.input}
              keyboardType="number-pad"
              value={idade}
              onChangeText={setIdade}
              placeholder="Anos"
              placeholderTextColor={colors.outline}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={shared.inputLabel}>ALTURA (CM)</Text>
            <TextInput
              style={shared.input}
              keyboardType="number-pad"
              value={alturaCm}
              onChangeText={setAlturaCm}
              placeholder="Ex: 175"
              placeholderTextColor={colors.outline}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={shared.inputLabel}>PESO (KG)</Text>
            <TextInput
              style={shared.input}
              keyboardType="decimal-pad"
              value={pesoKg}
              onChangeText={setPesoKg}
              placeholder="Ex: 70"
              placeholderTextColor={colors.outline}
            />
          </View>
        </View>

        <Text style={shared.inputLabel}>OBJETIVO PRINCIPAL</Text>
        <View style={styles.chipsWrap}>
          {OBJETIVOS.map((op) => (
            <TouchableOpacity
              key={op}
              style={[styles.chip, objetivo === op && styles.chipActive]}
              onPress={() => setObjetivo(op)}
            >
              <Text style={[styles.chipText, objetivo === op && styles.chipTextActive]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={shared.inputLabel}>NÍVEL DE EXPERIÊNCIA</Text>
        <View style={styles.chipsWrap}>
          {NIVEIS_EXPERIENCIA.map((op) => (
            <TouchableOpacity
              key={op}
              style={[styles.chip, nivelExperiencia === op && styles.chipActive]}
              onPress={() => setNivelExperiencia(op)}
            >
              <Text style={[styles.chipText, nivelExperiencia === op && styles.chipTextActive]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={shared.inputLabel}>DIAS DISPONÍVEIS POR SEMANA</Text>
        <View style={styles.chipsWrap}>
          {DIAS_OPCOES.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chipSmall, diasDisponiveis === n && styles.chipActive]}
              onPress={() => setDiasDisponiveis(n)}
            >
              <Text style={[styles.chipText, diasDisponiveis === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={shared.inputLabel}>RESTRIÇÕES ALIMENTARES</Text>
        <TextInput
          style={[shared.input, styles.textArea]}
          value={restricoesAlimentares}
          onChangeText={setRestricoesAlimentares}
          placeholder="Ex: intolerância à lactose, vegetariano..."
          placeholderTextColor={colors.outline}
          multiline
        />

        <Text style={styles.sectionTitle}>Saúde</Text>

        <ToggleRow
          label="Possui alguma lesão?"
          value={possuiLesao}
          onValueChange={setPossuiLesao}
        />
        {possuiLesao && (
          <TextInput
            style={[shared.input, styles.textArea, styles.conditionalInput]}
            value={descricaoLesao}
            onChangeText={setDescricaoLesao}
            placeholder="Descreva a lesão"
            placeholderTextColor={colors.outline}
            multiline
          />
        )}

        <ToggleRow
          label="Possui condição médica?"
          value={possuiCondicaoMedica}
          onValueChange={setPossuiCondicaoMedica}
        />
        {possuiCondicaoMedica && (
          <TextInput
            style={[shared.input, styles.textArea, styles.conditionalInput]}
            value={descricaoCondicaoMedica}
            onChangeText={setDescricaoCondicaoMedica}
            placeholder="Descreva a condição"
            placeholderTextColor={colors.outline}
            multiline
          />
        )}

        <ToggleRow
          label="Usa algum medicamento?"
          value={usaMedicamento}
          onValueChange={setUsaMedicamento}
        />
        {usaMedicamento && (
          <TextInput
            style={[shared.input, styles.textArea, styles.conditionalInput]}
            value={descricaoMedicamento}
            onChangeText={setDescricaoMedicamento}
            placeholder="Quais medicamentos"
            placeholderTextColor={colors.outline}
            multiline
          />
        )}

        <ToggleRow
          label="Liberado pelo médico para treinar?"
          value={liberadoMedico}
          onValueChange={setLiberadoMedico}
        />

        <Text style={shared.inputLabel}>OBSERVAÇÕES</Text>
        <TextInput
          style={[shared.input, styles.textArea]}
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Alguma outra informação relevante?"
          placeholderTextColor={colors.outline}
          multiline
        />

        <TouchableOpacity
          style={[shared.primaryButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={shared.primaryButtonText}>Salvar anamnese</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
        thumbColor={value ? colors.primary : colors.outline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowItem: { flex: 1 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipSmall: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.labelSm, color: colors.onSurfaceVariant, textTransform: 'none' },
  chipTextActive: { color: colors.onPrimary, fontFamily: 'Inter_600SemiBold' },
  textArea: { minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md },
  conditionalInput: { marginTop: -spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleLabel: { ...typography.bodyMd, fontSize: 15, color: colors.onSurface, flex: 1, marginRight: spacing.sm },
  saveButton: { marginTop: spacing.lg },
});
