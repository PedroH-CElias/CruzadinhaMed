/**
 * Estrutura visual compartilhada pelas telas de Login e Cadastro:
 * botão de fechar (volta ao modo convidado), logo, título, subtítulo e o conteúdo
 * do formulário. Também cuida do teclado (o formulário sobe quando o teclado abre).
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function AuthScreenLayout({ title, subtitle, onClose, children }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar e continuar como convidado"
          >
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.logoBadge}>
          <Text style={styles.logoPlus}>+</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  close: { color: theme.colors.textMuted, fontSize: 22, fontWeight: '700' },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoPlus: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: -3 },
  title: { color: theme.colors.text, fontSize: theme.font.title, fontWeight: '900' },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  form: { marginTop: 28 },
});
