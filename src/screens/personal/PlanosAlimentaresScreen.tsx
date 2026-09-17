import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { PlanoAlimentar } from '../../types/database';
import type { PersonalAlunosStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalAlunosStackParamList, 'PlanosAlimentares'>;

export default function PlanosAlimentaresScreen({ route, navigation }: Props) {
  const { alunoId, alunoNome } = route.params;
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadPlanos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false });
    if (!error) setPlanos((data as PlanoAlimentar[]) ?? []);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadPlanos();
    }, [alunoId])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('PrescreverPlanoAlimentar', { alunoId, alunoNome })}
      >
        <Text style={shared.primaryButtonText}>+ Novo plano alimentar</Text>
      </TouchableOpacity>

      <FlatList
        data={planos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Esse aluno ainda não tem plano alimentar.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('PrescreverPlanoAlimentar', { alunoId, alunoNome, planoId: item.id })
            }
          >
            <Text style={styles.cardName}>{item.nome}</Text>
            <Text style={styles.cardMeta}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  newButton: { ...shared.primaryButton, marginHorizontal: spacing.md, marginTop: spacing.md },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
