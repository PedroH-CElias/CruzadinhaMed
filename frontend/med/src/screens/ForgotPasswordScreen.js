/**
 * "Esqueci minha senha" – passo 1: o usuário informa o e-mail e recebe um código.
 *
 * Por segurança o backend responde igual, exista ou não a conta. Por isso a tela
 * sempre avança para o passo 2 (ResetPasswordScreen) depois do envio.
 */
import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import AuthScreenLayout from './AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { forgotPassword, getErrorMessage } from '../services/api';
import { theme } from '../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation, route }) {
  // Se veio do Login, já preenche o e-mail digitado lá
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    setFormError('');
    const trimmed = email.trim();
    if (!trimmed) return setError('Informe seu e-mail.');
    if (!EMAIL_REGEX.test(trimmed)) return setError('E-mail inválido.');

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      // Troca esta tela pela de digitar o código (o "voltar" leva direto ao Login)
      navigation.replace('ResetPassword', { email: trimmed });
    } catch (e) {
      setFormError(getErrorMessage(e));
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Esqueceu a senha?"
      subtitle="Informe o e-mail da sua conta. Vamos enviar um código de 6 dígitos para você criar uma nova senha."
      onClose={() => navigation.goBack()}
    >
      <FormInput
        label="E-mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError('');
        }}
        error={error}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        editable={!loading}
        autoFocus={!email}
      />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <PrimaryButton title="Enviar código" onPress={handleSubmit} loading={loading} />
      <PrimaryButton
        title="Voltar"
        variant="ghost"
        onPress={() => navigation.goBack()}
        disabled={loading}
        style={styles.back}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formError: { color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  back: { marginTop: 8 },
});
