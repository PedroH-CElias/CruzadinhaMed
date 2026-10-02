/**
 * Tela "Minha conta" (aberta ao tocar no "Olá, {nome}" da Home).
 *
 * Mostra os dados do usuário e permite sair ou excluir a conta.
 * A exclusão é exigida pela Apple (regra 5.1.1(v)) e pelo Google Play: precisa estar
 * disponível dentro do app. Ela pede a senha como confirmação e é definitiva.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { theme } from '../theme';

export default function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut, deleteAccount } = useAuth();

  // Painel de confirmação da exclusão (fica escondido até o usuário pedir)
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Se a sessão acabar (logout, exclusão ou expiração), volta para a Home
  useEffect(() => {
    if (!isAuthenticated) navigation.popToTop();
  }, [isAuthenticated, navigation]);

  if (!user) return <View style={styles.container} />;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  function cancelDelete() {
    setConfirming(false);
    setPassword('');
    setPasswordError('');
    setFormError('');
  }

  async function handleDelete() {
    if (deleting) return;
    setFormError('');
    if (!password) return setPasswordError('Digite sua senha para confirmar.');

    setDeleting(true);
    try {
      await deleteAccount(password);
      // A navegação volta para a Home pelo useEffect acima
    } catch (error) {
      setFormError(getErrorMessage(error, { 422: 'Senha incorreta.' }));
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>‹ Início</Text>
        </Pressable>
        <Text style={styles.title}>Minha conta</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dados do usuário */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        <PrimaryButton
          title="Sair da conta"
          onPress={handleSignOut}
          loading={signingOut}
          disabled={deleting}
          style={styles.signOut}
        />

        {/* Zona de perigo: exclusão definitiva */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Excluir conta</Text>
          <Text style={styles.dangerText}>
            Apaga definitivamente seu cadastro e seu progresso. Essa ação não pode ser desfeita.
          </Text>

          {!confirming ? (
            <PrimaryButton
              title="Excluir minha conta"
              variant="danger"
              onPress={() => setConfirming(true)}
              disabled={signingOut}
            />
          ) : (
            <View>
              <FormInput
                label="Confirme com sua senha"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
                placeholder="Sua senha"
                secure
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleDelete}
                editable={!deleting}
                autoFocus
              />

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <PrimaryButton
                title="Excluir definitivamente"
                variant="danger"
                onPress={handleDelete}
                loading={deleting}
              />
              <PrimaryButton
                title="Cancelar"
                variant="ghost"
                onPress={cancelDelete}
                disabled={deleting}
                style={{ marginTop: 4 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  back: { color: theme.colors.textMuted, fontSize: 16, width: 60 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  name: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  email: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  signOut: { marginBottom: 28 },
  dangerCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '66',
    backgroundColor: theme.colors.error + '14',
    padding: 16,
  },
  dangerTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  dangerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  formError: { color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
});
