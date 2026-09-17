import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, getPuzzlesByCategory } from '../data/puzzles';
import { theme } from '../theme';

const ICONS = {
  anatomia: '🦴',
  casos: '🩺',
  fisiologia: '❤️',
  farmacologia: '💊',
};

export default function CategoriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Início</Text>
        </Pressable>
        <Text style={styles.title}>Categorias</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((c) => {
          const count = getPuzzlesByCategory(c.id).length;
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate('Levels', { categoryId: c.id })}
            >
              <View style={[styles.iconBox, { backgroundColor: c.color + '22' }]}>
                <Text style={styles.icon}>{ICONS[c.id] || '🧠'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardSub}>{count} cruzadinhas · 3 níveis</Text>
              </View>
              <View style={[styles.play, { backgroundColor: c.color }]}>
                <Text style={styles.playText}>›</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.note}>
          Cada categoria tem níveis Fácil, Médio e Difícil.
        </Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 26 },
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  cardSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: -2 },
  note: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
