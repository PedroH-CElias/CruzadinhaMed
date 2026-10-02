/**
 * Botão padrão do app.
 *
 * Props:
 * - title:    texto do botão;
 * - onPress:  ação ao tocar;
 * - loading:  mostra um indicador de carregamento e bloqueia novos toques;
 * - disabled: desabilita o botão;
 * - variant:  'primary' (fundo azul, padrão), 'danger' (fundo vermelho, ações destrutivas)
 *             ou 'ghost' (só texto, para ações secundárias).
 */
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}) {
  const isGhost = variant === 'ghost';
  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : variant === 'danger' ? styles.danger : styles.primary,
        pressed && !blocked && { opacity: 0.85 },
        blocked && !loading && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? theme.colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primary: { backgroundColor: theme.colors.primary },
  danger: { backgroundColor: theme.colors.error },
  ghost: { backgroundColor: 'transparent' },
  text: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ghostText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '700' },
});
