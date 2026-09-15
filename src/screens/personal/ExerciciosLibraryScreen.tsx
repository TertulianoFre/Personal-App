import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Exercicio } from '../../types/database';
import type { PersonalExerciciosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalExerciciosStackParamList, 'ExerciciosLibrary'>;

export default function ExerciciosLibraryScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadExercicios() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .eq('personal_id', profile.id)
      .order('nome');
    if (!error) setExercicios(data as Exercicio[]);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadExercicios();
    }, [profile?.id])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newButton} onPress={() => navigation.navigate('ExercicioForm', {})}>
        <Text style={shared.primaryButtonText}>+ Novo exercício</Text>
      </TouchableOpacity>

      <FlatList
        data={exercicios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadExercicios} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              Cadastre seus exercícios aqui (com link de vídeo do YouTube, por exemplo) para poder
              usá-los na prescrição de treinos.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ExercicioForm', { exercicioId: item.id })}
          >
            <Text style={styles.cardName}>{item.nome}</Text>
            {!!item.grupo_muscular && <Text style={styles.cardMeta}>{item.grupo_muscular}</Text>}
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
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
