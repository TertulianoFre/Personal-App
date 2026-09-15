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
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { colors, fonts, typography, spacing, shared } from '../../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Não foi possível entrar', error.message);
    }
    // Se der certo, o AuthContext detecta a sessão e troca de tela sozinho.
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoWrap}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>CN PERSONAL</Text>
      <Text style={styles.subtitle}>Treinamento personalizado para resultados reais</Text>

      <View style={styles.card}>
        <Text style={shared.inputLabel}>E-mail</Text>
        <TextInput
          style={[shared.input, styles.input]}
          placeholder="seu@email.com"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[shared.inputLabel, { marginTop: spacing.md }]}>Senha</Text>
        <TextInput
          style={[shared.input, styles.input]}
          placeholder="••••••••"
          placeholderTextColor={colors.outline}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgot}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={shared.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={shared.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  logoWrap: { alignItems: 'center', marginBottom: spacing.md },
  logo: { width: 84, height: 84 },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    ...shared.card,
    padding: spacing.lg,
  },
  input: {
    marginBottom: 0,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.lg },
  forgot: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant },
  link: {
    ...typography.bodyMd,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontFamily: fonts.bodyMedium,
  },
});
