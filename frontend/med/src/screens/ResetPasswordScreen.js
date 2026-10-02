/**
 * "Esqueci minha senha" – passo 2: o usuário digita o código recebido por e-mail e a
 * nova senha. Com sucesso, o app já entra na conta e volta para a Home.
 *
 * Regras (espelham o backend):
 * - o código tem 6 dígitos, vale 15 minutos e aceita 5 tentativas;
 * - um novo código só pode ser pedido a cada 60 segundos;
 * - a nova senha tem de 6 a 72 caracteres.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AuthScreenLayout from './AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, getErrorMessage } from '../services/api';
import { theme } from '../theme';

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;
const RESEND_SECONDS = 60;

export default function ResetPasswordScreen({ navigation, route }) {
  const { email } = route.params;
  const { resetPassword } = useAuth();
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [form, setForm] = useState({ code: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  // Contagem regressiva para liberar o "Reenviar código"
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /** Atualiza um campo e limpa o erro dele. O código aceita só números. */
  const setField = (field) => (text) => {
    const value = field === 'code' ? text.replace(/\D/g, '').slice(0, 6) : text;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate() {
    const found = {};
    if (form.code.length !== 6) found.code = 'Digite os 6 números do código.';
    if (form.password.length < PASSWORD_MIN) {
      found.password = `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
    }
    if (form.confirm !== form.password) found.confirm = 'As senhas não conferem.';
    return found;
  }

  async function handleSubmit() {
    if (loading) return;
    setFormError('');
    setInfo('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code: form.code, newPassword: form.password });
      // Fecha todos os modais de autenticação e volta para a Home, já logado
      navigation.popToTop();
    } catch (error) {
      setFormError(
        getErrorMessage(error, {
          422: 'Código inválido ou expirado. Confira o código ou peça um novo.',
        })
      );
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setFormError('');
    try {
      await forgotPassword(email);
      setInfo('Enviamos um novo código. Use sempre o mais recente.');
      setForm((f) => ({ ...f, code: '' }));
      setResendIn(RESEND_SECONDS);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <AuthScreenLayout
      title="Criar nova senha"
      subtitle={`Se existir uma conta com ${email}, enviamos um código de 6 dígitos. Confira também a caixa de spam.`}
      onClose={() => navigation.goBack()}
    >
      <FormInput
        label="Código"
        value={form.code}
        onChangeText={setField('code')}
        error={errors.code}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading}
        autoFocus
      />

      <FormInput
        ref={passwordRef}
        label="Nova senha"
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
        label="Confirmar nova senha"
        value={form.confirm}
        onChangeText={setField('confirm')}
        error={errors.confirm}
        placeholder="Repita a nova senha"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={PASSWORD_MAX}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!loading}
      />

      {info ? <Text style={styles.info}>{info}</Text> : null}
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <PrimaryButton title="Salvar nova senha" onPress={handleSubmit} loading={loading} />

      <View style={styles.resendRow}>
        {resendIn > 0 ? (
          <Text style={styles.resendWait}>Reenviar código em {resendIn}s</Text>
        ) : (
          <Pressable onPress={handleResend} disabled={loading} hitSlop={8} accessibilityRole="button">
            <Text style={styles.resendLink}>Reenviar código</Text>
          </Pressable>
        )}
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  info: { color: theme.colors.success, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  formError: { color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  resendRow: { alignItems: 'center', marginTop: 20 },
  resendWait: { color: theme.colors.textMuted, fontSize: 14 },
  resendLink: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
});
