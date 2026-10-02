import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PUZZLES, CATEGORIES } from '../data/puzzles';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();
  const totalWords = PUZZLES.reduce((s, p) => s + p.entries.length, 0);

  // Primeiro nome do usuário para a saudação ("Olá, Pedro")
  const firstName = user?.name?.split(' ')[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Barra superior: saudação + Sair (logado) ou botão Entrar (convidado) */}
      <View style={styles.topBar}>
        {isAuthenticated ? (
          <>
            {/* Tocar na saudação abre a tela "Minha conta" */}
            <Pressable
              style={styles.greetingButton}
              onPress={() => navigation.navigate('Account')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Abrir minha conta"
            >
              <Text style={styles.greeting} numberOfLines={1}>
                Olá, {firstName} <Text style={styles.greetingChevron}>›</Text>
              </Text>
            </Pressable>
            <Pressable onPress={signOut} hitSlop={10} accessibilityRole="button">
              <Text style={styles.signOut}>Sair</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View />
            <Pressable
              style={({ pressed }) => [styles.signInPill, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
            >
              <Text style={styles.signInText}>Entrar</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoPlus}>+</Text>
          </View>
          <Text style={styles.brand}>CruzadinhaMed</Text>
        </View>
        <Text style={styles.tagline}>
          Aprenda medicina resolvendo palavras cruzadas.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={CATEGORIES.length} label="Categorias" />
        <Stat value={PUZZLES.length} label="Cruzadinhas" />
        <Stat value={totalWords} label="Palavras" />
      </View>

      {/* Convite para criar conta, exibido apenas no modo convidado */}
      {!isAuthenticated && (
        <Pressable
          style={({ pressed }) => [styles.accountCard, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>Crie uma conta grátis</Text>
            <Text style={styles.accountSub}>Salve seu progresso e jogue em qualquer aparelho.</Text>
          </View>
          <Text style={styles.accountArrow}>›</Text>
        </Pressable>
      )}

      <View style={{ flex: 1 }} />

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.navigate('Categories')}
      >
        <Text style={styles.ctaText}>Jogar agora</Text>
      </Pressable>

      <Text style={[styles.footer, { marginBottom: insets.bottom + 10 }]}>
        Anatomia · Casos clínicos · Fisiologia · Farmacologia
      </Text>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  greetingButton: { flex: 1, marginRight: 12 },
  greeting: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  greetingChevron: { color: theme.colors.primary, fontWeight: '900' },
  signOut: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '700' },
  signInPill: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  signInText: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary + '1F',
    borderWidth: 1,
    borderColor: theme.colors.primary + '66',
  },
  accountTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  accountSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  accountArrow: { color: theme.colors.primary, fontSize: 28, fontWeight: '900', marginLeft: 8 },
  hero: { marginTop: 36 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoPlus: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: -2 },
  brand: { color: theme.colors.text, fontSize: 26, fontWeight: '900' },
  tagline: { color: theme.colors.textMuted, fontSize: 17, lineHeight: 24 },
  statsRow: { flexDirection: 'row', marginTop: 34, gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  statValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footer: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
