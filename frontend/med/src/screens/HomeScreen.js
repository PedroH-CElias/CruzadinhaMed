/**
 * Tela inicial do CruzadinhaMed.
 *
 * REGRA DE NEGÓCIO: só assinantes Premium têm conta.
 *
 * Convidado (sem conta):
 * - cartão "Acesse gratuitamente": abre as categorias (parte das cruzadinhas é grátis);
 * - cartão "Assinar Premium": abre a tela do Premium;
 * - link "Já é assinante? Entrar": abre o login.
 *
 * Logado:
 * - topo: "Olá, {nome}" (abre Minha conta);
 * - centro: apenas o botão "Jogar agora";
 * - se a assinatura não estiver ativa: aviso com opção de renovar (vê só as grátis).
 *
 * LAYOUT FIXO (sem rolagem) que se adapta a qualquer tela:
 * - todos os tamanhos (fontes, ícones, espaços) são multiplicados por uma ESCALA calculada
 *   a partir da altura e da largura disponíveis (ver calcScale);
 * - os espaços entre os blocos são flexíveis (Spacer): em telas altas eles crescem, em
 *   telas baixas encolhem, e o conteúdo sempre cabe sem rolar;
 * - em tablets o conteúdo fica centralizado com largura máxima.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CYCLES } from '../data/puzzles';
import { useAuth } from '../context/AuthContext';
import { PREMIUM_PRICE_LABEL, hasPremium } from '../config/access';
import { theme } from '../theme';

/** Azul mais claro usado em textos de destaque (ex.: "Med" do logo). */
const ACCENT = '#5B8CFF';

/** Altura útil (dp) para a qual os tamanhos "base" foram desenhados (celular comum). */
const REFERENCE_HEIGHT = 720;
/** Largura (dp) para a qual os tamanhos "base" foram desenhados. */
const REFERENCE_WIDTH = 380;
/** Limites da escala: não fica minúsculo em telas pequenas nem gigante em tablets. */
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.15;
/** Largura máxima do conteúdo (tablets e telas largas). */
const MAX_CONTENT_WIDTH = 480;

/**
 * Calcula a escala da tela: o menor valor entre "quanto a altura cabe" e
 * "quanto a largura cabe", dentro dos limites MIN_SCALE..MAX_SCALE.
 */
function calcScale(usableHeight, usableWidth) {
  const raw = Math.min(usableHeight / REFERENCE_HEIGHT, usableWidth / REFERENCE_WIDTH);
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

/**
 * Texto com limite de aumento pela fonte do sistema (acessibilidade). Sem esse limite,
 * quem usa fonte gigante no celular faria o layout fixo estourar a tela.
 */
function T(props) {
  return <Text maxFontSizeMultiplier={1.25} {...props} />;
}

/** Espaço flexível entre blocos: cresce em telas altas e encolhe até `min` nas baixas. */
function Spacer({ flex = 1, min = 0 }) {
  return <View style={{ flex, minHeight: min }} />;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();

  // Escala de todos os tamanhos da tela, conforme o espaço útil do aparelho
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const scale = calcScale(height - insets.top - insets.bottom, contentWidth);
  const s = (value) => Math.round(value * scale);
  const styles = useMemo(() => createStyles(scale), [scale]);

  // Primeiro nome do usuário para a saudação ("Olá, Pedro")
  const firstName = user?.name?.split(' ')[0];
  const premiumActive = hasPremium(user);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + s(8), paddingBottom: insets.bottom + s(12) },
      ]}
    >
      <View style={styles.content}>
        {/* Topo: só aparece logado ("Olá, nome", que abre Minha conta) */}
        <View style={styles.topBar}>
          {isAuthenticated ? (
            <Pressable
              style={({ pressed }) => [styles.accountButton, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Account')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Abrir minha conta"
            >
              <MaterialCommunityIcons name="account-circle-outline" size={s(18)} color={theme.colors.textMuted} />
              <T style={styles.accountText} numberOfLines={1}>
                Olá, {firstName}
              </T>
            </Pressable>
          ) : null}
        </View>

        <Spacer flex={1.2} min={s(8)} />

        {/* Logo */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={[ACCENT, '#2F6BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <T style={styles.logoPlus}>+</T>
          </LinearGradient>
          <T style={styles.brand} numberOfLines={1} adjustsFontSizeToFit>
            Cruzadinha<T style={styles.brandAccent}>Med</T>
          </T>
        </View>

        <T style={styles.tagline}>Aprenda medicina resolvendo{'\n'}palavras cruzadas.</T>

        <Spacer flex={1} min={s(12)} />

        {/* Destaques */}
        <View style={styles.features}>
          <Feature icon="brain" label={'Reforce\nseus conhecimentos'} styles={styles} iconSize={s(40)} />
          <Feature icon="bullseye-arrow" label={'Estude de forma\nprática e divertida'} styles={styles} iconSize={s(40)} />
        </View>

        <Spacer flex={1} min={s(12)} />

        {isAuthenticated ? (
          <View>
            {/* Logado: um único botão para jogar */}
            <Pressable
              onPress={() => navigation.navigate('Categories')}
              accessibilityRole="button"
              style={({ pressed }) => pressed && { opacity: 0.92 }}
            >
              <LinearGradient
                colors={['#4F86FF', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playButton}
              >
                <MaterialCommunityIcons name="play-circle-outline" size={s(24)} color="#fff" />
                <T style={styles.playText}>Jogar agora</T>
              </LinearGradient>
            </Pressable>

            {/* Assinatura vencida/cancelada: joga só as grátis e pode renovar */}
            {!premiumActive ? (
              <Pressable
                style={({ pressed }) => [styles.inactiveBox, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('Premium')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="alert-circle-outline" size={s(20)} color={theme.colors.error} />
                <T style={styles.inactiveText}>
                  Sua assinatura não está ativa. Você tem acesso só às cruzadinhas grátis.{' '}
                  <T style={styles.inactiveLink}>Renovar</T>
                </T>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View>
            {/* Cartão: acesso grátis */}
            <Pressable
              style={({ pressed }) => [styles.card, styles.freeCard, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate('Categories')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="book-open-outline" size={s(20)} color={theme.colors.text} />
              <View style={styles.cardBody}>
                <T style={styles.cardTitle}>Acesse gratuitamente</T>
                <T style={styles.cardText}>Acesse algumas cruzadinhas e experimente o app.</T>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={s(26)} color={theme.colors.text} />
            </Pressable>

            {/* Cartão: Premium (fundo em degradê) */}
            <Pressable
              onPress={() => navigation.navigate('Premium')}
              accessibilityRole="button"
              style={({ pressed }) => pressed && { opacity: 0.92 }}
            >
              <LinearGradient
                colors={['#4F86FF', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <MaterialCommunityIcons name="crown-outline" size={s(20)} color="#fff" />
                <View style={styles.cardBody}>
                  <T style={[styles.cardTitle, styles.premiumTitle]}>Assinar Premium</T>
                  <T style={styles.premiumPrice}>{PREMIUM_PRICE_LABEL}</T>
                  <T style={styles.premiumText}>
                    Tenha acesso a todas as cruzadinhas e acompanhe o seu progresso.
                  </T>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={s(26)} color="#fff" />
              </LinearGradient>
            </Pressable>

            {/* Login: só para quem já assina o Premium */}
            <Pressable
              style={styles.signInRow}
              onPress={() => navigation.navigate('Login')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Já é assinante? Entrar"
            >
              <T style={styles.signInQuestion}>Já é assinante? </T>
              <T style={styles.signInLink}>Entrar</T>
            </Pressable>
          </View>
        )}

        <Spacer flex={1.6} min={s(12)} />

        {/* Rodapé com os ciclos (Ciclo básico • Ciclo avançado / Internato) */}
        <T style={styles.footer} numberOfLines={1} adjustsFontSizeToFit>
          {CYCLES.map((c) => c.name).join('  •  ')}
        </T>
      </View>
    </View>
  );
}

/** Destaque com ícone e texto (ex.: "Reforce seus conhecimentos"). */
function Feature({ icon, label, styles, iconSize }) {
  return (
    <View style={styles.feature}>
      <MaterialCommunityIcons name={icon} size={iconSize} color={ACCENT} />
      <T style={styles.featureText}>{label}</T>
    </View>
  );
}

/**
 * Estilos da tela. Os números são os tamanhos "base" (escala 1) e passam por s(),
 * que aplica a escala calculada para o aparelho.
 */
function createStyles(scale) {
  const s = (value) => Math.round(value * scale);

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
    content: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: s(22) },

    // Topo
    topBar: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: s(32) },
    accountButton: { flexDirection: 'row', alignItems: 'center', gap: s(6), maxWidth: '60%' },
    accountText: { color: theme.colors.textMuted, fontSize: s(14), fontWeight: '700' },

    // Logo
    logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    logoBadge: {
      width: s(56),
      height: s(56),
      borderRadius: s(20),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: s(14),
    },
    logoPlus: { color: '#fff', fontSize: s(38), fontWeight: '900', marginTop: -s(4) },
    brand: { color: theme.colors.text, fontSize: s(28), fontWeight: '900', flexShrink: 1 },
    brandAccent: { color: ACCENT },
    tagline: {
      color: '#AEB8EC',
      fontSize: s(16),
      lineHeight: s(22),
      textAlign: 'center',
      marginTop: s(18),
    },

    // Destaques
    features: { flexDirection: 'row' },
    feature: { flex: 1, alignItems: 'center' },
    featureText: {
      color: theme.colors.text,
      fontSize: s(13.5),
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: s(18),
      marginTop: s(8),
    },

    // Cartões
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.radius.lg,
      paddingVertical: s(18),
      paddingHorizontal: s(18),
      marginBottom: s(14),
      gap: s(16),
    },
    freeCard: {
      backgroundColor: theme.colors.bgSoft,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    cardBody: { flex: 1 },
    cardTitle: { color: theme.colors.text, fontSize: s(17), fontWeight: '900', marginBottom: s(3) },
    cardText: { color: theme.colors.textMuted, fontSize: s(13), lineHeight: s(18) },
    premiumTitle: { color: '#fff' },
    premiumPrice: { color: '#fff', fontSize: s(14), fontWeight: '800', marginBottom: s(3) },
    premiumText: { color: '#E6ECFF', fontSize: s(12), lineHeight: s(17) },

    // Link "Já é assinante? Entrar"
    signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: s(6) },
    signInQuestion: { color: theme.colors.textMuted, fontSize: s(15) },
    signInLink: { color: ACCENT, fontSize: s(15), fontWeight: '900' },

    // Logado: botão Jogar agora e aviso de assinatura inativa
    playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(10),
      borderRadius: theme.radius.lg,
      paddingVertical: s(18),
    },
    playText: { color: '#fff', fontSize: s(18), fontWeight: '900' },
    inactiveBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: s(10),
      marginTop: s(14),
      padding: s(14),
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.error + '66',
      backgroundColor: theme.colors.error + '14',
    },
    inactiveText: { color: theme.colors.text, fontSize: s(13), lineHeight: s(19), flex: 1 },
    inactiveLink: { color: ACCENT, fontWeight: '900' },

    // Rodapé
    footer: { color: theme.colors.textMuted, fontSize: s(11), textAlign: 'center' },
  });
}
