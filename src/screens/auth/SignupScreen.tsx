import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import type { Role } from '../../types/database';
import { colors, fonts, typography, spacing, radii, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [role, setRole] = useState<Role>('aluno');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName || !email || !password) {
      Alert.alert('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    let personalId: string | null = null;

    if (role === 'aluno') {
      if (!inviteCode) {
        setLoading(false);
        Alert.alert('Informe o código do seu personal trainer.');
        return;
      }
      const { data: personal, error: lookupError } = await supabase.rpc(
        'find_personal_by_invite_code',
        { code: inviteCode.trim() }
      );
      if (lookupError || !personal || personal.length === 0) {
        setLoading(false);
        Alert.alert('Código inválido', 'Confira o código com seu personal trainer.');
        return;
      }
      personalId = personal[0].id;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          personal_id: personalId,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Não foi possível cadastrar', error.message);
      return;
    }

    Alert.alert(
      'Cadastro realizado!',
      'Se a confirmação de e-mail estiver ativada no projeto, verifique sua caixa de entrada antes de entrar.'
    );
    navigation.navigate('Login');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Consultoria high-performance</Text>

        <View style={styles.roleSwitch}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'aluno' && styles.roleButtonActive]}
            onPress={() => setRole('aluno')}
          >
            <Text style={[styles.roleButtonText, role === 'aluno' && styles.roleButtonTextActive]}>
              Sou Aluno
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'personal' && styles.roleButtonActive]}
            onPress={() => setRole('personal')}
          >
            <Text style={[styles.roleButtonText, role === 'personal' && styles.roleButtonTextActive]}>
              Sou Personal
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={shared.inputLabel}>Nome completo</Text>
        <TextInput
          style={shared.input}
          placeholderTextColor={colors.outline}
          placeholder="Seu nome"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>E-mail</Text>
        <TextInput
          style={shared.input}
          placeholderTextColor={colors.outline}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Senha</Text>
        <TextInput
          style={shared.input}
          placeholderTextColor={colors.outline}
          placeholder="mín. 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {role === 'aluno' && (
          <>
            <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Código do personal trainer</Text>
            <TextInput
              style={shared.input}
              placeholderTextColor={colors.outline}
              placeholder="EX: A1B2C3"
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
            />
          </>
        )}

        <TouchableOpacity
          style={[shared.primaryButton, { marginTop: spacing.xl }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={shared.primaryButtonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, flexGrow: 1 },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center', marginBottom: 4 },
  subtitle: {
    ...typography.labelSm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  roleSwitch: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surfaceContainerLow },
  roleButtonActive: { backgroundColor: colors.primary },
  roleButtonText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  roleButtonTextActive: { color: colors.onPrimary },
  link: {
    ...typography.bodyMd,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
