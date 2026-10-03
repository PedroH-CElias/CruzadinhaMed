/**
 * Tela de categorias, dividida em ciclos:
 * - Ciclo básico: Anatomia, Casos clínicos, Fisiologia e Farmacologia;
 * - Ciclo avançado / Internato: Clínica médica, Urgência e emergência, Pediatria,
 *   Cirurgia geral, Ginecologia e obstetrícia e Medicina de família e comunidade.
 *
 * Os ciclos e as categorias vêm de data/puzzles.js (CYCLES e CATEGORIES, campo "cycle").
 * Cada cartão mostra quantas cruzadinhas foram concluídas e quantas estão liberadas.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CYCLES, getCategoriesByCycle, getPuzzlesByCategory } from '../data/puzzles';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { canPlayPuzzle } from '../config/access';
import { theme } from '../theme';

export default function CategoriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const { user } = useAuth();

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
        {CYCLES.map((cycle) => (
          <View key={cycle.id} style={styles.section}>
            {/* Subtítulo do ciclo */}
            <Text style={styles.sectionTitle}>{cycle.name}</Text>
            <Text style={styles.sectionDescription}>{cycle.description}</Text>

            {getCategoriesByCycle(cycle.id).map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                progress={progress}
                user={user}
                onPress={() => navigation.navigate('Levels', { categoryId: c.id })}
              />
            ))}
          </View>
        ))}

        <Text style={styles.note}>
          Cada categoria tem níveis Fácil, Médio e Difícil.
        </Text>
      </ScrollView>
    </View>
  );
}

/** Cartão de uma categoria com ícone, nome, progresso e acesso. */
function CategoryCard({ category: c, progress, user, onPress }) {
  const puzzles = getPuzzlesByCategory(c.id);
  const count = puzzles.length;
  // Quantas cruzadinhas desta categoria já foram concluídas
  const done = puzzles.filter((p) => progress[p.id]?.completed).length;
  // Quantas o usuário pode jogar (grátis ou todas, se for Premium)
  const available = puzzles.filter((p) => canPlayPuzzle(p, user)).length;
  const accessLabel = available === count ? 'todas liberadas' : `${available} grátis`;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: c.color + '22' }]}>
        <MaterialCommunityIcons name={c.icon || 'brain'} size={28} color={c.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={2}>{c.name}</Text>
        <Text style={styles.cardSub}>{done} de {count} concluídas · {accessLabel}</Text>
      </View>
      <View style={[styles.play, { backgroundColor: c.color }]}>
        <Text style={styles.playText}>›</Text>
      </View>
    </Pressable>
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
  section: { marginBottom: 18 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  sectionDescription: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 12,
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
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  cardSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: -2 },
  note: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
