import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PUZZLES, CATEGORIES } from '../data/puzzles';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const totalWords = PUZZLES.reduce((s, p) => s + p.entries.length, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 30 }]}>
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
  hero: { marginTop: 20 },
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
