import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Mensagem } from '../../types/database';
import type { PersonalMensagensStackParamList } from '../../navigation/PersonalTabs';
import { colors, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<PersonalMensagensStackParamList, 'ConversasList'>;

type Conversa = {
  alunoId: string;
  nome: string;
  ultimaMensagem: string | null;
  ultimaData: string | null;
  naoLidas: number;
};

export default function ConversasListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: alunos } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('personal_id', profile.id)
      .eq('role', 'aluno')
      .order('full_name');

    const alunoIds = (alunos ?? []).map((a) => a.id);
    let mensagensPorAluno = new Map<string, Mensagem[]>();

    if (alunoIds.length > 0) {
      const { data: mensagens } = await supabase
        .from('mensagens')
        .select('*')
        .in('aluno_id', alunoIds)
        .order('created_at', { ascending: true });

      for (const m of (mensagens as Mensagem[]) ?? []) {
        const lista = mensagensPorAluno.get(m.aluno_id) ?? [];
        lista.push(m);
        mensagensPorAluno.set(m.aluno_id, lista);
      }
    }

    const lista: Conversa[] = (alunos ?? []).map((a) => {
      const msgs = mensagensPorAluno.get(a.id) ?? [];
      const ultima = msgs[msgs.length - 1];
      const naoLidas = msgs.filter((m) => !m.lida && m.remetente_id !== profile.id).length;
      return {
        alunoId: a.id,
        nome: a.full_name,
        ultimaMensagem: ultima?.conteudo ?? null,
        ultimaData: ultima?.created_at ?? null,
        naoLidas,
      };
    });

    lista.sort((a, b) => {
      if (!a.ultimaData) return 1;
      if (!b.ultimaData) return -1;
      return b.ultimaData.localeCompare(a.ultimaData);
    });

    setConversas(lista);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversas}
        keyExtractor={(item) => item.alunoId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Você ainda não tem alunos vinculados.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', { alunoId: item.alunoId, alunoNome: item.nome })}
          >
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardPreview} numberOfLines={1}>
                {item.ultimaMensagem ?? 'Nenhuma mensagem ainda'}
              </Text>
            </View>
            {item.naoLidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.naoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { ...shared.card, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  cardTextWrap: { flex: 1 },
  cardNome: { ...typography.bodyMd, fontFamily: 'Inter_600SemiBold', color: colors.onSurface },
  cardPreview: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: 4, textTransform: 'none' },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  badgeText: { ...typography.labelSm, color: colors.onPrimary, fontSize: 11, textTransform: 'none' },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
