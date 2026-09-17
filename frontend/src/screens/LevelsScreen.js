import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DIFFICULTIES,
  getCategory,
  getPuzzlesByCategory,
} from '../data/puzzles';
import { theme } from '../theme';

export default function LevelsScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const category = getCategory(categoryId);
  const puzzles = getPuzzlesByCategory(categoryId);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Categorias</Text>
        </Pressable>
        <Text style={styles.title}>{category.name}</Text>
        <View style={{ width: 92 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {DIFFICULTIES.map((diff) => {
          const levels = puzzles
            .filter((p) => p.difficulty === diff.id)
            .sort((a, b) => a.level - b.level);
          return (
            <View key={diff.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.dot, { backgroundColor: diff.color }]} />
                <Text style={styles.sectionTitle}>{diff.name}</Text>
                <Text style={styles.sectionCount}>{levels.length} níveis</Text>
              </View>

              <View style={styles.grid}>
                {levels.map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [
                      styles.levelCard,
                      { borderColor: diff.color + '55' },
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => navigation.navigate('Game', { id: p.id })}
                  >
                    <Text style={[styles.levelNum, { color: diff.color }]}>
                      {p.level}
                    </Text>
                    <Text style={styles.levelSub}>
                      {p.entries.length} palavras
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
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
  back: { color: theme.colors.textMuted, fontSize: 16, width: 92 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  section: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  sectionCount: { color: theme.colors.textMuted, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  levelCard: {
    width: '47%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  levelNum: { fontSize: 30, fontWeight: '900' },
  levelSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
});
