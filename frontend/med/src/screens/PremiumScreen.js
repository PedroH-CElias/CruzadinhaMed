/**
 * Tela do Premium (aberta como modal pela Home ou ao tocar numa cruzadinha bloqueada).
 *
 * POR ENQUANTO a assinatura ainda não existe: a tela apresenta os benefícios e avisa
 * que estará disponível em breve.
 *
 * Quando for implementar a compra: assinatura de conteúdo digital dentro do app
 * PRECISA ser cobrada pela loja (compra no app da Apple e do Google). Isso exige
 * um development build (não funciona no Expo Go).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import { PUZZLES, CATEGORIES } from '../data/puzzles';
import { PREMIUM_PRICE_LABEL } from '../config/access';
import { theme } from '../theme';

/** Benefícios exibidos na lista. */
const BENEFITS = [
  `Todas as ${PUZZLES.length} cruzadinhas liberadas`,
  `As ${CATEGORIES.length} categorias em todos os níveis de dificuldade`,
  'Novos conteúdos assim que forem lançados',
  'Apoie o desenvolvimento do CruzadinhaMed',
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  /** Fecha o modal. */
  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  /** Fecha e leva para as categorias, para continuar jogando as grátis. */
  const playFree = () => {
    navigation.popToTop();
    navigation.navigate('Categories');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fechar">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      {/* Coroa em destaque */}
      <LinearGradient
        colors={[theme.colors.primary, '#2457E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.crownBadge}
      >
        <MaterialCommunityIcons name="crown-outline" size={44} color="#fff" />
      </LinearGradient>

      <Text style={styles.title}>CruzadinhaMed Premium</Text>
      <Text style={styles.price}>{PREMIUM_PRICE_LABEL}</Text>

      {/* Benefícios */}
      <View style={styles.card}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.solved} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {/* Aviso de "em breve" */}
      <View style={styles.soonBox}>
        <Text style={styles.soonBadge}>EM BREVE</Text>
        <Text style={styles.soonText}>
          A assinatura estará disponível em breve. Enquanto isso, aproveite as cruzadinhas grátis.
        </Text>
      </View>

      <PrimaryButton title="Jogar as cruzadinhas grátis" onPress={playFree} />
      <PrimaryButton title="Voltar" variant="ghost" onPress={close} style={{ marginTop: 4 }} />

      {/* Quem já assina (e ainda não entrou) vai direto para o login */}
      {!isAuthenticated ? (
        <Pressable
          style={styles.signInRow}
          onPress={() => navigation.replace('Login')}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={styles.signInQuestion}>Já é assinante? </Text>
          <Text style={styles.signInLink}>Entrar</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  close: { color: theme.colors.textMuted, fontSize: 22, fontWeight: '700' },
  crownBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  price: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 18,
    gap: 14,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { color: theme.colors.text, fontSize: 15, lineHeight: 21, flex: 1 },
  soonBox: { alignItems: 'center', marginVertical: 24 },
  soonBadge: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  soonText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  signInRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  signInQuestion: { color: theme.colors.textMuted, fontSize: 15 },
  signInLink: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
});
