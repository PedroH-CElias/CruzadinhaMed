/**
 * Tela "Assinatura" (aberta em Minha conta).
 *
 * Mostra a situação do Premium (ativa/inativa), a validade, o valor e o que está incluso.
 * - Inativa: botão para assinar (abre a tela do Premium).
 * - Ativa: botão "Cancelar assinatura". POR ENQUANTO mostra "em breve".
 *
 * Quando a compra existir: assinaturas da App Store / Google Play são canceladas na
 * própria loja (o app não pode cancelar diretamente). O botão deverá abrir a página de
 * assinaturas da loja; o acesso continua até o fim do período já pago.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { hasPremium, PREMIUM_PRICE_LABEL } from '../config/access';
import { PUZZLES, CATEGORIES } from '../data/puzzles';
import { theme } from '../theme';

/** O que a assinatura inclui. */
const BENEFITS = [
  `Todas as ${PUZZLES.length} cruzadinhas liberadas`,
  `As ${CATEGORIES.length} categorias, do ciclo básico ao internato`,
  'Progresso salvo na conta, em qualquer aparelho',
  'Novos conteúdos assim que forem lançados',
];

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [showSoon, setShowSoon] = useState(false);

  // Se a sessão acabar, volta para a Home
  useEffect(() => {
    if (!isAuthenticated) navigation.popToTop();
  }, [isAuthenticated, navigation]);

  if (!user) return <View style={styles.container} />;

  const active = hasPremium(user);
  const validUntil = user.premiumUntil
    ? new Date(user.premiumUntil).toLocaleDateString('pt-BR')
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Assinatura" backLabel="Minha conta" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plano */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <LinearGradient
              colors={[theme.colors.primary, '#2457E6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crown}
            >
              <MaterialCommunityIcons name="crown-outline" size={28} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>CruzadinhaMed Premium</Text>
              <View style={[styles.statusPill, active ? styles.pillActive : styles.pillInactive]}>
                <Text style={[styles.statusText, { color: active ? theme.colors.solved : theme.colors.error }]}>
                  {active ? 'Ativa' : 'Inativa'}
                </Text>
              </View>
            </View>
          </View>

          <InfoRow label="Situação" value={active ? 'Assinatura ativa' : 'Sem assinatura ativa'} />
          <InfoRow
            label={active ? 'Válida até' : 'Venceu em'}
            value={validUntil ?? '—'}
          />
          <InfoRow label="Valor" value={PREMIUM_PRICE_LABEL} last />
        </View>

        {/* O que está incluso */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>O que está incluso</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.solved} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {active ? (
          <>
            <PrimaryButton
              title="Cancelar assinatura"
              variant="ghost"
              onPress={() => setShowSoon(true)}
              style={styles.cancelButton}
            />
            {/* Provisório até existir a compra pela loja */}
            {showSoon ? (
              <View style={styles.soonBox}>
                <Text style={styles.soonBadge}>EM BREVE</Text>
                <Text style={styles.soonText}>
                  O gerenciamento da assinatura estará disponível junto com a compra pelo app.
                </Text>
              </View>
            ) : null}
            <Text style={styles.note}>
              Ao cancelar, você continua com acesso ao Premium até o fim do período já pago.
            </Text>
          </>
        ) : (
          <PrimaryButton title="Assinar Premium" onPress={() => navigation.navigate('Premium')} />
        )}
      </ScrollView>
    </View>
  );
}

/** Linha "rótulo: valor" do cartão do plano. */
function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  crown: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  planName: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
  },
  pillActive: { borderColor: theme.colors.solved + '66', backgroundColor: theme.colors.solved + '1A' },
  pillInactive: { borderColor: theme.colors.error + '66', backgroundColor: theme.colors.error + '14' },
  statusText: { fontSize: 12, fontWeight: '800' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  infoLabel: { color: theme.colors.textMuted, fontSize: 14 },
  infoValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: theme.colors.text, fontSize: 14, lineHeight: 20, flex: 1 },
  cancelButton: { borderWidth: 1, borderColor: theme.colors.error + '66' },
  soonBox: { alignItems: 'center', marginTop: 14 },
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
    marginBottom: 8,
  },
  soonText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  note: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
