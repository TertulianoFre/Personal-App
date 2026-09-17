import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Mensagem } from '../../types/database';
import { colors, typography, spacing, radii } from '../../theme/theme';

type Props = {
  // ID do aluno cujo é essa conversa (é sempre o mesmo aluno_id nas mensagens,
  // independente de quem — aluno ou personal — está vendo a tela).
  alunoId: string;
  // Deslocamento extra pro teclado não cobrir o input — telas com header (stack) precisam
  // de mais espaço do que a aba do aluno, que não tem header.
  keyboardOffset?: number;
};

export default function ChatScreen({ alunoId, keyboardOffset = 0 }: Props) {
  const { profile } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<FlatList>(null);

  const marcarComoLidas = useCallback(async () => {
    await supabase.rpc('marcar_mensagens_como_lidas', { p_aluno_id: alunoId });
  }, [alunoId]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data } = await supabase
        .from('mensagens')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: true });
      if (ativo) {
        setMensagens((data as Mensagem[]) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`mensagens-aluno-${alunoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `aluno_id=eq.${alunoId}` },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((prev) => (prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]));
          if (nova.remetente_id !== profile?.id) {
            marcarComoLidas();
          }
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [alunoId, profile?.id, marcarComoLidas]);

  useFocusEffect(
    useCallback(() => {
      marcarComoLidas();
    }, [marcarComoLidas])
  );

  async function handleEnviar() {
    const conteudo = texto.trim();
    if (!conteudo || !profile) return;
    setTexto('');
    setEnviando(true);
    const { error } = await supabase.from('mensagens').insert({
      aluno_id: alunoId,
      remetente_id: profile.id,
      conteudo,
    });
    setEnviando(false);
    if (error) {
      setTexto(conteudo);
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
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        ref={listRef}
        data={mensagens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma mensagem ainda. Diga oi! 👋</Text>
        }
        renderItem={({ item }) => {
          const propria = item.remetente_id === profile?.id;
          return (
            <View style={[styles.bubbleRow, propria && styles.bubbleRowPropria]}>
              <View style={[styles.bubble, propria ? styles.bubblePropria : styles.bubbleOutra]}>
                <Text style={[styles.bubbleText, propria && styles.bubbleTextPropria]}>{item.conteudo}</Text>
                <Text style={[styles.bubbleHora, propria && styles.bubbleHoraPropria]}>
                  {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor={colors.outline}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleEnviar} disabled={!texto.trim() || enviando}>
          <MaterialCommunityIcons name="send" size={20} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { padding: spacing.md, flexGrow: 1 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  bubbleRowPropria: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: 10 },
  bubbleOutra: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderBottomLeftRadius: 2,
  },
  bubblePropria: { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  bubbleText: { ...typography.bodyMd, fontSize: 15, color: colors.onSurface },
  bubbleTextPropria: { color: colors.onPrimary },
  bubbleHora: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4, textTransform: 'none', textAlign: 'right' },
  bubbleHoraPropria: { color: colors.onPrimary, opacity: 0.7 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.onSurface,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
