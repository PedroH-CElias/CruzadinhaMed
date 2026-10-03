/**
 * Tela "Minha conta" (aberta ao tocar no "Olá, {nome}" da Home).
 *
 * - Cabeçalho com avatar, nome e e-mail.
 * - Atalhos: "Meus dados" (nome e senha) e "Assinatura" (situação do Premium).
 * - Sair da conta e Excluir conta.
 *
 * A exclusão é exigida pela Apple (regra 5.1.1(v)) e pelo Google Play: precisa estar
 * disponível dentro do app. Ela pede a senha como confirmação e é definitiva.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, LEGAL_URLS } from '../services/api';
import { hasPremium } from '../config/access';
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

  // Situação da assinatura Premium (vem do backend em /users/me)
  const premiumActive = hasPremium(user);
  const premiumUntil = user.premiumUntil
    ? new Date(user.premiumUntil).toLocaleDateString('pt-BR')
    : null;
  const subscriptionLabel = premiumActive
    ? premiumUntil
      ? `Premium ativo até ${premiumUntil}`
      : 'Premium ativo'
    : 'Assinatura inativa';

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
      <ScreenHeader title="Minha conta" backLabel="Início" onBack={() => navigation.goBack()} />

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

        {/* Atalhos */}
        <View style={styles.menu}>
          <MenuItem
            icon="account-edit-outline"
            title="Meus dados"
            subtitle="Alterar nome e senha"
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="crown-outline"
            title="Assinatura"
            subtitle={subscriptionLabel}
            subtitleColor={premiumActive ? theme.colors.solved : theme.colors.error}
            onPress={() => navigation.navigate('Subscription')}
          />
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

        {/* Documentos legais (abrem no navegador) */}
        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)} hitSlop={8} accessibilityRole="link">
            <Text style={styles.legalLink}>Política de Privacidade</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)} hitSlop={8} accessibilityRole="link">
            <Text style={styles.legalLink}>Termos de Uso</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/** Item da lista de atalhos (ícone, título, subtítulo e seta). */
function MenuItem({ icon, title, subtitle, subtitleColor, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={[styles.menuSubtitle, subtitleColor && { color: subtitleColor }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
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

  // Atalhos
  menu: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  menuSubtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.cardBorder, marginLeft: 66 },

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
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  legalLink: { color: theme.colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
  legalDot: { color: theme.colors.textMuted, marginHorizontal: 10 },
});
