/**
 * Tela de login (aberta como modal a partir da Home).
 *
 * Valida os campos localmente antes de chamar a API, mostra o carregamento no botão
 * e exibe mensagens de erro amigáveis. Ao entrar com sucesso, fecha e volta à Home.
 */
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AuthScreenLayout from './AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { theme } from '../theme';

/** Formato básico de e-mail (a validação definitiva é feita no backend). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const passwordRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  /** Fecha o modal e volta para a tela anterior (Home) como convidado. */
  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  /** Valida os campos e devolve um objeto { campo: mensagem } com os erros encontrados. */
  function validate() {
    const found = {};
    if (!email.trim()) found.email = 'Informe seu e-mail.';
    else if (!EMAIL_REGEX.test(email.trim())) found.email = 'E-mail inválido.';
    if (!password) found.password = 'Informe sua senha.';
    return found;
  }

  async function handleSubmit() {
    if (loading) return;
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await signIn(email, password);
      close();
    } catch (error) {
      setFormError(
        getErrorMessage(error, {
          401: 'E-mail ou senha inválidos.',
          429: 'Muitas tentativas de login. Aguarde alguns minutos ou redefina sua senha.',
        })
      );
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Entrar"
      subtitle="Salve seu progresso e continue de onde parou em qualquer aparelho."
      onClose={close}
    >
      <FormInput
        label="E-mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        error={errors.email}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading}
      />

      <FormInput
        ref={passwordRef}
        label="Senha"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        error={errors.password}
        placeholder="Sua senha"
        secure
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!loading}
      />

      <Pressable
        style={styles.forgot}
        onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
        disabled={loading}
        hitSlop={8}
        accessibilityRole="link"
      >
        <Text style={styles.forgotText}>Esqueci minha senha</Text>
      </Pressable>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <PrimaryButton title="Entrar" onPress={handleSubmit} loading={loading} style={styles.submit} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Não tem conta? </Text>
        <Pressable onPress={() => navigation.replace('Register')} disabled={loading} hitSlop={8}>
          <Text style={styles.switchLink}>Criar conta</Text>
        </Pressable>
      </View>

      <PrimaryButton title="Continuar como convidado" variant="ghost" onPress={close} disabled={loading} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 },
  forgotText: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  formError: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  submit: { marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  switchText: { color: theme.colors.textMuted, fontSize: 15 },
  switchLink: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
});
