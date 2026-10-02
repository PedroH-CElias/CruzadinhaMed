/**
 * Tela de cadastro (aberta como modal a partir da Home ou do Login).
 *
 * Pede nome, e-mail, senha e confirmação. As regras de validação espelham as do
 * backend (UserInsertDTO): nome com 3 a 120 caracteres, e-mail válido e senha com
 * 6 a 72 caracteres. Depois de cadastrar, o usuário já entra na conta.
 */
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import AuthScreenLayout from './AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, LEGAL_URLS } from '../services/api';
import { theme } from '../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // limite do BCrypt usado no backend

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  /** Fecha o modal e volta para a tela anterior (Home) como convidado. */
  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  /** Atualiza um campo e limpa o erro dele. */
  const setField = (field) => (text) => {
    setForm((f) => ({ ...f, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  /** Valida o formulário e devolve um objeto { campo: mensagem } com os erros encontrados. */
  function validate() {
    const found = {};
    const name = form.name.trim();
    if (name.length < 3) found.name = 'Informe seu nome (mínimo 3 letras).';
    if (!form.email.trim()) found.email = 'Informe seu e-mail.';
    else if (!EMAIL_REGEX.test(form.email.trim())) found.email = 'E-mail inválido.';
    if (form.password.length < PASSWORD_MIN) {
      found.password = `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
    }
    if (form.confirm !== form.password) found.confirm = 'As senhas não conferem.';
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
      await signUp({ name: form.name, email: form.email, password: form.password });
      close();
    } catch (error) {
      setFormError(
        getErrorMessage(error, {
          409: 'Este e-mail já está cadastrado. Tente entrar na sua conta.',
        })
      );
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Criar conta"
      subtitle="É grátis. Seu progresso fica salvo na sua conta."
      onClose={close}
    >
      <FormInput
        label="Nome"
        value={form.name}
        onChangeText={setField('name')}
        error={errors.name}
        placeholder="Como devemos te chamar?"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={120}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        editable={!loading}
      />

      <FormInput
        ref={emailRef}
        label="E-mail"
        value={form.email}
        onChangeText={setField('email')}
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
        value={form.password}
        onChangeText={setField('password')}
        error={errors.password}
        placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={PASSWORD_MAX}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!loading}
      />

      <FormInput
        ref={confirmRef}
        label="Confirmar senha"
        value={form.confirm}
        onChangeText={setField('confirm')}
        error={errors.confirm}
        placeholder="Repita a senha"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={PASSWORD_MAX}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!loading}
      />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      {/* Aviso legal: ao criar a conta o usuário aceita os Termos e a Política (exigido pelas lojas) */}
      <Text style={styles.legal}>
        Ao criar uma conta, você concorda com os{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(LEGAL_URLS.terms)} accessibilityRole="link">
          Termos de Uso
        </Text>{' '}
        e a{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(LEGAL_URLS.privacy)} accessibilityRole="link">
          Política de Privacidade
        </Text>
        .
      </Text>

      <PrimaryButton title="Criar conta" onPress={handleSubmit} loading={loading} style={styles.submit} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Já tem conta? </Text>
        <Pressable onPress={() => navigation.replace('Login')} disabled={loading} hitSlop={8}>
          <Text style={styles.switchLink}>Entrar</Text>
        </Pressable>
      </View>

      <PrimaryButton title="Continuar como convidado" variant="ghost" onPress={close} disabled={loading} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formError: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  submit: { marginTop: 4 },
  legal: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  legalLink: { color: theme.colors.primary, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  switchText: { color: theme.colors.textMuted, fontSize: 15 },
  switchLink: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
});
