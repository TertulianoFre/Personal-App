import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { PlanoAlimentar } from '../../types/database';
import type { AlunoDietaStackParamList } from '../../navigation/AlunoTabs';
import { colors, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AlunoDietaStackParamList, 'MeusPlanos'>;

export default function MeusPlanosScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadPlanos() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('aluno_id', profile.id)
      .order('ativo', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) setPlanos((data as PlanoAlimentar[]) ?? []);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadPlanos();
    }, [profile?.id])
  );

  if (!loading && planos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum plano alimentar ainda</Text>
        <Text style={styles.emptyText}>
          Assim que seu personal montar um plano alimentar pra você, ele aparece aqui.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={planos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} tintColor={colors.primary} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('PlanoDetail', { planoId: item.id, planoNome: item.nome })}
        >
          <Text style={styles.cardName}>{item.nome}</Text>
          <Text style={styles.cardMeta}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm },
  cardName: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  emptyTitle: { ...typography.headlineSm, color: colors.onSurface, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
});
