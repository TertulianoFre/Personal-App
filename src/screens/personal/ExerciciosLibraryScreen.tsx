import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Exercicio } from '../../types/database';
import type { PersonalExerciciosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalExerciciosStackParamList, 'ExerciciosLibrary'>;

export default function ExerciciosLibraryScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  async function loadExercicios() {
    if (!profile) return;
    setLoading(true);
    // Biblioteca base (personal_id nulo) + exercícios próprios do personal.
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .or(`personal_id.eq.${profile.id},personal_id.is.null`)
      .order('nome');
    if (!error) setExercicios((data as Exercicio[]) ?? []);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadExercicios();
    }, [profile?.id])
  );

  const filtrados = useMemo(() => {
    if (!busca.trim()) return exercicios;
    const termo = busca.trim().toLowerCase();
    return exercicios.filter(
      (e) =>
        e.nome.toLowerCase().includes(termo) ||
        (e.grupamento_principal ?? '').toLowerCase().includes(termo)
    );
  }, [exercicios, busca]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newButton} onPress={() => navigation.navigate('ExercicioForm', {})}>
        <Text style={shared.primaryButtonText}>+ Novo exercício</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou grupo muscular..."
        placeholderTextColor={colors.outline}
        value={busca}
        onChangeText={setBusca}
      />

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadExercicios} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              {busca ? 'Nenhum exercício encontrado.' : 'Nenhum exercício disponível ainda.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ExercicioForm', { exercicioId: item.id })}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardName}>{item.nome}</Text>
              {!item.personal_id && (
                <View style={styles.baseTag}>
                  <Text style={styles.baseTagText}>base</Text>
                </View>
              )}
            </View>
            {!!item.grupamento_principal && (
              <Text style={styles.cardMeta}>
                {item.grupamento_principal}
                {item.grupamentos_secundarios.length > 0 && ` + ${item.grupamentos_secundarios.join(', ')}`}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  newButton: {
    ...shared.primaryButton,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  search: {
    ...shared.input,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface, flex: 1 },
  baseTag: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  baseTagText: { ...typography.labelSm, color: colors.primary, fontSize: 9 },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4, textTransform: 'none' },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
