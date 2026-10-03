/**
 * Tela de níveis de uma categoria (aberta ao tocar numa categoria).
 *
 * Estrutura:
 * - Topo: "‹ Categorias", ícone e nome da categoria e quantos níveis estão disponíveis.
 * - Cartão "Seu progresso": cruzadinhas concluídas, barra e porcentagem.
 * - Uma seção por dificuldade (Fácil, Médio, Difícil) com os 4 níveis em grade.
 * - Faixa "Assine o Premium" fixa no rodapé (só para quem não assina).
 *
 * Cada nível aparece em um de 4 estados:
 * - Concluído (borda verde, ✓);   - Em andamento (borda azul, ▶);
 * - Premium (cadeado; abre a tela do Premium);   - Não iniciado (neutro, "Jogar").
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DIFFICULTIES, getCategory, getPuzzlesByCategory } from '../data/puzzles';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { canPlayPuzzle, hasPremium, PREMIUM_PRICE_LABEL } from '../config/access';
import { theme } from '../theme';

/** Frase de cada dificuldade, exibida abaixo do título da seção. */
const DIFFICULTY_DESCRIPTIONS = {
  facil: 'Comece pelos conceitos fundamentais.',
  medio: 'Aprofunde seus conhecimentos.',
  dificil: 'Desafie-se e teste seus limites.',
};

/** Cores dos estados dos níveis. */
const COLORS = {
  done: theme.colors.solved, // verde: concluído
  progress: theme.colors.primary, // azul: em andamento
  premium: '#7C5CFF', // roxo: exclusivo Premium
};

/**
 * Situação de um nível para o usuário: 'locked' (Premium), 'done' (concluído),
 * 'progress' (já tem letras preenchidas) ou 'new' (não iniciado).
 */
function levelStatus(puzzle, record, user) {
  if (!canPlayPuzzle(puzzle, user)) return 'locked';
  if (record?.completed) return 'done';
  if (record && Object.keys(record.cells ?? {}).length > 0) return 'progress';
  return 'new';
}

export default function LevelsScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const category = getCategory(categoryId);
  const puzzles = getPuzzlesByCategory(categoryId);
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const { user } = useAuth();

  // Resumo da categoria
  const total = puzzles.length;
  const available = puzzles.filter((p) => canPlayPuzzle(p, user)).length;
  const completed = puzzles.filter((p) => progress[p.id]?.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const showPremiumBanner = !hasPremium(user);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          // espaço extra para o conteúdo não ficar escondido atrás da faixa do Premium
          paddingBottom: insets.bottom + (showPremiumBanner ? 110 : 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Voltar */}
        <Pressable
          style={styles.backRow}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar para categorias"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.textMuted} />
          <Text style={styles.back}>Categorias</Text>
        </Pressable>

        {/* Cabeçalho da categoria */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: category.color }]}>
            <MaterialCommunityIcons name={category.icon || 'brain'} size={30} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
              {category.name}
            </Text>
            <Text style={styles.heroSub}>
              {available} de {total} níveis disponíveis
            </Text>
          </View>
        </View>

        {/* Seu progresso */}
        <View style={styles.progressCard}>
          <View style={styles.trophy}>
            <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>Seu progresso</Text>
            <Text style={styles.progressSub}>
              {completed} de {total} cruzadinhas concluídas
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
          </View>
        </View>

        {/* Seções por dificuldade */}
        {DIFFICULTIES.map((diff) => {
          const levels = puzzles
            .filter((p) => p.difficulty === diff.id)
            .sort((a, b) => a.level - b.level);
          const doneInSection = levels.filter((p) => progress[p.id]?.completed).length;

          return (
            <View key={diff.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.dot, { backgroundColor: diff.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{diff.name}</Text>
                  <Text style={styles.sectionDescription}>{DIFFICULTY_DESCRIPTIONS[diff.id]}</Text>
                </View>
                <View style={[styles.countPill, doneInSection > 0 && styles.countPillActive]}>
                  <Text style={[styles.countText, doneInSection > 0 && { color: COLORS.done }]}>
                    {doneInSection} {doneInSection === 1 ? 'concluído' : 'concluídos'}
                  </Text>
                </View>
              </View>

              <View style={styles.grid}>
                {levels.map((p) => (
                  <LevelCard
                    key={p.id}
                    puzzle={p}
                    record={progress[p.id]}
                    status={levelStatus(p, progress[p.id], user)}
                    onPress={(status) =>
                      navigation.navigate(status === 'locked' ? 'Premium' : 'Game', { id: p.id })
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Faixa fixa do Premium (somente para quem não assina) */}
      {showPremiumBanner ? (
        <View style={[styles.bannerWrap, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable
            style={({ pressed }) => [styles.banner, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('Premium')}
            accessibilityRole="button"
            accessibilityLabel={`Assine o Premium por ${PREMIUM_PRICE_LABEL}`}
          >
            <MaterialCommunityIcons name="crown" size={30} color={COLORS.premium} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Assine o Premium</Text>
              <Text style={styles.bannerText} numberOfLines={2}>
                Tenha acesso a todo o conteúdo.
              </Text>
            </View>
            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>{PREMIUM_PRICE_LABEL}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Cartão de um nível, com aparência conforme a situação (status). */
function LevelCard({ puzzle, record, status, onPress }) {
  const words = puzzle.entries.length;

  // Aparência de cada situação
  const look = {
    done: { border: COLORS.done, bg: COLORS.done + '14', icon: 'check-bold', badge: 'Concluído', badgeBg: COLORS.done + '33', badgeColor: COLORS.done },
    progress: { border: COLORS.progress, bg: COLORS.progress + '1A', icon: 'play', badge: 'Em andamento', badgeBg: COLORS.progress, badgeColor: '#fff' },
    locked: { border: theme.colors.cardBorder, bg: theme.colors.bgSoft, icon: 'lock', badge: 'Premium', badgeBg: COLORS.premium + '40', badgeColor: '#D9CFFF' },
    new: { border: theme.colors.cardBorder, bg: theme.colors.card, icon: 'play', badge: 'Jogar', badgeBg: theme.colors.cardBorder, badgeColor: theme.colors.text },
  }[status];

  // Em andamento mostra quantas palavras já estão certas
  const subtitle =
    status === 'progress' ? `${record?.solvedWords ?? 0}/${words} palavras` : `${words} palavras`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.levelCard,
        { borderColor: look.border, backgroundColor: look.bg },
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => onPress(status)}
      accessibilityRole="button"
      accessibilityLabel={`Nível ${puzzle.level}, ${look.badge}`}
    >
      <View style={styles.levelTop}>
        <Text style={[styles.levelNum, status === 'locked' && { color: theme.colors.textMuted }]}>
          {puzzle.level}
        </Text>

        {/* Ícone de situação no canto superior direito */}
        {status === 'done' ? (
          <View style={[styles.statusCircle, { backgroundColor: COLORS.done }]}>
            <MaterialCommunityIcons name="check-bold" size={16} color={theme.colors.bg} />
          </View>
        ) : status === 'progress' ? (
          <View style={[styles.statusCircle, { backgroundColor: COLORS.progress }]}>
            <MaterialCommunityIcons name="play" size={18} color={theme.colors.bg} />
          </View>
        ) : (
          <MaterialCommunityIcons
            name={look.icon}
            size={22}
            color={status === 'locked' ? theme.colors.textMuted : theme.colors.cardBorder}
          />
        )}
      </View>

      <Text style={styles.levelSub}>{subtitle}</Text>

      <View style={[styles.badge, { backgroundColor: look.badgeBg }]}>
        {status === 'locked' ? (
          <MaterialCommunityIcons name="star" size={13} color={look.badgeColor} />
        ) : null}
        <Text style={[styles.badgeText, { color: look.badgeColor }]}>{look.badge}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  // Voltar e cabeçalho
  backRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -6, marginBottom: 14 },
  back: { color: theme.colors.textMuted, fontSize: 17, fontWeight: '600' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: theme.colors.text, fontSize: 26, fontWeight: '900' },
  heroSub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },

  // Seu progresso
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 24,
  },
  trophy: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  progressSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.done },
  progressPercent: { color: theme.colors.text, fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Seções
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '900' },
  sectionDescription: { color: theme.colors.textMuted, fontSize: 12.5, marginTop: 1 },
  countPill: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 8,
  },
  countPillActive: { borderColor: COLORS.done + '55', backgroundColor: COLORS.done + '14' },
  countText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },

  // Cartões dos níveis
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  levelCard: {
    width: '48.3%',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelNum: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  statusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },

  // Faixa do Premium
  bannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: theme.colors.bg + 'F2',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bannerTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
  bannerText: { color: theme.colors.textMuted, fontSize: 11.5, marginTop: 2 },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.premium,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
  },
  bannerButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
