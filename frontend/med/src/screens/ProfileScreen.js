/**
 * Tela "Meus dados" (aberta em Minha conta).
 *
 * Regra atual: o usuário pode alterar apenas o NOME e a SENHA.
 * - Nome: PATCH /users/me
 * - Senha: PATCH /users/me/password (pede a senha atual; senha errada = 422)
 * O e-mail é exibido só para consulta: trocar o e-mail exigiria confirmar o novo endereço.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { theme } from '../theme';

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // limite do BCrypt usado no backend

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateProfile, changePassword } = useAuth();

  // ---- Nome
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [nameMessage, setNameMessage] = useState({ text: '', ok: false });
  const [savingName, setSavingName] = useState(false);

  // ---- Senha
  const newRef = useRef(null);
  const confirmRef = useRef(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState({ text: '', ok: false });
  const [savingPassword, setSavingPassword] = useState(false);

  // Se a sessão acabar, volta para a Home
  useEffect(() => {
    if (!isAuthenticated) navigation.popToTop();
  }, [isAuthenticated, navigation]);

  if (!user) return <View style={styles.container} />;

  const nameChanged = name.trim() !== (user.name ?? '').trim();

  async function handleSaveName() {
    if (savingName) return;
    setNameMessage({ text: '', ok: false });
    const trimmed = name.trim();
    if (trimmed.length < 3) return setNameError('Informe seu nome (mínimo 3 letras).');

    setSavingName(true);
    try {
      await updateProfile({ name: trimmed });
      setName(trimmed);
      setNameMessage({ text: 'Nome atualizado.', ok: true });
    } catch (error) {
      setNameMessage({ text: getErrorMessage(error), ok: false });
    } finally {
      setSavingName(false);
    }
  }

  /** Atualiza um campo de senha e limpa o erro dele. */
  const setPasswordField = (field) => (text) => {
    setPasswords((p) => ({ ...p, [field]: text }));
    if (passwordErrors[field]) setPasswordErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleChangePassword() {
    if (savingPassword) return;
    setPasswordMessage({ text: '', ok: false });

    const found = {};
    if (!passwords.current) found.current = 'Informe sua senha atual.';
    if (passwords.next.length < PASSWORD_MIN) {
      found.next = `A nova senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
    }
    if (passwords.confirm !== passwords.next) found.confirm = 'As senhas não conferem.';
    setPasswordErrors(found);
    if (Object.keys(found).length > 0) return;

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordMessage({ text: 'Senha alterada com sucesso.', ok: true });
    } catch (error) {
      setPasswordMessage({ text: getErrorMessage(error, { 422: 'Senha atual incorreta.' }), ok: false });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Meus dados" backLabel="Minha conta" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dados pessoais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados pessoais</Text>

          <FormInput
            label="Nome"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
              if (nameMessage.text) setNameMessage({ text: '', ok: false });
            }}
            error={nameError}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={120}
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            editable={!savingName}
          />

          {/* E-mail apenas para consulta */}
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyText} numberOfLines={1}>{user.email}</Text>
          </View>
          <Text style={styles.hint}>O e-mail da conta não pode ser alterado.</Text>

          {nameMessage.text ? (
            <Text style={[styles.message, nameMessage.ok ? styles.ok : styles.fail]}>{nameMessage.text}</Text>
          ) : null}

          <PrimaryButton
            title="Salvar nome"
            onPress={handleSaveName}
            loading={savingName}
            disabled={!nameChanged}
          />
        </View>

        {/* Alterar senha */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alterar senha</Text>

          <FormInput
            label="Senha atual"
            value={passwords.current}
            onChangeText={setPasswordField('current')}
            error={passwordErrors.current}
            secure
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
            editable={!savingPassword}
          />
          <FormInput
            ref={newRef}
            label="Nova senha"
            value={passwords.next}
            onChangeText={setPasswordField('next')}
            error={passwordErrors.next}
            placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!savingPassword}
          />
          <FormInput
            ref={confirmRef}
            label="Confirmar nova senha"
            value={passwords.confirm}
            onChangeText={setPasswordField('confirm')}
            error={passwordErrors.confirm}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX}
            returnKeyType="go"
            onSubmitEditing={handleChangePassword}
            editable={!savingPassword}
          />

          {passwordMessage.text ? (
            <Text style={[styles.message, passwordMessage.ok ? styles.ok : styles.fail]}>
              {passwordMessage.text}
            </Text>
          ) : null}

          <PrimaryButton title="Alterar senha" onPress={handleChangePassword} loading={savingPassword} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '900', marginBottom: 14 },
  label: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '700', marginBottom: 6 },
  readOnly: {
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  readOnlyText: { color: theme.colors.textMuted, fontSize: 16 },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginTop: 6, marginBottom: 16 },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  ok: { color: theme.colors.solved },
  fail: { color: theme.colors.error },
});
